'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { OrderStatus } from 'types';
import { getSellerOrders, getSellerOrder, updateOrderStatus } from '../lib/api/orders.api';

export const orderKeys = {
  all: ['orders'] as const,
  list: (filters?: object) => ['orders', 'list', filters] as const,
  detail: (id: string) => ['orders', id] as const,
};

export function useSellerOrders(params?: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: orderKeys.list(params),
    queryFn: () => getSellerOrders(params),
    staleTime: 30 * 1000,
  });
}

export function useSellerOrder(id: string) {
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: () => getSellerOrder(id),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: OrderStatus;
      reason?: string;
    }) => updateOrderStatus(id, status, reason),
    onSuccess: (order) => {
      queryClient.setQueryData(orderKeys.detail(order.id), order);
      queryClient.invalidateQueries({ queryKey: orderKeys.all });
    },
  });
}
