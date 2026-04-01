import type { GlobalCategory, ProductListItem, Product, StoreCategory } from 'types';
import { apiClient } from './client';

// Local type — pending Полатр adding it to packages/types
export interface StorefrontStore {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  city: string;
  telegramContactLink: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  categories: Pick<StoreCategory, 'id' | 'name' | 'sortOrder'>[];
}

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
