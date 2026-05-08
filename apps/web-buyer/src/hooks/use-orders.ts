'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus } from 'types';
import { getBuyerOrders, getBuyerOrder, cancelOrder } from '../lib/api/orders.api';

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters?: object) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', id] as const,
};

export function useOrders(params?: { status?: OrderStatus; page?: number; limit?: number; enabled?: boolean }) {
  const { enabled, ...listParams } = params ?? {};
  return useQuery({
    queryKey: orderKeys.list(listParams),
    queryFn: () => getBuyerOrders(listParams),
    staleTime: 2 * 60 * 1000,
    enabled: enabled ?? true,
  });
}

export function useOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getBuyerOrder(id),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => cancelOrder(id, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
