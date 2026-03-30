import type { CheckoutPreview, CheckoutConfirmRequest, Order } from 'types';
import { apiClient } from './client';

export async function getCheckoutPreview(): Promise<CheckoutPreview> {
  const res = await apiClient.get<CheckoutPreview>('/checkout/preview');
  return res.data;
}

export async function confirmCheckout(data: CheckoutConfirmRequest): Promise<Order> {
  const res = await apiClient.post<Order>('/checkout/confirm', data);
  return res.data;
}
