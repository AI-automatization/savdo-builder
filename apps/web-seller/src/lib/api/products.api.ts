import type { ProductListItem, Product, ProductVariant, ProductAttribute, ProductStatus, ProductDisplayType } from 'types';
import { apiClient } from './client';

// ── Products ───────────────────────────────────────────────────────────────────

export async function getSellerProducts(params?: {
  status?: ProductStatus;
  globalCategoryId?: string;
  storeCategoryId?: string;
}): Promise<{ products: ProductListItem[]; total: number }> {
  const res = await apiClient.get<{ products: ProductListItem[]; total: number }>('/seller/products', { params });
  return res.data;
}

export async function getSellerProduct(id: string): Promise<Product> {
  const res = await apiClient.get<Product>(`/seller/products/${id}`);
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
  mediaId?: string;
  displayType?: ProductDisplayType;
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
    mediaId?: string;
    displayType?: ProductDisplayType;
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

// ── Product images ────────────────────────────────────────────────────────────

export interface ProductImageItem {
  id: string;
  mediaId: string;
  url?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export async function addProductImage(
  productId: string,
  data: { mediaId: string; isPrimary?: boolean; sortOrder?: number },
): Promise<ProductImageItem> {
  const res = await apiClient.post<ProductImageItem>(
    `/seller/products/${productId}/images`,
    data,
  );
  return res.data;
}

export async function deleteProductImage(productId: string, imageId: string): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/images/${imageId}`);
}

// ── Product attributes (free-form key/value) ──────────────────────────────────

export async function getProductAttributes(productId: string): Promise<ProductAttribute[]> {
  const res = await apiClient.get<ProductAttribute[]>(
    `/seller/products/${productId}/attributes`,
  );
  return res.data;
}

export async function createProductAttribute(
  productId: string,
  data: { name: string; value: string; sortOrder?: number },
): Promise<ProductAttribute> {
  const res = await apiClient.post<ProductAttribute>(
    `/seller/products/${productId}/attributes`,
    data,
  );
  return res.data;
}

export async function deleteProductAttribute(productId: string, attributeId: string): Promise<void> {
  await apiClient.delete(`/seller/products/${productId}/attributes/${attributeId}`);
}
