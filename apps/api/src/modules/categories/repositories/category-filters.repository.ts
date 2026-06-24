import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class CategoryFiltersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySlug(categorySlug: string) {
    return this.prisma.categoryFilter.findMany({
      where: { categorySlug },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findUnique(categorySlug: string, key: string) {
    return this.prisma.categoryFilter.findUnique({
      where: { categorySlug_key: { categorySlug, key } },
    });
  }

  async updateOptions(categorySlug: string, key: string, options: string[]): Promise<void> {
    await this.prisma.categoryFilter.update({
      where: { categorySlug_key: { categorySlug, key } },
      data: { options: JSON.stringify(options) },
    });
  }
}
