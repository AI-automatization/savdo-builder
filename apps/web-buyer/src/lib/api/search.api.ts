import { apiClient } from './client';

// FEAT-001 backend: GET /storefront/search?q=&limit= → { stores, products }.
// Min 2 chars; throttled 30/min per IP. We mirror the backend response shape
// here as a local type — packages/types doesn't define it yet.

export interface SearchStoreHit {
  id: string;
  slug: string;
  name: string;
  city: string | null;
  description?: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
}

export interface SearchProductHit {
  id: string;
  title: string;
  basePrice: number;
  oldPrice: number | null;
  salePrice: number | null;
  currencyCode: string;
  images: { url: string }[];
  store: { id: string; name: string; slug: string } | null;
}

export interface StorefrontSearchResponse {
  stores: SearchStoreHit[];
  products: SearchProductHit[];
}

export async function searchStorefront(q: string, limit = 8): Promise<StorefrontSearchResponse> {
  const res = await apiClient.get<StorefrontSearchResponse>('/storefront/search', {
    params: { q, limit },
  });
  return res.data;
}
