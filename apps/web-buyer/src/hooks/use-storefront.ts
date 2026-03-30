'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategories, getProducts, getProduct } from '../lib/api/storefront.api';

export const storefrontKeys = {
  categories: ['categories'] as const,
  products: (storeId: string, filters?: object) => ['products', storeId, filters] as const,
  product: (id: string) => ['product', id] as const,
};

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
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: storefrontKeys.product(id),
    queryFn: () => getProduct(id),
    enabled: !!id,
  });
}
