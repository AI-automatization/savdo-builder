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
      // Инвалидируем корзину (а не пишем null): при возврате на /cart в течение
      // staleTime сервер мог не очистить корзину (частичный сбой clearCart) —
      // refetch гарантирует правду, а не показывает «пусто» 60 секунд.
      queryClient.invalidateQueries({ queryKey: ['cart'] });
      // WEB-BUYER-CHECKOUT-REDIRECT-FAIL-001 (21.04.2026): праймим detail-кэш
      // созданным заказом, а invalidate сужаем до списка — иначе широкий
      // orderKeys.all стирает только что записанный detail, и redirect на
      // /orders/{id} делает лишний GET (при read-after-write лаге бэкенда это
      // вернуло бы оригинальный симптом «Не удалось загрузить заказ»).
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.list() });
    },
  });
}
