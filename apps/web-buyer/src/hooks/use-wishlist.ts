'use client';

import { useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WishlistItem } from 'types';
import { useAuth } from '@/lib/auth/context';
import { addToWishlist, getWishlist, removeFromWishlist } from '@/lib/api/wishlist.api';

export const WISHLIST_KEYS = {
  list: ['wishlist'] as const,
};

/**
 * Fetches the buyer's wishlist. Disabled when not authenticated.
 * Stale time matches the typical session length — list rarely changes
 * out-of-band; mutations update the cache directly.
 */
export function useWishlist() {
  const { isAuthenticated } = useAuth();
  return useQuery({
    queryKey: WISHLIST_KEYS.list,
    queryFn: getWishlist,
    enabled: isAuthenticated,
    staleTime: 60_000,
  });
}

/**
 * Memoised Set<productId> for fast `inWishlist` lookups across many cards.
 * Returns empty set when unauthenticated or list is loading.
 */
export function useWishlistIds(): Set<string> {
  const { data } = useWishlist();
  return useMemo(() => new Set((data ?? []).map((i) => i.productId)), [data]);
}

interface ToggleArgs {
  productId: string;
  /** Currently in wishlist? Used to pick POST vs DELETE. */
  inWishlist: boolean;
  /** Optional product preview — used for an optimistic insert when adding. */
  productPreview?: WishlistItem['product'];
}

/**
 * Optimistic toggle. Adds or removes locally before the request resolves;
 * reverts on failure.
 *
 * Note: when adding, server only returns {id, productId, createdAt} — no embedded
 * product. We pre-insert with `productPreview` if supplied, then rely on the next
 * refetch to fill in any drift. If `productPreview` is missing, we skip the
 * optimistic insert (the heart will still flip via the predicted next set).
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, inWishlist }: ToggleArgs) =>
      inWishlist ? removeFromWishlist(productId) : addToWishlist(productId),

    onMutate: async ({ productId, inWishlist, productPreview }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEYS.list });
      const prev = queryClient.getQueryData<WishlistItem[]>(WISHLIST_KEYS.list);

      queryClient.setQueryData<WishlistItem[]>(WISHLIST_KEYS.list, (current) => {
        const list = current ?? [];
        if (inWishlist) {
          return list.filter((i) => i.productId !== productId);
        }
        if (!productPreview) return list;
        const optimistic: WishlistItem = {
          id: `optimistic-${productId}`,
          productId,
          createdAt: new Date().toISOString(),
          product: productPreview,
        };
        return [optimistic, ...list];
      });

      return { prev };
    },

    onError: (_err, _args, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(WISHLIST_KEYS.list, ctx.prev);
      }
    },

    // Refetch after to pull authoritative data (replaces optimistic placeholder
    // with the server-issued WishlistItem incl. real id and embedded product).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.list });
    },
  });
}
