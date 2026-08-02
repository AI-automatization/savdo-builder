import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCategory } from '@prisma/client';
import { SlugService } from '../../stores/services/slug.service';

export type StoreCategoryWithCount = StoreCategory & { productCount: number };

@Injectable()
export class StoreCategoriesRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly slugService: SlugService,
  ) {}

  /**
   * Nice-to-have от Азима: возвращаем `productCount` (только ACTIVE,
   * не soft-deleted) чтобы web-seller `/store/categories` мог показать
   * счётчик товаров рядом с именем категории. Один запрос с
   * `_count.products WHERE` — без N+1.
   */
  async findByStoreId(storeId: string): Promise<StoreCategoryWithCount[]> {
    const rows = await this.prisma.storeCategory.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
      include: {
        _count: {
          select: {
            products: {
              where: { status: 'ACTIVE', deletedAt: null },
            },
          },
        },
      },
    });
    return rows.map(({ _count, ...rest }) => ({
      ...rest,
      productCount: _count.products,
    }));
  }

  async findById(id: string): Promise<StoreCategory | null> {
    return this.prisma.storeCategory.findUnique({
      where: { id },
    });
  }

  async create(
    storeId: string,
    data: { name: string; sortOrder?: number },
  ): Promise<StoreCategory> {
    // DUP-003: единый SlugService. maxLength=80, fallback='category' — историческое
    // поведение `toSlug()` (был без `.slice()`, поэтому 80 — безопасный буфер).
    const baseSlug = this.slugService.generate(data.name, { maxLength: 80, fallback: 'category' });
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    return this.prisma.storeCategory.create({
      data: {
        storeId,
        name: data.name,
        slug,
        sortOrder: data.sortOrder ?? 0,
      },
    });
  }

  async update(
    id: string,
    data: { name?: string; sortOrder?: number },
  ): Promise<StoreCategory> {
    return this.prisma.storeCategory.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.storeCategory.delete({
      where: { id },
    });
  }

  async countByStoreId(storeId: string): Promise<number> {
    return this.prisma.storeCategory.count({
      where: { storeId },
    });
  }
}
