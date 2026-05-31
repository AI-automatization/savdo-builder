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
    onSuccess: () => {
      // Инвалидируем корзину (а не пишем null): при возврате на /cart в течение
      // staleTime сервер мог не очистить корзину (частичный сбой clearCart) —
      // refetch гарантирует правду, а не показывает «пусто» 60 секунд.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
