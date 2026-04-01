import type { PaginatedOrders, Order, OrderStatus } from 'types';
import { apiClient } from './client';

export async function getSellerOrders(params?: {
  status?: OrderStatus;
  page?: number;
  limit?: number;
}): Promise<PaginatedOrders> {
  const res = await apiClient.get<PaginatedOrders>('/seller/orders', { params });
  return res.data;
}

export async function getSellerOrder(id: string): Promise<Order> {
  const res = await apiClient.get<Order>(`/seller/orders/${id}`);
  return res.data;
}

export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  reason?: string,
): Promise<Order> {
  const res = await apiClient.patch<Order>(`/seller/orders/${id}/status`, { status, reason });
  return res.data;
}
