import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../generated/prisma/client.js';
import { OrderStatus } from '../generated/prisma/enums.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogCacheService } from '../products/catalog-cache.service.js';
import type { ShippingAddressDto } from './dto/order.dto.js';

type Tx = Prisma.TransactionClient;

const orderInclude = {
  items: {
    include: { product: { select: { id: true, name: true, slug: true, sku: true, imageUrls: true } } },
  },
} satisfies Prisma.OrderInclude;

/** Allowed admin status transitions. Terminal states cannot be changed. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  PROCESSING: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  SHIPPED: [OrderStatus.DELIVERED],
  DELIVERED: [],
  CANCELLED: [],
};

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);
  private readonly flatShipping: Prisma.Decimal;
  private readonly freeShippingThreshold: Prisma.Decimal;

  constructor(
    private readonly prisma: PrismaService,
    private readonly catalogCache: CatalogCacheService,
    config: ConfigService,
  ) {
    this.flatShipping = new Prisma.Decimal(config.get<string>('SHIPPING_FLAT_RATE') ?? '99');
    this.freeShippingThreshold = new Prisma.Decimal(config.get<string>('FREE_SHIPPING_THRESHOLD') ?? '999');
  }

  /**
   * Atomic checkout: validates the cart, decrements stock with a conditional update
   * (never below zero), prices server-side, generates the order number, writes the
   * order + items and clears the cart — all inside ONE transaction.
   */
  async checkout(userId: string, shippingAddress: ShippingAddressDto) {
    const order = await this.prisma.$transaction(
      async (tx) => {
        const cart = await tx.cartItem.findMany({
          where: { userId },
          include: { product: { select: { id: true, name: true, isActive: true } } },
          orderBy: { productId: 'asc' }, // consistent lock order prevents deadlocks
        });
        if (cart.length === 0) throw new BadRequestException('Your cart is empty');

        for (const item of cart) {
          if (!item.product.isActive) {
            throw new BadRequestException(`"${item.product.name}" is no longer available`);
          }
          // Conditional decrement: succeeds only if enough stock remains. Row lock is held until commit.
          const { count } = await tx.product.updateMany({
            where: { id: item.productId, isActive: true, stockQuantity: { gte: item.quantity } },
            data: { stockQuantity: { decrement: item.quantity } },
          });
          if (count === 0) {
            throw new ConflictException(`Insufficient stock for "${item.product.name}"`);
          }
        }

        // Read authoritative prices AFTER locking rows — never trust client prices.
        const products = await tx.product.findMany({
          where: { id: { in: cart.map((c) => c.productId) } },
          select: { id: true, unitPrice: true },
        });
        const priceById = new Map(products.map((p) => [p.id, p.unitPrice]));

        const lines = cart.map((c) => {
          const unitPrice = priceById.get(c.productId);
          if (!unitPrice) throw new ConflictException('Product pricing changed, please retry');
          return { productId: c.productId, quantity: c.quantity, unitPriceAtPurchase: unitPrice };
        });

        const subtotal = lines.reduce(
          (sum, l) => sum.add(l.unitPriceAtPurchase.mul(l.quantity)),
          new Prisma.Decimal(0),
        );
        const shippingCost = subtotal.gte(this.freeShippingThreshold) ? new Prisma.Decimal(0) : this.flatShipping;
        const totalAmount = subtotal.add(shippingCost);
        const orderNumber = await this.nextOrderNumber(tx);

        const created = await tx.order.create({
          data: {
            orderNumber,
            userId,
            shippingAddress: {
              fullName: shippingAddress.fullName,
              phone: shippingAddress.phone,
              line1: shippingAddress.line1,
              line2: shippingAddress.line2,
              city: shippingAddress.city,
              state: shippingAddress.state,
              postalCode: shippingAddress.postalCode,
              country: shippingAddress.country,
            },
            subtotal,
            shippingCost,
            totalAmount,
            items: { create: lines },
          },
          include: orderInclude,
        });

        await tx.cartItem.deleteMany({ where: { userId } });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted, timeout: 15_000 },
    );

    // Stock levels changed — drop cached catalog pages.
    await this.catalogCache.invalidateAll();
    this.logger.log(`Order ${order.orderNumber} created for user ${userId}`);
    return order;
  }

  /** SZ-YYYY-NNNN, serialized with a transaction-scoped advisory lock (safe behind PgBouncer). */
  private async nextOrderNumber(tx: Tx): Promise<string> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('sparkz_order_number'))`;
    const year = new Date().getUTCFullYear();
    const prefix = `SZ-${year}-`;
    const [row] = await tx.$queryRaw<{ max: number | null }[]>`
      SELECT MAX(CAST(split_part(order_number, '-', 3) AS INTEGER)) AS max
      FROM orders
      WHERE order_number LIKE ${prefix + '%'}`;
    const next = (row?.max ?? 0) + 1;
    return `${prefix}${String(next).padStart(4, '0')}`;
  }

  // ---------------- Customer history (never cached) ----------------

  listForUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findForUser(userId: string, id: string) {
    const order = await this.prisma.order.findFirst({ where: { id, userId }, include: orderInclude });
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  // ---------------- Admin ----------------

  listAll() {
    return this.prisma.order.findMany({ include: orderInclude, orderBy: { createdAt: 'desc' }, take: 200 });
  }

  /** Status update; cancelling restocks inventory in the same transaction. */
  async updateStatus(id: string, status: OrderStatus) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({ where: { id }, include: { items: true } });
      if (!current) throw new NotFoundException('Order not found');
      if (current.status === status) return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      if (!TRANSITIONS[current.status].includes(status)) {
        throw new BadRequestException(`Cannot change order from ${current.status} to ${status}`);
      }

      // Guard against concurrent updates: only transition from the status we read.
      const { count } = await tx.order.updateMany({ where: { id, status: current.status }, data: { status } });
      if (count === 0) throw new ConflictException('Order was modified concurrently, please retry');

      if (status === OrderStatus.CANCELLED) {
        for (const item of current.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
        }
      }
      return tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
    });

    if (status === OrderStatus.CANCELLED) await this.catalogCache.invalidateAll();
    return order;
  }
}
