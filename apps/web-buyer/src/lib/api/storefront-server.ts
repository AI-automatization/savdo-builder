/**
 * Server-side storefront fetchers — no 'use client'.
 * Used in async Server Components (Next.js App Router).
 * Public endpoints only (no auth required).
 */

import type { FeaturedStorefrontResponse, GlobalCategory, Product, ProductListItem, StorefrontStore } from 'types';
import type { StorefrontCategoryFilter } from './storefront.api';
import { API_BASE } from './env';

async function sfetch<T>(path: string, search?: URLSearchParams | Record<string, string>): Promise<T> {
  const url = new URL(`${API_BASE}${path}`);
  if (search instanceof URLSearchParams) {
    search.forEach((v, k) => url.searchParams.append(k, v));
  } else if (search) {
    Object.entries(search).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 30 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? res.statusText), { status: res.status, code: err.code });
  }
  return res.json() as Promise<T>;
}

export async function serverGetStoreBySlug(slug: string): Promise<StorefrontStore> {
  return sfetch<StorefrontStore>(`/storefront/stores/${slug}`);
}

/**
 * SEO-AUDIT-001 п.3: featured-фид для homepage. Раньше тянулся только на
 * клиенте (useFeaturedStorefront) — краулер видел пустую страницу без
 * ссылок на магазины. Server-фетч даёт реальные <a href> в первом HTML.
 */
export async function serverGetFeatured(): Promise<FeaturedStorefrontResponse> {
  return sfetch<FeaturedStorefrontResponse>('/storefront/featured');
}

/**
 * SEO-AUDIT-001 п.4: product page primary content — server-фетч без auth,
 * поэтому inWishlist всегда false здесь. Клиент допровери свежие данные сам
 * (см. useProduct initialDataUpdatedAt: 0 в hooks/use-storefront.ts) — этот
 * вызов только даёт краулеру реальный HTML на первый рендер.
 */
export async function serverGetProduct(id: string): Promise<Product> {
  return sfetch<Product>(`/storefront/products/${id}`);
}

/**
 * SEO-AUDIT-001 п.2: фид для sitemap.ts.
 * ⚠️ products не несёт store slug/storeId — URL товара (`/{slug}/products/{id}`)
 * построить нельзя без него. sitemap.ts пока эмитит только магазины; товары —
 * после того как Полат добавит store.slug в findAllPublicForSitemap
 * (products.repository.ts). Заведено в analiz/logs.md.
 */
export interface SitemapFeed {
  stores: Array<{ slug: string; updatedAt: string }>;
  products: Array<{ id: string; updatedAt: string }>;
}

export async function serverGetSitemapFeed(): Promise<SitemapFeed> {
  return sfetch<SitemapFeed>('/storefront/sitemap');
}

/**
 * SEO-AUDIT-001 п.16: `/storefront/products?storeId=` всегда пагинирован
 * backend'ом (default limit 20, `storefront.controller.ts` ветка `storeId`) —
 * без чтения `meta.total` магазины с >PRODUCTS_PAGE_SIZE товаров молча теряли
 * остаток каталога на витрине (ни ошибки, ни намёка, что список неполный).
 */
export const PRODUCTS_PAGE_SIZE = 24;

export interface ServerProductsResult {
  data: ProductListItem[];
  meta: { total: number; page: number };
}

export async function serverGetProducts(params: {
  storeId: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
  attributeFilters?: Record<string, string>;
  priceMin?: number;
  priceMax?: number;
  page?: number;
}): Promise<ServerProductsResult> {
  const search = new URLSearchParams();
  search.set('storeId', params.storeId);
  search.set('page', String(params.page ?? 1));
  search.set('limit', String(PRODUCTS_PAGE_SIZE));
  if (params.globalCategoryId) search.set('globalCategoryId', params.globalCategoryId);
  if (params.storeCategoryId) search.set('storeCategoryId', params.storeCategoryId);
  if (params.priceMin != null && Number.isFinite(params.priceMin)) {
    search.set('priceMin', String(params.priceMin));
  }
  if (params.priceMax != null && Number.isFinite(params.priceMax)) {
    search.set('priceMax', String(params.priceMax));
  }
  if (params.attributeFilters) {
    for (const [k, v] of Object.entries(params.attributeFilters)) {
      if (v) search.append(`filters[${k}]`, v);
    }
  }
  return sfetch<ServerProductsResult>('/storefront/products', search);
}

export async function serverGetGlobalCategories(): Promise<GlobalCategory[]> {
  return sfetch<GlobalCategory[]>('/storefront/categories');
}

export async function serverGetCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  return sfetch<StorefrontCategoryFilter[]>(`/storefront/categories/${slug}/filters`);
}
