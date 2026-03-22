import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { StoreCategory } from '@prisma/client';

@Injectable()
export class StoreCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByStoreId(storeId: string): Promise<StoreCategory[]> {
    return this.prisma.storeCategory.findMany({
      where: { storeId },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<StoreCategory | null> {
    return this.prisma.storeCategory.findUnique({
      where: { id },
    });
  }

  private toSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'category';
  }

  async create(
    storeId: string,
    data: { name: string; sortOrder?: number },
  ): Promise<StoreCategory> {
    const baseSlug = this.toSlug(data.name);
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
