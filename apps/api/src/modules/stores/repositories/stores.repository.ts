import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class StoresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findBySellerId(sellerId: string) {
    return this.prisma.store.findUnique({
      where: { sellerId },
      include: { deliverySettings: true, contacts: true },
    });
  }

  async findById(id: string) {
    return this.prisma.store.findUnique({
      where: { id },
      include: { seller: true, deliverySettings: true, contacts: true },
    });
  }

  async findBySlug(slug: string) {
    return this.prisma.store.findUnique({
      where: { slug },
      include: { deliverySettings: true, contacts: true },
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
