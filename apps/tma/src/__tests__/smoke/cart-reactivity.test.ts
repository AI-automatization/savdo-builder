// TMA-CART-BADGE-STALE-010 regression: cart — реактивный pub/sub.
// Раньше бейдж корзины читал getCart() только при рендере и не обновлялся на
// мутациях (add/remove/clear) без ре-навигации. Проверяем, что saveCart/clearCart
// шлют событие подписчику и cartItemCount считает суммарный qty.

import { beforeEach, describe, it, expect, vi } from 'vitest';
import { saveCart, clearCart, cartItemCount, subscribeCart, type CartItem } from '@/lib/cart';

const item = (productId: string, qty: number): CartItem => ({
  productId,
  title: `p-${productId}`,
  price: 1000,
  qty,
  storeId: 's1',
  storeSlug: 's1',
  storeName: 'store',
});

describe('cart реактивность (TMA-CART-BADGE-STALE-010)', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('cartItemCount суммирует qty всех позиций', () => {
    saveCart([item('a', 2), item('b', 3)]);
    expect(cartItemCount()).toBe(5);
  });

  it('saveCart уведомляет подписчика, count обновляется', () => {
    const cb = vi.fn();
    const unsub = subscribeCart(cb);
    saveCart([item('a', 1)]);
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cartItemCount()).toBe(1);
    saveCart([item('a', 4)]);
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cartItemCount()).toBe(4);
    unsub();
  });

  it('clearCart уведомляет подписчика и обнуляет count', () => {
    saveCart([item('a', 2)]);
    const cb = vi.fn();
    const unsub = subscribeCart(cb);
    clearCart();
    expect(cb).toHaveBeenCalledTimes(1);
    expect(cartItemCount()).toBe(0);
    unsub();
  });

  it('после unsubscribe подписчик больше не вызывается', () => {
    const cb = vi.fn();
    const unsub = subscribeCart(cb);
    unsub();
    saveCart([item('a', 1)]);
    expect(cb).not.toHaveBeenCalled();
  });
});
