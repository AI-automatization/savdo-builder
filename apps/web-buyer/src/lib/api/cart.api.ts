import type {
  Cart,
  AddCartItemRequest,
  UpdateCartItemRequest,
  MergeCartRequest,
} from 'types';
import { apiClient } from './client';
import { getSessionToken } from '../auth/storage';

function sessionHeader() {
  const token = getSessionToken();
  return token ? { 'X-Session-Token': token } : {};
}

export async function getCart(): Promise<Cart | null> {
  const res = await apiClient.get<Cart | null>('/cart', {
    headers: sessionHeader(),
  });
  return res.data;
}

export async function addCartItem(data: AddCartItemRequest): Promise<Cart> {
  const res = await apiClient.post<Cart>('/cart/items', data, {
    headers: sessionHeader(),
  });
  return res.data;
}

export async function updateCartItem(itemId: string, data: UpdateCartItemRequest): Promise<Cart> {
  const res = await apiClient.patch<Cart>(`/cart/items/${itemId}`, data, {
    headers: sessionHeader(),
  });
  return res.data;
}

export async function removeCartItem(itemId: string): Promise<void> {
  await apiClient.delete(`/cart/items/${itemId}`, {
    headers: sessionHeader(),
  });
}

export async function clearCart(): Promise<void> {
  await apiClient.delete('/cart', { headers: sessionHeader() });
}

export async function mergeCart(data: MergeCartRequest): Promise<void> {
  await apiClient.post('/cart/merge', data);
}
