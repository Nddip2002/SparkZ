import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAX_LINE_QUANTITY } from './dto/cart.dto.js';

const cartProductSelect = {
  id: true,
  name: true,
  slug: true,
  sku: true,
  unitPrice: true,
  stockQuantity: true,
  imageUrls: true,
  isActive: true,
} satisfies Prisma.ProductSelect;

/** User carts are always read live from the DB — never cached. */
@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  async getCart(userId: string) {
    const items = await this.prisma.cartItem.findMany({
      where: { userId },
      include: { product: { select: cartProductSelect } },
      orderBy: { addedAt: 'asc' },
    });

    const subtotal = items.reduce(
      (sum, i) => sum.add(i.product.unitPrice.mul(i.quantity)),
      new Prisma.Decimal(0),
    );
    const itemCount = items.reduce((n, i) => n + i.quantity, 0);
    return { items, subtotal: subtotal.toFixed(2), itemCount };
  }

  async add(userId: string, productId: string, quantity: number) {
    const product = await this.getPurchasableProduct(productId);
    const existing = await this.prisma.cartItem.findUnique({
      where: { userId_productId: { userId, productId } },
      select: { quantity: true },
    });
    const next = Math.min((existing?.quantity ?? 0) + quantity, MAX_LINE_QUANTITY);
    this.assertStock(product.stockQuantity, next);

    await this.prisma.cartItem.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId, quantity: next },
      update: { quantity: next },
    });
    return this.getCart(userId);
  }

  async update(userId: string, productId: string, quantity: number) {
    const product = await this.getPurchasableProduct(productId);
    this.assertStock(product.stockQuantity, quantity);

    const { count } = await this.prisma.cartItem.updateMany({ where: { userId, productId }, data: { quantity } });
    if (count === 0) throw new NotFoundException('Item is not in your cart');
    return this.getCart(userId);
  }

  async remove(userId: string, productId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId, productId } });
    return this.getCart(userId);
  }

  async clear(userId: string) {
    await this.prisma.cartItem.deleteMany({ where: { userId } });
    return this.getCart(userId);
  }

  private async getPurchasableProduct(productId: string) {
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isActive: true },
      select: { stockQuantity: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  private assertStock(available: number, requested: number): void {
    if (requested > available) {
      throw new BadRequestException(
        available === 0 ? 'This product is out of stock' : `Only ${available} unit(s) available`,
      );
    }
  }
}
