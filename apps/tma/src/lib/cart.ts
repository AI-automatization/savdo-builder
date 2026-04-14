export interface CartItem {
  productId: string;
  title: string;
  price: number;
  qty: number;
  storeId: string;
  storeSlug: string;
  storeName: string;
}

const CART_KEY = 'savdo_cart';

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
}

export function clearCart(): void {
  localStorage.removeItem(CART_KEY);
}
