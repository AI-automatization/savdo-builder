import { OrderStatus, PaymentMethod, PaymentStatus, DeliveryType } from '../enums';
import { DeliveryAddress } from './cart';
import { StoreRef } from './stores';
import { PaginationMeta } from '../common';

// ── Order Item ────────────────────────────────────────────────────────────────

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

// ── Order ─────────────────────────────────────────────────────────────────────

/** Order in list response */
export interface OrderListItem {
  id: string;
  storeId: string;
  status: OrderStatus;
  totalAmount: number;
  currencyCode: string;
  deliveryAddress: DeliveryAddress;
  deliveryFee: number;
  createdAt: string;
}

/** Full order detail */
export interface Order extends OrderListItem {
  buyerId: string;
  buyer: { phone: string } | null;
  buyerNote: string | null;
  store: Pick<StoreRef, 'name' | 'telegramContactLink'>;
  items: OrderItem[];
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
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
