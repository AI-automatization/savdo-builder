import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { ProductPresenterService } from '../services/product-presenter.service';

/**
 * MARKETING-HOMEPAGE-DISCOVERY-001: разблокировка web-buyer homepage.
 *
 * Раньше landing был `<input slug>` без discovery — cold traffic от
 * Instagram/TG получал bounce 100%. Endpoint отдаёт:
 *   - topStores: топ магазинов с активными товарами, отсортированы по
 *     publishedAt DESC (новые сверху). Лимит 8 для homepage hero/grid.
 *   - featuredProducts: ACTIVE products из APPROVED stores, отсортированы
 *     по avgRating DESC + createdAt DESC. Лимит 12 для feed.
 *
 * Public endpoint — без auth. Throttle 60/min на IP (защита от scraping).
 */

export interface FeaturedStorefront {
  topStores: Array<{
    id: string;
    slug: string;
    name: string;
    city: string | null;
    logoUrl: string | null;
    coverUrl: string | null;
    // MARKETING-VERIFIED-SELLER-001 — trust signals
    isVerified: boolean;
    avgRating: number | null;
    reviewCount: number;
  }>;
  featuredProducts: Array<{
    id: string;
    title: string;
    basePrice: number;
    salePrice: number | null;
    /** P3-004: trust signals для SALE-бэйджа на ProductCard */
    isSale: boolean;
    discountPercent: number | null;
    currencyCode: string;
    avgRating: number | null;
    reviewCount: number;
    mediaUrl: string | null;
    store: { id: string; slug: string; name: string };
  }>;
}

@Injectable()
export class GetFeaturedStorefrontUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly presenter: ProductPresenterService,
  ) {}

  async execute(): Promise<FeaturedStorefront> {
    // Top stores — APPROVED + isPublic + не soft-deleted + есть хотя бы 1 ACTIVE product.
    // Сортировка по publishedAt DESC — даёт «свежесть» feed (новые магазины наверху).
    // alternative — по count(products) или count(orders) — но это требует aggregate
    // и медленнее. Для MVP publishedAt достаточно.
    const stores = await this.prisma.store.findMany({
      where: {
        status: 'APPROVED',
        isPublic: true,
        deletedAt: null,
        // INV-S03: store должен иметь хотя бы 1 ACTIVE product чтобы попадать в feed
        products: { some: { status: 'ACTIVE', deletedAt: null } },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        city: true,
        logoMediaId: true,
        coverMediaId: true,
        // MARKETING-VERIFIED-SELLER-001
        isVerified: true,
        avgRating: true,
        reviewCount: true,
      },
      // Verified магазины сверху, затем по дате публикации
      orderBy: [
        { isVerified: 'desc' },
        { avgRating: { sort: 'desc', nulls: 'last' } },
        { publishedAt: 'desc' },
      ],
      take: 8,
    });

    const topStores = await Promise.all(
      stores.map(async (s) => {
        const { logoUrl, coverUrl } = await this.presenter.resolveStoreImageUrls(
          s.logoMediaId,
          s.coverMediaId,
        );
        return {
          id: s.id,
          slug: s.slug,
          name: s.name,
          city: s.city,
          logoUrl,
          coverUrl,
          isVerified: s.isVerified,
          avgRating: s.avgRating != null ? Number(s.avgRating) : null,
          reviewCount: s.reviewCount,
        };
      }),
    );

    // Featured products — ACTIVE + не soft-deleted + store APPROVED + публичный.
    // Сортировка: avgRating DESC NULLS LAST, затем createdAt DESC.
    // PostgreSQL: NULLS LAST через `{ avgRating: { sort: 'desc', nulls: 'last' } }`.
    const products = await this.prisma.product.findMany({
      where: {
        status: 'ACTIVE',
        deletedAt: null,
        isVisible: true,
        store: { status: 'APPROVED', isPublic: true, deletedAt: null },
      },
      select: {
        id: true,
        title: true,
        basePrice: true,
        salePrice: true,
        currencyCode: true,
        avgRating: true,
        reviewCount: true,
        images: {
          orderBy: { sortOrder: 'asc' },
          take: 1,
          select: {
            media: { select: { id: true, objectKey: true, bucket: true } },
          },
        },
        store: { select: { id: true, slug: true, name: true } },
      },
      orderBy: [
        { avgRating: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      take: 12,
    });

    const featuredProducts = products.map((p) => {
      const sale = this.presenter.computeSale(p.basePrice, p.salePrice);
      return {
        id: p.id,
        title: p.title,
        basePrice: Number(p.basePrice),
        salePrice: p.salePrice != null ? Number(p.salePrice) : null,
        isSale: sale.isSale,
        discountPercent: sale.discountPercent,
        currencyCode: p.currencyCode,
        avgRating: p.avgRating != null ? Number(p.avgRating) : null,
        reviewCount: p.reviewCount,
        mediaUrl: this.presenter.resolveImageUrl(p.images[0]?.media) || null,
        store: p.store,
      };
    });

    return { topStores, featuredProducts };
  }
}
