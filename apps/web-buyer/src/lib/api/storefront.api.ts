import type { GlobalCategory, ProductListItem, Product, StorefrontStore } from 'types';
import { apiClient } from './client';

export type { StorefrontStore };

/** Storefront category filter metadata (Sprint 31). */
export interface StorefrontCategoryFilter {
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'select' | 'number' | 'text' | 'boolean' | string;
  options: string[] | null;
  unit: string | null;
  sortOrder: number;
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
  attributeFilters?: Record<string, string>;
}): Promise<ProductListItem[]> {
  const search = new URLSearchParams();
  search.set('storeId', params.storeId);
  if (params.globalCategoryId) search.set('globalCategoryId', params.globalCategoryId);
  if (params.storeCategoryId) search.set('storeCategoryId', params.storeCategoryId);
  if (params.attributeFilters) {
    for (const [k, v] of Object.entries(params.attributeFilters)) {
      if (v) search.append(`filters[${k}]`, v);
    }
  }
  const res = await apiClient.get<ProductListItem[]>(`/storefront/products?${search.toString()}`);
  return res.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get<Product>(`/storefront/products/${id}`);
  return res.data;
}

export async function getCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  const res = await apiClient.get<StorefrontCategoryFilter[]>(`/storefront/categories/${slug}/filters`);
  // Backend serializes fieldType as Prisma enum (uppercase: SELECT/NUMBER/TEXT/BOOLEAN).
  // Frontend renderer compares against lowercase literals — normalize here.
  return res.data.map((f) => ({ ...f, fieldType: typeof f.fieldType === 'string' ? f.fieldType.toLowerCase() : f.fieldType }));
}
