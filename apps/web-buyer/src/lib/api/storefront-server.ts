/**
 * Server-side storefront fetchers — no 'use client'.
 * Used in async Server Components (Next.js App Router).
 * Public endpoints only (no auth required).
 */

import type { FeaturedStorefrontResponse, GlobalCategory, Product, ProductListItem, StorefrontStore } from 'types';
import type { StorefrontCategoryFilter, ProductReviewsResponse, StoresCatalogItem } from './storefront.api';
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

/**
 * SELLER-PAYMENT-REQUISITES-001: `StorefrontStore` в packages/types на ветке
 * web-buyer ещё без `paymentRequisites` (есть только на main) — тот же
 * branch-sync разрыв, что со SlugFeed/StorePaymentRequisites в web-seller,
 * см. analiz/logs.md SEO-DOC-DRIFT-001. `storefront/stores/:slug` реально
 * отдаёт поле (storefront.controller.mapPublicStoreBySlug), локальный тип
 * ниже отражает рантайм, не трогает packages/types (зона Полата).
 */
export interface StorePaymentRequisites {
  acceptsCash: boolean;
  acceptsCardTransfer: boolean;
  cardNumber: string | null;
  cardHolder: string | null;
  clickLink: string | null;
  paymeLink: string | null;
}

export type StorefrontStoreWithPayments = StorefrontStore & {
  paymentRequisites?: StorePaymentRequisites;
};

export async function serverGetStoreBySlug(slug: string): Promise<StorefrontStoreWithPayments> {
  return sfetch<StorefrontStoreWithPayments>(`/storefront/stores/${slug}`);
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
 * Полат добавил store.slug в findAllPublicForSitemap (products.repository.ts,
 * 14.07.2026) — products теперь несёт storeSlug, канонический URL товара
 * (`/{storeSlug}/products/{id}`) строится. ⚠️ Канонический тип в
 * packages/types (StorefrontSitemapProduct) ещё не обновлён под storeSlug —
 * это на Полате; здесь локальный тип уже отражает реальный ответ API.
 */
export interface SitemapFeed {
  stores: Array<{ slug: string; updatedAt: string }>;
  products: Array<{ id: string; updatedAt: string; storeSlug: string }>;
}

export async function serverGetSitemapFeed(): Promise<SitemapFeed> {
  return sfetch<SitemapFeed>('/storefront/sitemap');
}

/**
 * SEO-GEO-AEO-RESEARCH-002 п.4: первая страница отзывов для SSR-первого рендера
 * товара (см. useProductReviews initialData в use-storefront.ts) — без этого
 * тексты отзывов рендерились только клиентским useQuery и были невидимы
 * краулерам без JS (Product JSON-LD aggregateRating при этом уже был виден,
 * создавая расхождение между structured data и видимым контентом).
 */
export async function serverGetProductReviews(id: string): Promise<ProductReviewsResponse> {
  return sfetch<ProductReviewsResponse>(`/storefront/products/${id}/reviews`, { page: '1', limit: '20' });
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

/**
 * SEO-CRAWL-PATH-001: полный публичный список магазинов для SSR каталога /stores.
 *
 * Зачем: /stores — единственная hub-страница, ведущая на все витрины, но она
 * client-компонент (фильтры, сортировка, URL-state), поэтому в первом HTML не было
 * ни одного <a href="/{slug}">. Краулер приходил на /stores и не находил куда идти.
 *
 * Проверено на проде 01.08.2026: curl /stores → 0 ссылок на магазины, слаг
 * единственной реальной витрины (raos) не встречался в ответе ни разу. Единственная
 * ссылка на shop-поддомен со всего сайта вела на тестовый магазин, а его мы из
 * индекса исключаем — то есть у raos не было ни одного пути обнаружения вообще.
 */
export async function serverGetStoresCatalog(): Promise<StoresCatalogItem[]> {
  const res = await sfetch<{ data: StoresCatalogItem[] }>('/storefront/stores');
  return res.data;
}

/**
 * SEO-ITEMLIST-001: платформенный фид `/products` для ItemList JSON-LD.
 *
 * `ProductListItem` (packages/types) не объявляет `store` — но
 * `storefront.controller.ts` (`listStorefrontProducts`, ветка без `storeId`)
 * реально спредит весь Product-объект в ответ, а `store: {id,name,slug}`
 * уже в `allPublicProductInclude` и ничем не вырезается из `...rest`. Тип
 * здесь просто объявляет то, что API и так отдаёт в рантайме — той же
 * тактикой, что `StorefrontStoreWithPayments` выше (packages/types на этой
 * ветке отстаёт от main, трогать его тут не будем).
 */
export type ProductListItemWithStore = ProductListItem & {
  store?: { id: string; name: string; slug: string };
};

export async function serverGetProductsCatalog(limit = 24): Promise<ProductListItemWithStore[]> {
  const res = await sfetch<{ data: ProductListItemWithStore[] }>('/storefront/products', {
    limit: String(limit),
  });
  return res.data;
}

export async function serverGetGlobalCategories(): Promise<GlobalCategory[]> {
  return sfetch<GlobalCategory[]>('/storefront/categories');
}

export async function serverGetCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  return sfetch<StorefrontCategoryFilter[]>(`/storefront/categories/${slug}/filters`);
}
