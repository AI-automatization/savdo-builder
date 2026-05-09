import type { StorefrontSearchResponse } from 'types';
import { apiClient } from './client';

// FEAT-001 backend: GET /storefront/search?q=&limit= → { stores, products }.
// Min 2 chars; throttled 30/min per IP.
// API-STOREFRONT-SEARCH-CONTRACT-001 (закрыто Полатом 08.05.2026): тип
// в `packages/types/src/api/search.ts`. Локальные дубли удалены.

export async function searchStorefront(q: string, limit = 8): Promise<StorefrontSearchResponse> {
  const res = await apiClient.get<StorefrontSearchResponse>('/storefront/search', {
    params: { q, limit },
  });
  return res.data;
}
