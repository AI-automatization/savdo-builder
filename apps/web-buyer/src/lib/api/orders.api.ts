import type { PaginatedOrders, Order, OrderStatus } from 'types';
import { apiClient } from './client';

export async function getBuyerOrders(params?: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedOrders> {
  const res = await apiClient.get<PaginatedOrders>('/buyer/orders', { params });
  return res.data;
}

export async function getBuyerOrder(id: string): Promise<Order> {
  const res = await apiClient.get<Order>(`/buyer/orders/${id}`);
  return res.data;
}

export async function cancelOrder(id: string, reason?: string): Promise<Order> {
  const res = await apiClient.patch<Order>(`/buyer/orders/${id}/status`, {
    status: 'CANCELLED',
    reason,
  });
  return res.data;
}
