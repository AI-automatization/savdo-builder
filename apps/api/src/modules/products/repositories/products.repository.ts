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
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { id, deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          where: { deletedAt: null },
          include: { optionValues: { include: { optionValue: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        optionGroups: {
          include: { values: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findPublicById(id: string): Promise<Product | null> {
    return this.prisma.product.findFirst({
      where: { id, status: 'ACTIVE', deletedAt: null },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        variants: {
          where: { deletedAt: null, isActive: true },
          include: { optionValues: { include: { optionValue: true } } },
          orderBy: { sortOrder: 'asc' },
        },
        optionGroups: {
          include: { values: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findPublicByStoreId(
    storeId: string,
    filters?: {
      globalCategoryId?: string;
      storeCategoryId?: string;
    },
  ): Promise<Product[]> {
    return this.prisma.product.findMany({
      where: {
        storeId,
        status: 'ACTIVE',
        deletedAt: null,
        ...(filters?.globalCategoryId && { globalCategoryId: filters.globalCategoryId }),
        ...(filters?.storeCategoryId && { storeCategoryId: filters.storeCategoryId }),
      },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.product.count({
      where: { storeId, deletedAt: null },
    });
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
      },
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
}
