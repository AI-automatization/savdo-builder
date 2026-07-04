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
}

/**
 * Optimistic toggle. Removes locally before the request resolves, reverts on
 * failure. Adding has no optimistic insert — the server only returns
 * {id, productId, createdAt} with no embedded product, so there's nothing to
 * render until the onSettled refetch lands; the heart's own `inWishlist` state
 * still flips immediately from the mutation args.
 */
export function useToggleWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, inWishlist }: ToggleArgs) => {
      if (inWishlist) {
        await removeFromWishlist(productId);
      } else {
        await addToWishlist(productId);
      }
    },

    onMutate: async ({ productId, inWishlist }) => {
      await queryClient.cancelQueries({ queryKey: WISHLIST_KEYS.list });
      const prev = queryClient.getQueryData<WishlistItem[]>(WISHLIST_KEYS.list);

      if (inWishlist) {
        queryClient.setQueryData<WishlistItem[]>(WISHLIST_KEYS.list, (current) =>
          (current ?? []).filter((i) => i.productId !== productId),
        );
      }

      return { prev };
    },

    onError: (_err, _args, ctx) => {
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(WISHLIST_KEYS.list, ctx.prev);
      }
    },

    // Refetch after to pull authoritative data (fills in the added item with
    // its server-issued id + embedded product, since add has no local copy).
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: WISHLIST_KEYS.list });
    },
  });
}
