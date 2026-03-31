/**
 * Server-side storefront fetchers — no 'use client'.
 * Used in async Server Components (Next.js App Router).
 * Public endpoints only (no auth required).
 */

import type { ProductListItem } from 'types';
import type { StorefrontStore } from './storefront.api';

const BASE = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000'}/api/v1`;

async function sfetch<T>(path: string, params?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => v && url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), { next: { revalidate: 30 } });
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
  storeCategoryId?: string;
}): Promise<ProductListItem[]> {
  return sfetch<ProductListItem[]>('/storefront/products', {
    storeId: params.storeId,
    ...(params.storeCategoryId ? { storeCategoryId: params.storeCategoryId } : {}),
  });
}
