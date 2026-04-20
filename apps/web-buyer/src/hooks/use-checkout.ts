'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckoutConfirmRequest } from 'types';
import { getCheckoutPreview, confirmCheckout } from '../lib/api/checkout.api';
import { orderKeys } from './use-orders';

export function useCheckoutPreview() {
  return useQuery({
    queryKey: ['checkout', 'preview'],
    queryFn: getCheckoutPreview,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useConfirmCheckout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CheckoutConfirmRequest) => confirmCheckout(data),
    onSuccess: (order) => {
      queryClient.setQueryData(['cart'], null);
      // Prepopulate order detail cache so /orders/[id] renders immediately
      // without a second GET that could race against backend or hit auth-series 401.
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      // Invalidate only list queries — don't nuke the detail we just set.
      queryClient.invalidateQueries({ queryKey: ['orders', 'list'] });
    },
  });
}
