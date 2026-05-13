import type { GlobalCategory, ProductListItem, Product, StorefrontStore } from 'types';
import type {
  FeaturedStorefrontResponse,
  GlobalCategoryTreeItem,
  StorefrontStoreWithTrust,
} from '@/types/storefront';
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
  const res = await apiClient.get<{ data: ProductListItem[]; meta: { total: number; page: number } }>(`/storefront/products?${search.toString()}`);
  return res.data.data;
}

export async function getProduct(id: string): Promise<Product> {
  const res = await apiClient.get<Product>(`/storefront/products/${id}`);
  return res.data;
}

export async function getCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  const res = await apiClient.get<StorefrontCategoryFilter[]>(`/storefront/categories/${slug}/filters`);
  return res.data;
}

// ── Reviews ───────────────────────────────────────────────────────────────────

/** Public review item — local type pending Полат promoting to packages/types. */
export interface ProductReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
}

export interface ProductReviewsResponse {
  items: ProductReviewItem[];
  total: number;
  page: number;
  limit: number;
}

export async function getProductReviews(
  productId: string,
  page = 1,
  limit = 20,
): Promise<ProductReviewsResponse> {
  const res = await apiClient.get<ProductReviewsResponse>(
    `/storefront/products/${productId}/reviews?page=${page}&limit=${limit}`,
  );
  return res.data;
}

// ── Featured storefront (MARKETING-HOMEPAGE-DISCOVERY-001) ───────────────────

export async function getFeaturedStorefront(): Promise<FeaturedStorefrontResponse> {
  const res = await apiClient.get<FeaturedStorefrontResponse>('/storefront/featured');
  return res.data;
}

// ── Categories tree (с iconEmoji) ────────────────────────────────────────────

export async function getCategoriesTree(): Promise<GlobalCategoryTreeItem[]> {
  const res = await apiClient.get<GlobalCategoryTreeItem[]>('/storefront/categories/tree');
  return res.data;
}

// ── Platform-wide products feed (для category-filtered featured) ─────────────

export interface PlatformFeedParams {
  globalCategoryId?: string;
  q?: string;
  sort?: 'new' | 'price_asc' | 'price_desc';
  limit?: number;
}

export async function getPlatformFeed(
  params: PlatformFeedParams = {},
): Promise<{ data: ProductListItem[]; total: number; page: number }> {
  const search = new URLSearchParams();
  if (params.globalCategoryId) search.set('globalCategoryId', params.globalCategoryId);
  if (params.q) search.set('q', params.q);
  if (params.sort) search.set('sort', params.sort);
  if (params.limit) search.set('limit', String(params.limit));
  const qs = search.toString();
  const res = await apiClient.get<{
    data: ProductListItem[];
    meta: { total: number; page: number };
  }>(qs ? `/storefront/products?${qs}` : `/storefront/products`);
  return { data: res.data.data, total: res.data.meta.total, page: res.data.meta.page };
}

// ── Store с trust signals (для product page seller block) ────────────────────

export async function getStorefrontStoreWithTrust(slug: string): Promise<StorefrontStoreWithTrust> {
  const res = await apiClient.get<StorefrontStoreWithTrust>(`/storefront/stores/${slug}`);
  return res.data;
}
