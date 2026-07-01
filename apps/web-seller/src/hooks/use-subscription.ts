'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../lib/auth/context';
import { getSubscription } from '../lib/api/subscription.api';

export function useSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['seller', 'subscription'],
    queryFn: getSubscription,
    staleTime: 2 * 60 * 1000,
    enabled: user?.role === 'SELLER',
    // endpoint может не существовать на старых деплоях — не спамим retry
    retry: false,
  });
}
