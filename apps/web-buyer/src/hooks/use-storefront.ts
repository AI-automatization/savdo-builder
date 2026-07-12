'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { FeaturedStorefrontResponse, Product } from 'types';
import {
  getStoreBySlug,
  getCategories,
  getProducts,
  getProduct,
  getProductReviews,
  getFeaturedStorefront,
  getCategoriesTree,
  getPlatformFeed,
  getStoresCatalog,
  getProductsCatalog,
  type PlatformFeedParams,
  type ProductsCatalogParams,
} from '../lib/api/storefront.api';

export const storefrontKeys = {
  store: (slug: string) => ['store', slug] as const,
  categories: ['categories'] as const,
  categoriesTree: ['categories-tree'] as const,
  products: (storeId: string, filters?: object) => ['products', storeId, filters] as const,
  product: (id: string) => ['product', id] as const,
  productReviews: (id: string, page: number) => ['product-reviews', id, page] as const,
  featured: ['featured'] as const,
  platformFeed: (filters?: object) => ['platform-feed', filters] as const,
  storesCatalog: ['storefront', 'stores-catalog'] as const,
  productsCatalog: (params: Omit<ProductsCatalogParams, 'page' | 'limit'>) =>
    ['storefront', 'products-catalog', params] as const,
};

export function useStoreBySlug(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.store(slug),
    queryFn: () => getStoreBySlug(slug),
    enabled: !!slug,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: storefrontKeys.categories,
    queryFn: getCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProducts(params: {
  storeId: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
}) {
  return useQuery({
    queryKey: storefrontKeys.products(params.storeId, {
      globalCategoryId: params.globalCategoryId,
      storeCategoryId: params.storeCategoryId,
    }),
    queryFn: () => getProducts(params),
    enabled: !!params.storeId,
    staleTime: 3 * 60 * 1000,
  });
}

// initialProduct — SEO-AUDIT-001 п.4: server-fetched продукт для первого
// рендера (краулеры видят контент без JS). initialDataUpdatedAt: 0 держит
// его "stale" сразу — server-фетч без auth, inWishlist/личные поля клиент
// доуточняет фоновым рефетчем на mount, не залипая на 3-минутный staleTime.
export function useProduct(id: string, initialProduct?: Product) {
  return useQuery({
    queryKey: storefrontKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
    ...(initialProduct ? { initialData: initialProduct, initialDataUpdatedAt: 0 } : {}),
  });
}

export function useProductReviews(id: string, page = 1) {
  return useQuery({
    queryKey: storefrontKeys.productReviews(id, page),
    queryFn: () => getProductReviews(id, page, 20),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
}

// ── Featured (homepage) ──────────────────────────────────────────────────────

// initialData — SEO-AUDIT-001 п.3: homepage передаёт server-fetched featured
// как initialData, чтобы первый рендер (для краулеров) не ждал client-фетча.
export function useFeaturedStorefront(initialData?: FeaturedStorefrontResponse) {
  return useQuery({
    queryKey: storefrontKeys.featured,
    queryFn: getFeaturedStorefront,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
    ...(initialData ? { initialData } : {}),
  });
}

// ── Categories tree (root chips на homepage) ─────────────────────────────────

export function useGlobalCategoriesTree() {
  return useQuery({
    queryKey: storefrontKeys.categoriesTree,
    queryFn: getCategoriesTree,
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

// ── Platform-wide feed (category-filtered featured) ──────────────────────────

export function usePlatformFeed(params: PlatformFeedParams) {
  return useQuery({
    queryKey: storefrontKeys.platformFeed(params),
    queryFn: () => getPlatformFeed(params),
    staleTime: 2 * 60 * 1000,
    // Запрос имеет смысл только при выбранной категории — иначе homepage
    // показывает featured feed из useFeaturedStorefront, не platform feed.
    enabled: !!params.globalCategoryId,
  });
}

// ── Catalog: stores ──────────────────────────────────────────────────────────

export function useStoresCatalog() {
  return useQuery({
    queryKey: storefrontKeys.storesCatalog,
    queryFn: getStoresCatalog,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

// ── Catalog: products (infinite) ─────────────────────────────────────────────

export const PRODUCTS_CATALOG_PAGE_SIZE = 24;

export function useProductsCatalog(
  params: Omit<ProductsCatalogParams, 'page' | 'limit'>,
) {
  return useInfiniteQuery({
    queryKey: storefrontKeys.productsCatalog(params),
    queryFn: ({ pageParam }) =>
      getProductsCatalog({
        ...params,
        page: pageParam,
        limit: PRODUCTS_CATALOG_PAGE_SIZE,
      }),
    initialPageParam: 1,
    getNextPageParam: (last, all) =>
      last.data.length === PRODUCTS_CATALOG_PAGE_SIZE ? all.length + 1 : undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
