'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import {
  getStoreBySlug,
  getCategories,
  getProducts,
  getProduct,
  getProductReviews,
  getFeaturedStorefront,
  getCategoriesTree,
  getPlatformFeed,
  getStorefrontStoreWithTrust,
  getStoresCatalog,
  getProductsCatalog,
  type PlatformFeedParams,
  type ProductsCatalogParams,
} from '../lib/api/storefront.api';

export const storefrontKeys = {
  store: (slug: string) => ['store', slug] as const,
  storeWithTrust: (slug: string) => ['store-with-trust', slug] as const,
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

export function useProduct(id: string) {
  return useQuery({
    queryKey: storefrontKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
    staleTime: 3 * 60 * 1000,
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

export function useFeaturedStorefront() {
  return useQuery({
    queryKey: storefrontKeys.featured,
    queryFn: getFeaturedStorefront,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
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

// ── Store с trust signals (для product page) ─────────────────────────────────

export function useStoreWithTrust(slug: string) {
  return useQuery({
    queryKey: storefrontKeys.storeWithTrust(slug),
    queryFn: () => getStorefrontStoreWithTrust(slug),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
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
