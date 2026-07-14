// ── Storefront ────────────────────────────────────────────────────────────────
//
// API-TYPES-PROMOTE-FEATURED-STOREFRONT-001 (от Азима, web-sync audit 14.05.2026):
// типы подняты из локального apps/web-buyer/src/types/storefront.ts —
// убран дубликат контракта. Source of truth = здесь.
//
// Backend: GetFeaturedStorefrontUseCase (GET /storefront/featured)
//          + GET /storefront/categories/tree

/** Магазин в featured-блоке главной (MARKETING-HOMEPAGE-DISCOVERY-001). */
export interface FeaturedTopStore {
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
}

/** Товар в featured-feed главной. */
export interface FeaturedProduct {
  id: string;
  title: string;
  basePrice: number;
  salePrice: number | null;
  /** P3-004 — для SALE-бейджа на ProductCard. */
  isSale: boolean;
  discountPercent: number | null;
  currencyCode: string;
  avgRating: number | null;
  reviewCount: number;
  mediaUrl: string | null;
  store: { id: string; slug: string; name: string };
}

/** Ответ GET /storefront/featured. */
export interface FeaturedStorefrontResponse {
  topStores: FeaturedTopStore[];
  featuredProducts: FeaturedProduct[];
}

/**
 * SEO-AUDIT-001 п.1: фид для динамического sitemap.xml web-buyer.
 * Ответ GET /storefront/sitemap (storefront.controller.ts, Cache-Control 1h).
 * `updatedAt` — ISO-строка (честный lastmod вместо new Date()).
 */
export interface StorefrontSitemapStore {
  slug: string;
  updatedAt: string;
}

export interface StorefrontSitemapProduct {
  id: string;
  updatedAt: string;
  /** SEO-AUDIT-001 п.2: slug магазина — канонический URL = `/{storeSlug}/products/{id}`. */
  storeSlug: string;
}

export interface StorefrontSitemapFeed {
  stores: StorefrontSitemapStore[];
  products: StorefrontSitemapProduct[];
}

/**
 * GlobalCategory с iconEmoji и tree-полями.
 * Ответ GET /storefront/categories/tree.
 */
export interface GlobalCategoryTreeItem {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  parentId: string | null;
  level: number;
  isLeaf: boolean;
  iconEmoji: string | null;
  sortOrder: number;
}
