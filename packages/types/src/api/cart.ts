import { ProductRef, VariantRef } from './products';

// ── Cart Item ─────────────────────────────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: ProductRef;
  variant: VariantRef | null;
}

// ── Cart ──────────────────────────────────────────────────────────────────────

export interface Cart {
  id: string | null;
  storeId: string | null;
  items: CartItem[];
  totalAmount: number;
  currencyCode: string;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface AddCartItemRequest {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}

export interface MergeCartRequest {
  sessionKey: string;
}

// ── Checkout ──────────────────────────────────────────────────────────────────

export interface DeliveryAddress {
  street: string;
  city: string;
  region?: string;
  postalCode?: string;
  country?: string;
}

export interface CheckoutPreviewItem {
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface CheckoutPreview {
  storeId: string;
  storeName: string;
  items: CheckoutPreviewItem[];
  subtotal: number;
  currencyCode: string;
  stockWarnings: string[];
}

/**
 * Способ оплаты заказа (request-side enum для checkout).
 * API-CHECKOUT-PAYMENT-METHOD-001 (от Азима, web-sync audit 14.05.2026).
 *  - `cash`   — наличными при получении (COD), доступно всегда
 *  - `card`   — картой при получении / курьеру
 *  - `online` — онлайн через Click/Payme (требует PAYMENT_ONLINE_ENABLED;
 *               пока не реализовано — фронт показывает «Скоро»)
 *
 * Назван `CheckoutPaymentMethod`, чтобы не коллидировать с Prisma-enum
 * `PaymentMethod` (COD/MANUAL_TRANSFER/ONLINE) из `enums.ts` — оба
 * ре-экспортятся через `index.ts` (TS2308). См. API-TYPES-PAYMENT-METHOD-COLLISION-001.
 */
export type CheckoutPaymentMethod = 'cash' | 'card' | 'online';

export interface CheckoutConfirmRequest {
  deliveryAddress: DeliveryAddress;
  buyerNote?: string;
  deliveryFee?: number;
  /** Override Buyer profile fullName for this order. Backend trims & falls back to profile when empty. */
  customerFullName?: string;
  /** Override account phone for this order. Backend falls back to user.phone when empty. */
  customerPhone?: string;
  /**
   * Способ оплаты. Default `cash` если не передан (backward-compat со старыми
   * клиентами). `online` принимается только при PAYMENT_ONLINE_ENABLED.
   */
  paymentMethod?: CheckoutPaymentMethod;
}
