import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CatalogCacheService } from './catalog-cache.service.js';
import type { ProductQueryDto } from './dto/product-query.dto.js';
import type { CreateProductDto, UpdateProductDto } from './dto/product-write.dto.js';

const DEFAULT_PAGE_SIZE = 24;

export interface CatalogFilters {
  categories: { category: string; subcategories: string[] }[];
  manufacturers: string[];
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CatalogCacheService,
  ) {}

  // ---------------- Public catalog (cached) ----------------

  async list(query: ProductQueryDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? DEFAULT_PAGE_SIZE;
    const key = `list:${JSON.stringify(Object.assign({}, query, { page, pageSize }))}`;

    return this.cache.wrap(key, async () => {
      const where = this.buildWhere(query);
      const [items, total] = await this.prisma.$transaction([
        this.prisma.product.findMany({
          where,
          orderBy: this.buildOrderBy(query.sort),
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        this.prisma.product.count({ where }),
      ]);
      return { items, total, page, pageSize };
    });
  }

  async findBySlug(slug: string) {
    const product = await this.cache.wrap(`slug:${slug}`, () =>
      this.prisma.product.findFirst({ where: { slug, isActive: true } }),
    );
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  filters(): Promise<CatalogFilters> {
    return this.cache.wrap('filters', async () => {
      const [cats, mfrs] = await Promise.all([
        this.prisma.product.findMany({
          where: { isActive: true },
          distinct: ['category', 'subcategory'],
          select: { category: true, subcategory: true },
          orderBy: [{ category: 'asc' }, { subcategory: 'asc' }],
        }),
        this.prisma.product.findMany({
          where: { isActive: true },
          distinct: ['manufacturer'],
          select: { manufacturer: true },
          orderBy: { manufacturer: 'asc' },
        }),
      ]);

      const grouped = new Map<string, Set<string>>();
      for (const { category, subcategory } of cats) {
        const set = grouped.get(category) ?? new Set<string>();
        if (subcategory) set.add(subcategory);
        grouped.set(category, set);
      }

      return {
        categories: [...grouped].map(([category, subs]) => ({ category, subcategories: [...subs] })),
        manufacturers: mfrs.map((m) => m.manufacturer),
      };
    });
  }

  // ---------------- Admin (uncached reads, invalidating writes) ----------------

  listAll() {
    return this.prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateProductDto) {
    const { unitPrice, imageUrls, specifications, ...rest } = dto;
    const product = await this.handleUnique(() =>
      this.prisma.product.create({
        data: {
          sku: rest.sku,
          mpn: rest.mpn,
          category: rest.category,
          subcategory: rest.subcategory,
          manufacturer: rest.manufacturer,
          name: rest.name,
          slug: rest.slug,
          description: rest.description,
          isActive: rest.isActive ?? true,
          imageUrls: imageUrls ?? [],
          specifications: specifications ?? {},
          unitPrice: new Prisma.Decimal(unitPrice),
        },
      }),
    );
    await this.cache.invalidateAll();
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.ensureExists(id);
    const { unitPrice, ...rest } = dto;
    const product = await this.handleUnique(() =>
      this.prisma.product.update({
        where: { id },
        data: {
          ...rest,
          ...(unitPrice !== undefined && { unitPrice: new Prisma.Decimal(unitPrice) }),
        },
      }),
    );
    await this.cache.invalidateAll();
    return product;
  }

  async updateInventory(id: string, stockQuantity: number) {
    await this.ensureExists(id);
    const product = await this.prisma.product.update({ where: { id }, data: { stockQuantity } });
    await this.cache.invalidateAll();
    return product;
  }

  /** Soft-delete: products referenced by historical orders must remain for integrity. */
  async remove(id: string): Promise<void> {
    await this.ensureExists(id);
    await this.prisma.$transaction([
      this.prisma.cartItem.deleteMany({ where: { productId: id } }),
      this.prisma.product.update({ where: { id }, data: { isActive: false } }),
    ]);
    await this.cache.invalidateAll();
  }

  // ---------------- helpers ----------------

  private buildWhere(q: ProductQueryDto): Prisma.ProductWhereInput {
    const where: Prisma.ProductWhereInput = { isActive: true };
    if (q.category) where.category = q.category;
    if (q.subcategory) where.subcategory = q.subcategory;
    if (q.manufacturer) where.manufacturer = q.manufacturer;
    if (q.inStock) where.stockQuantity = { gt: 0 };
    if (q.minPrice !== undefined || q.maxPrice !== undefined) {
      where.unitPrice = {
        ...(q.minPrice !== undefined && { gte: new Prisma.Decimal(q.minPrice) }),
        ...(q.maxPrice !== undefined && { lte: new Prisma.Decimal(q.maxPrice) }),
      };
    }
    if (q.search?.trim()) {
      const term = q.search.trim();
      where.OR = [
        { name: { contains: term, mode: 'insensitive' } },
        { sku: { contains: term, mode: 'insensitive' } },
        { mpn: { contains: term, mode: 'insensitive' } },
        { manufacturer: { contains: term, mode: 'insensitive' } },
      ];
    }
    return where;
  }

  private buildOrderBy(sort: ProductQueryDto['sort']): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'price_asc':
        return [{ unitPrice: 'asc' }, { id: 'asc' }];
      case 'price_desc':
        return [{ unitPrice: 'desc' }, { id: 'asc' }];
      case 'name_asc':
        return [{ name: 'asc' }, { id: 'asc' }];
      default:
        return [{ createdAt: 'desc' }, { id: 'asc' }];
    }
  }

  private async ensureExists(id: string): Promise<void> {
    const found = await this.prisma.product.findUnique({ where: { id }, select: { id: true } });
    if (!found) throw new NotFoundException('Product not found');
  }

  private async handleUnique<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException('A product with this SKU or slug already exists');
      }
      throw err;
    }
  }
}
