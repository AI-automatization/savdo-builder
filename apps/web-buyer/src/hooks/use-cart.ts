'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { AddCartItemRequest, UpdateCartItemRequest } from 'types';
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
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AddCartItemRequest) => addCartItem(data),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, data }: { itemId: string; data: UpdateCartItemRequest }) =>
      updateCartItem(itemId, data),
    onSuccess: (cart) => queryClient.setQueryData(CART_KEY, cart),
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removeCartItem(itemId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CART_KEY }),
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => queryClient.setQueryData(CART_KEY, null),
  });
}
