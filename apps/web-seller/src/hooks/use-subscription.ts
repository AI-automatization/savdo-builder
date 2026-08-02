'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySubscription, cancelMySubscription } from '../lib/api/subscription.api';

export const subscriptionKeys = {
  all: ['subscription'] as const,
  current: ['subscription', 'current'] as const,
};

export function useMySubscription() {
  return useQuery({
    queryKey: subscriptionKeys.current,
    queryFn: getMySubscription,
    staleTime: 60 * 1000,
  });
}

export function useCancelSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason?: string) => cancelMySubscription(reason),
    onSuccess: (subscription) => {
      queryClient.setQueryData(subscriptionKeys.current, subscription);
    },
  });
}
