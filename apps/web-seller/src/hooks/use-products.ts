'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProductStatus, Product } from 'types';
import {
  getSellerProducts,
  getSellerProduct,
  createProduct,
  updateProduct,
  updateProductStatus,
  deleteProduct,
  getProductVariants,
  createVariant,
  updateVariant,
  deleteVariant,
  adjustStock,
} from '../lib/api/products.api';

export const productKeys = {
  all: ['products'] as const,
  list: (filters?: object) => ['products', 'list', filters] as const,
  detail: (id: string) => ['products', id] as const,
  variants: (productId: string) => ['products', productId, 'variants'] as const,
};

// ── Products ───────────────────────────────────────────────────────────────────

export function useSellerProducts(params?: {
  status?: ProductStatus;
  globalCategoryId?: string;
  storeCategoryId?: string;
}) {
  return useQuery({
    queryKey: productKeys.list(params),
    queryFn: () => getSellerProducts(params),
  });
}

export function useSellerProduct(id: string) {
  return useQuery<Product>({
    queryKey: productKeys.detail(id),
    queryFn: () => getSellerProduct(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Parameters<typeof updateProduct>[1] & { id: string }) =>
      updateProduct(id, data),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}

export function useUpdateProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ProductStatus }) =>
      updateProductStatus(id, status),
    onSuccess: (product) => {
      queryClient.setQueryData(productKeys.detail(product.id), product);
      queryClient.invalidateQueries({ queryKey: productKeys.list() });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: productKeys.all }),
  });
}

// ── Variants ───────────────────────────────────────────────────────────────────

export function useProductVariants(productId: string) {
  return useQuery({
    queryKey: productKeys.variants(productId),
    queryFn: () => getProductVariants(productId),
    enabled: !!productId,
  });
}

export function useCreateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, ...data }: Parameters<typeof createVariant>[1] & { productId: string }) =>
      createVariant(productId, data),
    onSuccess: (_, { productId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.variants(productId) }),
  });
}

export function useUpdateVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      ...data
    }: Parameters<typeof updateVariant>[2] & { productId: string; variantId: string }) =>
      updateVariant(productId, variantId, data),
    onSuccess: (_, { productId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.variants(productId) }),
  });
}

export function useDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, variantId }: { productId: string; variantId: string }) =>
      deleteVariant(productId, variantId),
    onSuccess: (_, { productId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.variants(productId) }),
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      productId,
      variantId,
      delta,
      reason,
    }: {
      productId: string;
      variantId: string;
      delta: number;
      reason: string;
    }) => adjustStock(productId, variantId, delta, reason),
    onSuccess: (_, { productId }) =>
      queryClient.invalidateQueries({ queryKey: productKeys.variants(productId) }),
  });
}
