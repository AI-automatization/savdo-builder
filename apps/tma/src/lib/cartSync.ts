import { api } from './api';
import { getCart, clearCart, type CartItem } from './cart';

/**
 * TMA-CART-API-SYNC-001: одноразовая синхронизация localStorage cart → backend
 * после login. Раньше TMA cart жил только в localStorage → переключение на
 * web-buyer показывало пустую корзину (или старую с прошлой сессии).
 *
 * Behavior:
 *   - Idempotent через флаг `savdo_cart_synced` в localStorage. Sync делается
 *     максимум один раз per device (до следующего clearCart).
 *   - Тихий fallback: если backend упал → флаг не ставим, retry на следующем
 *     login (или manual вызов).
 *   - После успешного sync — НЕ очищает localStorage (UI cache остаётся для
 *     быстрого rendering). Web-buyer теперь видит те же items через /cart API.
 */

const SYNCED_FLAG_KEY = 'savdo_cart_synced';

interface BulkMergeResponse {
  cart: unknown;
  imported: number;
  skipped: number;
}

export async function syncCartToBackend(): Promise<{ ok: boolean; imported?: number; skipped?: number }> {
  // Skip если уже sync'нули с этого устройства.
  if (localStorage.getItem(SYNCED_FLAG_KEY) === '1') {
    return { ok: true, imported: 0, skipped: 0 };
  }

  const items = getCart();
  if (items.length === 0) {
    // Ничего sync'ить — флаг всё равно ставим (state = «synchronized empty»).
    localStorage.setItem(SYNCED_FLAG_KEY, '1');
    return { ok: true, imported: 0, skipped: 0 };
  }

  try {
    const result = await api<BulkMergeResponse>('/cart/bulk-merge', {
      method: 'POST',
      body: {
        items: items.map((i: CartItem) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: Math.min(i.qty, 100),
        })),
      },
    });
    localStorage.setItem(SYNCED_FLAG_KEY, '1');
    return { ok: true, imported: result.imported, skipped: result.skipped };
  } catch (err) {
    // Не ломаем UX — sync best-effort. Retry на следующем login.
    console.warn('[cartSync] bulk-merge failed:', err instanceof Error ? err.message : String(err));
    return { ok: false };
  }
}

/**
 * Reset sync state — при logout. Чтобы следующий login (возможно другой
 * аккаунт) делал свой sync, не используя stale флаг.
 */
export function resetCartSync(): void {
  localStorage.removeItem(SYNCED_FLAG_KEY);
}

/**
 * Hard reset: сбросить и сам cart, и флаг. Используется при INV-C01
 * cross-store violation (если user добавил товары другого магазина после
 * sync — старая корзина уже на бэке смержена с новым store через
 * bulk-merge clear+setStoreId, поэтому local cart тоже надо чистить).
 */
export function fullCartReset(): void {
  clearCart();
  resetCartSync();
}
