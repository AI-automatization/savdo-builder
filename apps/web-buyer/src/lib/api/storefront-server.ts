/**
 * Server-side storefront fetchers — no 'use client'.
 * Used in async Server Components (Next.js App Router).
 * Public endpoints only (no auth required).
 */

import type { GlobalCategory, ProductListItem, StorefrontStore } from 'types';
import type { StorefrontCategoryFilter } from './storefront.api';

const BASE = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/v1`;

async function sfetch<T>(path: string, search?: URLSearchParams | Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (search instanceof URLSearchParams) {
    search.forEach((v, k) => url.searchParams.append(k, v));
  } else if (search) {
    Object.entries(search).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    next: { revalidate: process.env.NODE_ENV === 'development' ? 0 : 30 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.message ?? res.statusText), { status: res.status, code: err.code });
  }
  return res.json() as Promise<T>;
}

export async function serverGetStoreBySlug(slug: string): Promise<StorefrontStore> {
  return sfetch<StorefrontStore>(`/storefront/stores/${slug}`);
}

export async function serverGetProducts(params: {
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
  const res = await sfetch<{ data: ProductListItem[]; meta: { total: number; page: number } }>('/storefront/products', search);
  return res.data;
}

export async function serverGetGlobalCategories(): Promise<GlobalCategory[]> {
  return sfetch<GlobalCategory[]>('/storefront/categories');
}

export async function serverGetCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  return sfetch<StorefrontCategoryFilter[]>(`/storefront/categories/${slug}/filters`);
}
