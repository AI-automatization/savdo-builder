'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getSellerSummary, getSellerAnalytics } from '../lib/api/analytics.api';
import { useAuth } from '../lib/auth/context';

export function useSellerSummary() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['analytics', 'seller', 'summary'],
    queryFn: getSellerSummary,
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: !!user && user.role === 'SELLER',
  });
}

export type AnalyticsPeriod = 7 | 30 | 90;

/** Hook for the rich seller analytics endpoint (revenue / orders / sparkline / top). */
export function useSellerAnalytics(period: AnalyticsPeriod) {
  const { user } = useAuth();
  // Derive ISO range; memo so the queryKey is stable across renders.
  const { from, to } = useMemo(() => {
    const now = new Date();
    const fromDate = new Date(now.getTime() - period * 24 * 60 * 60 * 1000);
    return { from: fromDate.toISOString(), to: now.toISOString() };
  }, [period]);

  return useQuery({
    queryKey: ['analytics', 'seller', 'range', period],
    queryFn: () => getSellerAnalytics({ from, to }),
    staleTime: 60 * 1000,
    retry: false,
    enabled: !!user && user.role === 'SELLER',
  });
}
