import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { GlobalCategory } from '@prisma/client';

@Injectable()
export class GlobalCategoriesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActive(): Promise<GlobalCategory[]> {
    return this.prisma.globalCategory.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async findById(id: string): Promise<GlobalCategory | null> {
    return this.prisma.globalCategory.findUnique({
      where: { id },
    });
  }
}
