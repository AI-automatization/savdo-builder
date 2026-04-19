'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddCartItemRequest, UpdateCartItemRequest, Cart } from 'types';
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../lib/api/cart.api';

const CART_KEY = ['cart'] as const;

export function useCart() {
  return useQuery({
    queryKey: CART_KEY,
    queryFn: getCart,
    staleTime: 60 * 1000,
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => addCartItem(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateCartItemRequest }) =>
      updateCartItem(itemId, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: (_, itemId) => {
      queryClient.setQueryData<Cart | null>(CART_KEY, (prev) => {
        if (!prev) return prev;
        const items = prev.items.filter((i) => i.id !== itemId);
        const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);
        return { ...prev, items, totalAmount };
      });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.setQueryData(CART_KEY, null),
  });
}
