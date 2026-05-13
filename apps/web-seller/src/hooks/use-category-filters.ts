'use client';

import { useQuery } from '@tanstack/react-query';
import { getCategoryFilters } from '../lib/api/storefront.api';

export function useCategoryFilters(slug: string | null | undefined) {
  return useQuery({
    queryKey: ['storefront', 'category-filters', slug],
    queryFn: () => getCategoryFilters(slug!),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
