/**
 * Storefront search response — `GET /storefront/search?q=&limit=`.
 *
 * FEAT-001 backend contract. Min 2 chars query, throttle 30/min per IP.
 * Returns matching stores + products by ILIKE на name/title.
 *
 * API-STOREFRONT-SEARCH-CONTRACT-001 (закрыто 08.05.2026): тип вынесен из
 * локального `apps/web-buyer/src/lib/api/search.api.ts` в shared контракт.
 */

export interface SearchStoreHit {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  description?: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

export interface SearchProductHit {
  id: string;
  title: string;
  basePrice: number;
  oldPrice: number | null;
  salePrice: number | null;
  currencyCode: string;
  /** Each product has 0+ images; storefront отдаёт `[{url}]`. */
  images: { url: string }[];
  store: { id: string; name: string; slug: string } | null;
}

export interface StorefrontSearchResponse {
  stores: SearchStoreHit[];
  products: SearchProductHit[];
}
