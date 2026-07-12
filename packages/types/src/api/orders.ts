import { OrderStatus, PaymentMethod, PaymentStatus, DeliveryType } from '../enums';
import { StoreRef } from './stores';
import { PaginationMeta } from '../common';

// ── Order Item ────────────────────────────────────────────────────────────────

/**
 * SEO-AUDIT-001 п.15: контракт сверен с `orders.mapper.ts:34-43` — API
 * гарантирует ровно эти поля (снапшоты цен из OrderItem.unitPriceSnapshot /
 * lineTotalAmount, уже числа). Фронту не нужен `normalizeOrder(raw: any)` —
 * форма стабильна.
 */
export interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  title: string;
  variantTitle: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Response-side адрес доставки заказа: любые поля могут быть null
 * (`orders.mapper.ts:4-10` — street = addressLine1 ?? null; заказы до
 * миграции адресов вообще без deliveryAddress). НЕ путать с request-side
 * `DeliveryAddress` из cart.ts, где street/city обязательны.
 */
export interface OrderDeliveryAddress {
  street: string | null;
  city: string | null;
  region: string | null;
}

// ── Order ─────────────────────────────────────────────────────────────────────

/** Order in list response */
export interface OrderListItem {
  id: string;
  orderNumber: string;
  storeId: string;
  status: OrderStatus;
  totalAmount: number;
  currencyCode: string;
  /** May be undefined for orders created before address migration */
  deliveryAddress?: OrderDeliveryAddress;
  deliveryFee: number;
  /**
   * API-RESPONSE-TYPES-RECONCILE-001: seller orders-list (`GET /seller/orders`)
   * отдаёт также плоские поля адреса и суммы — рядом с nested `deliveryAddress`.
   * Buyer-list их не присылает (отсюда `?`). Раньше фронт читал их через `as any`.
   */
  subtotalAmount?: number;
  discountAmount?: number;
  city?: string | null;
  region?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  createdAt: string;
  /**
   * API-RESPONSE-TYPES-RECONCILE-001: число позиций (order items) в заказе.
   * Buyer orders-list (`GET /buyer/orders`) отдаёт его всегда (из `_count.items`).
   * Опционально — seller-list пока не присылает.
   */
  itemCount?: number;
  /** Buyer's registered account phone (from User record) */
  buyer?: { phone: string } | null;
  /** Phone entered at checkout — shown as backup/reserve number to seller */
  customerPhone?: string;
  customerFullName?: string;
  /** First item preview for order list UI */
  preview?: {
    title: string;
    imageUrl: string | null;
    itemCount: number;
  } | null;
}

/** Full order detail */
export interface Order extends OrderListItem {
  buyerId: string;
  buyer: { phone: string } | null;
  /** Phone entered at checkout — backup/reserve number */
  customerPhone: string;
  buyerNote: string | null;
  /** null, если магазин не подгружен/удалён (`orders.mapper.ts:31-33`). */
  store: Pick<StoreRef, 'name' | 'telegramContactLink'> | null;
  items: OrderItem[];
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus | null;
  deliveryType: DeliveryType;
  updatedAt: string;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
  reason?: string;
}

export interface PaginatedOrders {
  data: OrderListItem[];
  meta: PaginationMeta;
}
