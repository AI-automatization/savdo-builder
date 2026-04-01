'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { CheckoutConfirmRequest } from 'types';
import { getCheckoutPreview, confirmCheckout } from '../lib/api/checkout.api';

export function useCheckoutPreview() {
  return useQuery({
    queryKey: ['checkout', 'preview'],
    queryFn: getCheckoutPreview,
    staleTime: 0,
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
