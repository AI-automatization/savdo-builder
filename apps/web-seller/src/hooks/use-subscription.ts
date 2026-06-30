'use client';

import { useQuery } from '@tanstack/react-query';
import type { SubscriptionDto } from 'types';
import { getSubscription } from '../lib/api/subscription.api';
import { useAuth } from '../lib/auth/context';

export function useSubscription() {
  const { user } = useAuth();
  return useQuery<SubscriptionDto>({
    queryKey: ['seller', 'subscription'],
    queryFn: getSubscription,
    staleTime: 2 * 60 * 1000,
    enabled: !!user && user.role === 'SELLER',
  });
}
