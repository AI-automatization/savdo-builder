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

  /**
   * API-STORES-PAGINATION-001: server-side пагинация публичного списка магазинов.
   * Раньше `take: 50` хардкодом — при росте >50 магазинов хвост был недоступен.
   * Возвращает `{ stores, total, page, limit }`. Default limit 50 (как раньше),
   * clamp 1..100. Невалидные page/limit → дефолты.
   */
  async findAllPublished(opts: { page?: number; limit?: number } = {}) {
    const rawPage = Number(opts.page);
    const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.trunc(rawPage) : 1;
    const rawLimit = Number(opts.limit);
    const limit = Number.isFinite(rawLimit)
      ? Math.min(Math.max(Math.trunc(rawLimit), 1), 100)
      : 50;

    const where = { isPublic: true, deletedAt: null };
    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
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
          // MARKETING-VERIFIED-SELLER-001
          isVerified: true,
          avgRating: true,
          reviewCount: true,
        },
        // Verified магазины сверху, потом по дате публикации
        orderBy: [{ isVerified: 'desc' }, { publishedAt: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    return { stores, total, page, limit };
  }

  // FEAT-001: case-insensitive поиск по публичным магазинам.
  // Используется в GET /storefront/search.
  async searchPublic(query: string, limit = 10) {
    const q = query.trim();
    if (!q) return [];
    return this.prisma.store.findMany({
      where: {
        isPublic: true,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { slug: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        city: true,
        logoMediaId: true,
        coverMediaId: true,
        // MARKETING-VERIFIED-SELLER-001
        isVerified: true,
        avgRating: true,
        reviewCount: true,
      },
      orderBy: [{ isVerified: 'desc' }, { publishedAt: 'desc' }],
      take: limit,
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

  /**
   * FEAT-TG-CHANNEL-TEMPLATE-001: точечное обновление полей TG-канала.
   * `null` в значении = очистить колонку, отсутствие ключа = не трогать.
   */
  async updateChannelTemplate(storeId: string, data: Partial<{
    channelPostTemplate: string | null;
    channelContactPhone: string | null;
    channelInstagramLink: string | null;
    channelTiktokLink: string | null;
  }>) {
    return this.prisma.store.update({
      where: { id: storeId },
      data,
      select: {
        id: true,
        channelPostTemplate: true,
        channelContactPhone: true,
        channelInstagramLink: true,
        channelTiktokLink: true,
        telegramChannelId: true,
        telegramChannelTitle: true,
        autoPostProductsToChannel: true,
      },
    });
  }

  async findChannelTemplate(storeId: string) {
    return this.prisma.store.findUnique({
      where: { id: storeId },
      select: {
        id: true,
        channelPostTemplate: true,
        channelContactPhone: true,
        channelInstagramLink: true,
        channelTiktokLink: true,
        telegramChannelId: true,
        telegramChannelTitle: true,
        telegramContactLink: true,
        autoPostProductsToChannel: true,
      },
    });
  }
}
