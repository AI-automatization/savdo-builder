'use client';

import { useQuery } from '@tanstack/react-query';
import { getSellerSummary } from '../lib/api/analytics.api';

export function useSellerSummary() {
  return useQuery({
    queryKey: ['analytics', 'seller', 'summary'],
    queryFn: getSellerSummary,
    staleTime: 5 * 60 * 1000, // 5 min
  });
}
