import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class StoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  // Все find* теперь фильтруют deletedAt: null чтобы soft-deleted магазины
  // не лились в storefront/seller dashboard/admin/TG-bot. См. DB-AUDIT-001-07.
  async findBySellerId(sellerId: string) {
    return this.prisma.store.findFirst({
      where: { sellerId, deletedAt: null },
      include: { deliverySettings: true, contacts: true },
    });
  }

  async findById(id: string) {
    return this.prisma.store.findFirst({
      where: { id, deletedAt: null },
      include: { seller: true, deliverySettings: true, contacts: true },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.store.findFirst({
      where: { slug, deletedAt: null },
      include: {
        deliverySettings: true,
        contacts: true,
        categories: {
          where: { isActive: true },
          select: { id: true, name: true, sortOrder: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });
  }

  async findAllPublished() {
    return this.prisma.store.findMany({
      where: { isPublic: true, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        status: true,
        city: true,
        telegramContactLink: true,
        logoMediaId: true,
        coverMediaId: true,
      },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    });
  }

  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.prisma.store.count({ where: { slug } });
    return count > 0;
  }

  async create(data: {
    sellerId: string;
    name: string;
    slug: string;
    description?: string;
    city: string;
    region?: string;
    telegramContactLink: string;
  }) {
    return this.prisma.store.create({
      data: {
        ...data,
        deliverySettings: {
          create: {
            supportsDelivery: true,
            supportsPickup: false,
            deliveryFeeType: 'fixed',
          },
        },
      },
      include: { deliverySettings: true },
    });
  }

  async upsertDeliverySettings(storeId: string, data: {
    deliveryFeeType?: string;
    fixedDeliveryFee?: number;
  }) {
    return this.prisma.storeDeliverySettings.upsert({
      where: { storeId },
      create: { storeId, ...data },
      update: data,
    });
  }

  async update(storeId: string, data: Partial<{
    name: string;
    description: string;
    city: string;
    region: string;
    telegramContactLink: string;
    logoMediaId: string;
    coverMediaId: string;
    primaryGlobalCategoryId: string;
    isPublic: boolean;
    publishedAt: Date;
    status: string;
    slug: string;
  }>) {
    return this.prisma.store.update({
      where: { id: storeId },
      data: data as any,
      include: { deliverySettings: true, contacts: true },
    });
  }
}
