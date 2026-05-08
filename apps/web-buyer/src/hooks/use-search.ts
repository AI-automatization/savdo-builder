'use client';

import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchStorefront } from '../lib/api/search.api';

const DEBOUNCE_MS = 250;
const MIN_LEN = 2;

export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

export function useStorefrontSearch(query: string) {
  const debounced = useDebouncedValue(query.trim());
  const enabled = debounced.length >= MIN_LEN;
  return useQuery({
    queryKey: ['storefront-search', debounced],
    queryFn: () => searchStorefront(debounced),
    enabled,
    staleTime: 30_000,
    retry: false,
  });
}
