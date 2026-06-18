/**
 * Runtime-значения enum'ов для dashboard-страниц web-seller.
 *
 * `packages/types` (зона Полата) объявляет UserRole/OrderStatus/StoreStatus/
 * ProductStatus как `export type` (string-union) — рантайм-значения он НЕ отдаёт.
 * А dashboard-код использует их как значения: `OrderStatus.PENDING`,
 * `[OrderStatus.PENDING]: ...`, `OrderStatus[]`, `Record<OrderStatus, ...>`.
 * Без значений — `TS2693: only refers to a type, but is being used as a value`,
 * билд web-seller красный → деплой ветки падает.
 *
 * Этот шим даёт значения локально (моя зона, packages/types не трогаю), а ТИП
 * реэкспортит из 'types' (единый источник правды). `satisfies` гарантирует, что
 * литералы не разойдутся с union из types. Forward-совместимо: если Полат когда-то
 * вернёт реальные enum'ы — строковые литералы здесь продолжат присваиваться.
 *
 * См. WEB-SELLER-ENUM-AS-VALUE-BUILD-001 (analiz/logs.md).
 */
import type {
  UserRole as UserRoleT,
  OrderStatus as OrderStatusT,
  StoreStatus as StoreStatusT,
  ProductStatus as ProductStatusT,
} from 'types';

export const UserRole = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
} as const satisfies Record<string, UserRoleT>;
export type UserRole = UserRoleT;

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const satisfies Record<string, OrderStatusT>;
export type OrderStatus = OrderStatusT;

export const StoreStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const satisfies Record<string, StoreStatusT>;
export type StoreStatus = StoreStatusT;

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  HIDDEN_BY_ADMIN: 'HIDDEN_BY_ADMIN',
} as const satisfies Record<string, ProductStatusT>;
export type ProductStatus = ProductStatusT;
