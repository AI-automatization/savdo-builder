// ── Cart Item ─────────────────────────────────────────────────────────────────

/**
 * Compact product info embedded in a cart item.
 * API-RESPONSE-TYPES-RECONCILE-001 (от Азима, 18.05.2026): расширено снимками
 * текущей цены/стока/видимости продукта, чтобы web-buyer не кастовал `CartItem`
 * через `as` к несуществующим полям. `id` присутствовал в ответе всегда — тип
 * `ProductRef` из `products.ts` его не содержал, поэтому здесь объявлен
 * отдельный, полный shape.
 */
export interface CartItemProduct {
  id: string;
  title: string;
  mediaUrl: string | null;
  /** Текущая базовая цена продукта (Product.basePrice). */
  basePrice: number;
  /** Текущая sale-цена продукта, null если не на скидке. */
  salePrice: number | null;
  /** Текущий складской агрегат продукта (Product.totalStock). */
  stock: number;
  /** status === ACTIVE && isVisible. */
  isAvailable: boolean;
  /** Product.isVisible. */
  isVisible: boolean;
}

/** Compact variant info embedded in a cart item. */
export interface CartItemVariant {
  id: string;
  sku: string | null;
  title: string | null;
  /** ProductVariant.priceOverride, null если вариант не переопределяет цену. */
  priceOverride: number | null;
  /** ProductVariant.salePriceOverride, null если вариант не переопределяет sale-цену. */
  salePriceOverride: number | null;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  /** Снапшот базовой цены на момент добавления (CartItem.unitPriceSnapshot). */
  unitPriceSnapshot: number | null;
  /** Снапшот sale-цены на момент добавления (CartItem.salePriceSnapshot). */
  salePriceSnapshot: number | null;
  subtotal: number;
  product: CartItemProduct;
  variant: CartItemVariant | null;
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
  /**
   * API-CHECKOUT-PREVIEW-DELIVERY-FEE-001: рассчитанная backend'ом плата за
   * доставку (из store.deliverySettings). Тот же расчёт применяется в confirm —
   * preview и итоговый заказ согласованы. 0 для `manual`/`none` тарифа.
   */
  deliveryFee: number;
  /** subtotal + deliveryFee. То, что покупатель реально заплатит. */
  total: number;
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

/**
 * Режим получения заказа.
 * API-CHECKOUT-PICKUP-DELIVERY-FEE-001 (от Азима, 16.05.2026).
 *  - `delivery` — курьерская доставка, deliveryFee из store.deliverySettings
 *  - `pickup`   — самовывоз, backend принудительно обнуляет deliveryFee
 */
export type CheckoutDeliveryMode = 'delivery' | 'pickup';

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
  /**
   * Режим получения. Default `delivery` если не передан (backward-compat).
   * `pickup` → backend обнуляет deliveryFee независимо от store.deliverySettings.
   */
  deliveryMode?: CheckoutDeliveryMode;
}
