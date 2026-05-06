import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { Product, ProductStatus } from '@prisma/client';

export interface CreateProductData {
  storeId: string;
  title: string;
  description?: string;
  basePrice: number;
  currencyCode?: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
  isVisible?: boolean;
  sku?: string;
  displayType?: import('@prisma/client').ProductDisplayType;
  attributesJson?: Record<string, unknown>;
}

export interface UpdateProductData {
  title?: string;
  description?: string;
  basePrice?: number;
  currencyCode?: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
  isVisible?: boolean;
  sku?: string;
  isFeatured?: boolean;
  oldPrice?: number;
  salePrice?: number;
  displayType?: import('@prisma/client').ProductDisplayType;
}

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filters?: {
    storeId?: string;
    status?: ProductStatus;
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const page  = filters?.page  ?? 1;
    const limit = filters?.limit ?? 20;
    const skip  = (page - 1) * limit;

    const where: Record<string, unknown> = { deletedAt: null };
    if (filters?.storeId) where['storeId'] = filters.storeId;
    if (filters?.status)  where['status']  = filters.status;

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: { images: { orderBy: { sortOrder: 'asc' }, take: 1 } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }

  async findByStoreId(
    storeId: string,
    filters?: {
      status?: ProductStatus;
      globalCategoryId?: string;
      storeCategoryId?: string;
      limit?: number;
    },
  ): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        storeId,
        deletedAt: null,
        ...(filters?.status && { status: filters.status }),
        ...(filters?.globalCategoryId && { globalCategoryId: filters.globalCategoryId }),
        ...(filters?.storeCategoryId && { storeCategoryId: filters.storeCategoryId }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
        variants: { where: { isActive: true, deletedAt: null }, select: { stockQuantity: true } },
        _count: { select: { variants: { where: { isActive: true, deletedAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
      ...(filters?.limit !== undefined && { take: filters.limit }),
    }) as unknown as Promise<Product[]>;
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
        variants: {
          where: { deletedAt: null },
          include: { optionValues: { include: { optionValue: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        optionGroups: {
          include: { values: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        globalCategory: { select: { id: true, nameRu: true, nameUz: true } },
      },
    });
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, include: { media: true } },
        variants: {
          where: { deletedAt: null, isActive: true },
          include: { optionValues: { include: { optionValue: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        optionGroups: {
          include: { values: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        attributes: { orderBy: { sortOrder: 'asc' } },
        globalCategory: { select: { id: true, nameRu: true, nameUz: true } },
      },
    });
  }

  async findPublicByStoreId(
    storeId: string,
    filters?: {
      globalCategoryId?: string;
      storeCategoryId?: string;
      attributes?: Record<string, string>;
      limit?: number;
    },
  ): Promise<Product[]> {
    const attrEntries = Object.entries(filters?.attributes ?? {}).filter(([, v]) => !!v);
    const take = Math.min(Math.max(filters?.limit ?? 200, 1), 500);
    return this.prisma.product.findMany({
      where: {
        storeId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(filters?.globalCategoryId && { globalCategoryId: filters.globalCategoryId }),
        ...(filters?.storeCategoryId && { storeCategoryId: filters.storeCategoryId }),
        ...(attrEntries.length > 0 && {
          AND: attrEntries.map(([name, value]) => ({
            attributes: { some: { name, value } },
          })),
        }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1, include: { media: true } },
        variants: { where: { isActive: true, deletedAt: null }, select: { stockQuantity: true } },
        _count: { select: { variants: { where: { isActive: true, deletedAt: null } } } },
      },
      orderBy: { createdAt: 'desc' },
      take,
    }) as unknown as Promise<Product[]>;
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({
      where: { storeId, deletedAt: null },
    });
  }

  // FEAT-001: case-insensitive поиск по публичным товарам активных магазинов.
  // Используется в GET /storefront/search.
  async searchPublic(query: string, limit = 10): Promise<Product[]> {
    const q = query.trim();
    if (!q) return [];
    return this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        store: { isPublic: true, deletedAt: null },
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' }, take: 1, include: { media: true } },
        store: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }) as unknown as Promise<Product[]>;
  }

  async create(data: CreateProductData): Promise<Product> {
    return this.prisma.product.create({
      data: {
        storeId: data.storeId,
        title: data.title,
        description: data.description,
        basePrice: data.basePrice,
        currencyCode: data.currencyCode ?? 'UZS',
        globalCategoryId: data.globalCategoryId,
        storeCategoryId: data.storeCategoryId,
        isVisible: data.isVisible ?? true,
        sku: data.sku,
        status: 'DRAFT',
        ...(data.displayType !== undefined && { displayType: data.displayType }),
        ...(data.attributesJson !== undefined && { attributesJson: data.attributesJson as any }),
      } as any,
      include: {
        images: true,
      },
    });
  }

  async update(id: string, data: UpdateProductData): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.basePrice !== undefined && { basePrice: data.basePrice }),
        ...(data.currencyCode !== undefined && { currencyCode: data.currencyCode }),
        ...(data.globalCategoryId !== undefined && { globalCategoryId: data.globalCategoryId }),
        ...(data.storeCategoryId !== undefined && { storeCategoryId: data.storeCategoryId }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        ...(data.sku !== undefined && { sku: data.sku }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.oldPrice !== undefined && { oldPrice: data.oldPrice }),
        ...(data.salePrice !== undefined && { salePrice: data.salePrice }),
        ...(data.displayType !== undefined && { displayType: data.displayType }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: { where: { deletedAt: null } },
        optionGroups: { include: { values: true } },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async updateStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data: { status },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  async findAllPublic(filters?: {
    q?: string;
    globalCategoryId?: string;
    priceMin?: number;
    priceMax?: number;
    sort?: 'new' | 'price_asc' | 'price_desc';
    page?: number;
    limit?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const page  = filters?.page  ?? 1;
    const limit = Math.min(filters?.limit ?? 20, 50);
    const skip  = (page - 1) * limit;

    // FEAT-003: priceMin/priceMax — диапазон цены, чтобы на storefront можно
    // было фильтровать товары по бюджету. Если оба указаны и min > max —
    // возвращаем пустой результат через невозможный where (count() = 0).
    const priceFilter: Record<string, number> = {};
    if (typeof filters?.priceMin === 'number' && filters.priceMin > 0) {
      priceFilter.gte = filters.priceMin;
    }
    if (typeof filters?.priceMax === 'number' && filters.priceMax > 0) {
      priceFilter.lte = filters.priceMax;
    }

    const where: Record<string, unknown> = {
      status: 'ACTIVE',
      deletedAt: null,
      store: { status: 'APPROVED', isPublic: true },
      ...(filters?.globalCategoryId && { globalCategoryId: filters.globalCategoryId }),
      ...(Object.keys(priceFilter).length > 0 && { basePrice: priceFilter }),
      ...(filters?.q?.trim() && {
        OR: [
          { title: { contains: filters.q.trim(), mode: 'insensitive' } },
          { description: { contains: filters.q.trim(), mode: 'insensitive' } },
        ],
      }),
    };

    const orderBy =
      filters?.sort === 'price_asc'  ? { basePrice: 'asc' as const } :
      filters?.sort === 'price_desc' ? { basePrice: 'desc' as const } :
                                       { createdAt: 'desc' as const };

    const [products, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: {
          images: { where: { isPrimary: true }, take: 1, include: { media: true } },
          store: { select: { id: true, name: true, slug: true } },
          variants: { where: { isActive: true, deletedAt: null }, select: { stockQuantity: true } },
          _count: { select: { variants: { where: { isActive: true, deletedAt: null } } } },
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return { products, total };
  }
}
