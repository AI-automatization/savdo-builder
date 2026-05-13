// apps/web-seller/src/lib/api/storefront.api.ts
//
// Storefront endpoints, доступные seller-приложению для подгрузки
// per-category metadata (фильтры). Локальный тип StorefrontCategoryFilter
// дублирует web-buyer — позже поднять в packages/types.

import { apiClient } from './client';

export interface StorefrontCategoryFilter {
  key: string;
  nameRu: string;
  nameUz: string;
  fieldType: 'select' | 'number' | 'text' | 'boolean' | 'multi_select' | 'color' | string;
  options: string[] | null;
  unit: string | null;
  sortOrder: number;
  isRequired?: boolean;
}

export async function getCategoryFilters(slug: string): Promise<StorefrontCategoryFilter[]> {
  const res = await apiClient.get<StorefrontCategoryFilter[]>(
    `/storefront/categories/${slug}/filters`,
  );
  return res.data;
}
