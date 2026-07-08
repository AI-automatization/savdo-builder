export interface CartItem {
  productId: string;
  variantId?: string;
  title: string;
  price: number;
  qty: number;
  storeId: string;
  storeSlug: string;
  storeName: string;
  stockMax?: number;
}

const CART_KEY = 'savdo_cart';

// TMA-CART-BADGE-STALE-010: корзина живёт в localStorage без реактивности —
// бейдж в BottomNav не обновлялся при смене qty/clearCart на текущей странице
// (только при ре-навигации). Делаем pub/sub: мутации шлют событие, подписчики
// (бейдж) перечитывают счётчик. 'storage' покрывает кросс-табовые изменения.
const CART_EVENT = 'savdo:cart-changed';

function emitCartChanged(): void {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(CART_EVENT));
}

export function cartItemCount(): number {
  return getCart().reduce((s, i) => s + i.qty, 0);
}

export function subscribeCart(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const onStorage = (e: StorageEvent) => { if (e.key === CART_KEY) cb(); };
  window.addEventListener(CART_EVENT, cb);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CART_EVENT, cb);
    window.removeEventListener('storage', onStorage);
  };
}

function isValidItem(item: unknown): item is CartItem {
  if (!item || typeof item !== 'object') return false;
  const i = item as Record<string, unknown>;
  return (
    typeof i.productId === 'string' &&
    typeof i.title === 'string' &&
    typeof i.price === 'number' && i.price >= 0 &&
    typeof i.qty === 'number' && i.qty > 0 &&
    typeof i.storeId === 'string' &&
    typeof i.storeSlug === 'string' &&
    typeof i.storeName === 'string'
  );
}

export function getCart(): CartItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_KEY) ?? '[]');
    if (!Array.isArray(raw)) return [];
    return raw.filter(isValidItem);
  } catch {
    localStorage.removeItem(CART_KEY);
    return [];
  }
}

export function saveCart(items: CartItem[]): void {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  emitCartChanged();
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
  emitCartChanged();
}

// B13: removeCartItem must match both productId AND variantId to avoid
// removing all variants of a product when only one variant is targeted.
export function removeCartItem(
  items: CartItem[],
  productId: string,
  variantId: string | undefined,
): CartItem[] {
  return items.filter(
    (i) => !(i.productId === productId && i.variantId === variantId),
  );
}

/** Returns true if the cart is empty or all items are from the same store. */
export function isSameStore(cart: CartItem[], storeId: string): boolean {
  return cart.length === 0 || cart[0].storeId === storeId;
}
