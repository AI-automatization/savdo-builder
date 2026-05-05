import type { WishlistItem } from 'types';
import { apiClient } from './client';

export type { WishlistItem };

/** Server response shape for POST /buyer/wishlist (no embedded product). */
export interface WishlistAddResponse {
  id: string;
  productId: string;
  createdAt: string;
}

export async function getWishlist(): Promise<WishlistItem[]> {
  const { data } = await apiClient.get<WishlistItem[]>('/buyer/wishlist');
  return data ?? [];
}

export async function addToWishlist(productId: string): Promise<WishlistAddResponse> {
  const { data } = await apiClient.post<WishlistAddResponse>('/buyer/wishlist', { productId });
  return data;
}

export async function removeFromWishlist(productId: string): Promise<void> {
  await apiClient.delete(`/buyer/wishlist/${productId}`);
}
