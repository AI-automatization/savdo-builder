// Wishlist API + local-state mirror.
// API: GET/POST/DELETE /api/v1/buyer/wishlist[/...] (requires auth).
// Local mirror = a Set<productId> in-memory + sessionStorage so heart toggles
// stay snappy even between page transitions.

import { api } from './api';
import type { WishlistItem } from 'types';

const STORAGE_KEY = 'tma_wishlist_ids_v1';

let cache: Set<string> | null = null;
const listeners = new Set<() => void>();

function notify(): void {
  for (const fn of listeners) fn();
}

function load(): Set<string> {
  if (cache) return cache;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    cache = new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

function save(): void {
  if (!cache) return;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(cache)));
  } catch {
    /* sessionStorage full / blocked — degrade silently */
  }
}

export function isInWishlist(productId: string): boolean {
  return load().has(productId);
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Hydrate cache from server (called once on app boot or page open). */
export async function hydrateWishlist(): Promise<void> {
  try {
    const items = await api<WishlistItem[]>('/buyer/wishlist');
    cache = new Set(items.map((i) => i.productId));
    save();
    notify();
  } catch {
    /* unauthenticated or network — keep current cache */
  }
}

/** Optimistic add. Reverts on failure. */
export async function addToWishlist(productId: string): Promise<boolean> {
  const set = load();
  if (set.has(productId)) return true;
  set.add(productId);
  save();
  notify();
  try {
    await api('/buyer/wishlist', { method: 'POST', body: { productId } });
    return true;
  } catch {
    set.delete(productId);
    save();
    notify();
    return false;
  }
}

/** Optimistic remove. Reverts on failure. */
export async function removeFromWishlist(productId: string): Promise<boolean> {
  const set = load();
  if (!set.has(productId)) return true;
  set.delete(productId);
  save();
  notify();
  try {
    await api(`/buyer/wishlist/${productId}`, { method: 'DELETE' });
    return true;
  } catch {
    set.add(productId);
    save();
    notify();
    return false;
  }
}

export async function toggleWishlist(productId: string): Promise<boolean> {
  return isInWishlist(productId)
    ? removeFromWishlist(productId)
    : addToWishlist(productId);
}

/** Mark a productId as favorited locally (e.g. after server confirms via initial flag). */
export function setLocalFlag(productId: string, value: boolean): void {
  const set = load();
  if (value) set.add(productId);
  else set.delete(productId);
  save();
  notify();
}
