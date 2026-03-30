import type { ProductListItem, ProductVariant, ProductStatus } from 'types';
import { apiClient } from './client';

// ── Products ───────────────────────────────────────────────────────────────────

export async function getSellerProducts(params?: {
  status?: ProductStatus;
  globalCategoryId?: string;
  storeCategoryId?: string;
}): Promise<ProductListItem[]> {
  const res = await apiClient.get<ProductListItem[]>('/seller/products', { params });
  return res.data;
}

export async function getSellerProduct(id: string): Promise<ProductListItem> {
  const res = await apiClient.get<ProductListItem>(`/seller/products/${id}`);
  return res.data;
}

export async function createProduct(data: {
  title: string;
  description?: string;
  basePrice: number;
  currencyCode?: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
  isVisible?: boolean;
  sku?: string;
}): Promise<ProductListItem> {
  const res = await apiClient.post<ProductListItem>('/seller/products', data);
  return res.data;
}

export async function updateProduct(
  id: string,
  data: {
    title?: string;
    description?: string;
    basePrice?: number;
    isVisible?: boolean;
    sku?: string;
    globalCategoryId?: string;
    storeCategoryId?: string;
  },
): Promise<ProductListItem> {
  const res = await apiClient.patch<ProductListItem>(`/seller/products/${id}`, data);
  return res.data;
}

export async function updateProductStatus(id: string, status: ProductStatus): Promise<ProductListItem> {
  const res = await apiClient.patch<ProductListItem>(`/seller/products/${id}/status`, { status });
  return res.data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/seller/products/${id}`);
}

// ── Variants ───────────────────────────────────────────────────────────────────

export async function getProductVariants(productId: string): Promise<ProductVariant[]> {
  const res = await apiClient.get<ProductVariant[]>(`/seller/products/${productId}/variants`);
  return res.data;
}

export async function createVariant(
  productId: string,
  data: {
    sku: string;
    stockQuantity: number;
    priceOverride?: number;
    isActive?: boolean;
    titleOverride?: string;
    optionValueIds?: string[];
  },
): Promise<ProductVariant> {
  const res = await apiClient.post<ProductVariant>(`/seller/products/${productId}/variants`, data);
  return res.data;
}

export async function updateVariant(
  productId: string,
  variantId: string,
  data: {
    sku?: string;
    priceOverride?: number;
    stockQuantity?: number;
    isActive?: boolean;
    titleOverride?: string;
  },
): Promise<ProductVariant> {
  const res = await apiClient.patch<ProductVariant>(
    `/seller/products/${productId}/variants/${variantId}`,
    data,
  );
  return res.data;
}

export async function deleteVariant(productId: string, variantId: string): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/variants/${variantId}`);
}

export async function adjustStock(
  productId: string,
  variantId: string,
  delta: number,
  reason: string,
): Promise<{ id: string; stockQuantity: number; updatedAt: string }> {
  const res = await apiClient.post(
    `/seller/products/${productId}/variants/${variantId}/stock`,
    { delta, reason },
  );
  return res.data;
}
