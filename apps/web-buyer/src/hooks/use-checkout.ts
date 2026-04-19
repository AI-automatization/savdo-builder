'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckoutConfirmRequest } from 'types';
import { getCheckoutPreview, confirmCheckout } from '../lib/api/checkout.api';

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
    onSuccess: () => {
      queryClient.setQueryData(['cart'], null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}
