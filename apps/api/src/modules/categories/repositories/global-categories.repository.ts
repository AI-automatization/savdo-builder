import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GlobalCategory } from '@prisma/client';

export interface CreateGlobalCategoryData {
  nameRu: string;
  nameUz: string;
  slug: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateGlobalCategoryData {
  nameRu?: string;
  nameUz?: string;
  slug?: string;
  parentId?: string | null;
  sortOrder?: number;
  isActive?: boolean;
}

export type GlobalCategoryWithParent = GlobalCategory & {
  parent: Pick<GlobalCategory, 'id' | 'nameRu'> | null;
};

@Injectable()
export class GlobalCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<GlobalCategory[]> {
    return this.prisma.globalCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findAll(): Promise<GlobalCategoryWithParent[]> {
    return this.prisma.globalCategory.findMany({
      include: { parent: { select: { id: true, nameRu: true } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async findById(id: string): Promise<GlobalCategory | null> {
    return this.prisma.globalCategory.findUnique({ where: { id } });
  }

  async findBySlug(slug: string): Promise<GlobalCategory | null> {
    return this.prisma.globalCategory.findUnique({ where: { slug } });
  }

  async create(data: CreateGlobalCategoryData): Promise<GlobalCategory> {
    return this.prisma.globalCategory.create({
      data: {
        nameRu: data.nameRu,
        nameUz: data.nameUz,
        slug: data.slug,
        parentId: data.parentId ?? null,
        sortOrder: data.sortOrder ?? 0,
        isActive: data.isActive ?? true,
      },
    });
  }

  async update(id: string, data: UpdateGlobalCategoryData): Promise<GlobalCategory> {
    return this.prisma.globalCategory.update({
      where: { id },
      data: {
        ...(data.nameRu !== undefined && { nameRu: data.nameRu }),
        ...(data.nameUz !== undefined && { nameUz: data.nameUz }),
        ...(data.slug !== undefined && { slug: data.slug }),
        ...(data.parentId !== undefined && { parentId: data.parentId }),
        ...(data.sortOrder !== undefined && { sortOrder: data.sortOrder }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.$transaction([
      // Отвязать дочерние категории (parentId → null)
      this.prisma.globalCategory.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      }),
      // Отвязать товары (globalCategoryId → null)
      this.prisma.product.updateMany({
        where: { globalCategoryId: id },
        data: { globalCategoryId: null },
      }),
      this.prisma.globalCategory.delete({ where: { id } }),
    ]);
  }
}
