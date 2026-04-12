import type { GlobalCategory, ProductListItem, Product, StorefrontStore } from 'types';
import { apiClient } from './client';

export type { StorefrontStore };

export async function getStoreBySlug(slug: string): Promise<StorefrontStore> {
  const res = await apiClient.get<StorefrontStore>(`/storefront/stores/${slug}`);
  return res.data;
}

export async function getCategories(): Promise<GlobalCategory[]> {
  const res = await apiClient.get<GlobalCategory[]>('/storefront/categories');
  return res.data;
}

export async function getProducts(params: {
  storeId: string;
  globalCategoryId?: string;
  storeCategoryId?: string;
}): Promise<ProductListItem[]> {
  const res = await apiClient.get<ProductListItem[]>('/storefront/products', { params });
  return res.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get<Product>(`/storefront/products/${id}`);
  return res.data;
}
