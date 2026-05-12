'use client';

import { useQuery } from '@tanstack/react-query';
import { getStoreBySlug, getCategories, getProducts, getProduct, getProductReviews } from '../lib/api/storefront.api';

export const storefrontKeys = {
  store: (slug: string) => ['store', slug] as const,
  categories: ['categories'] as const,
  products: (storeId: string, filters?: object) => ['products', storeId, filters] as const,
  product: (id: string) => ['product', id] as const,
  productReviews: (id: string, page: number) => ['product-reviews', id, page] as const,
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
