/**
 * Shared enums — mirror of Prisma enums (state machine docs: docs/V1.1/02_state_machines.md).
 *
 * **Pattern: const-object + derived type union.**
 *
 * Каждый enum экспортирован двумя путями:
 *   - `export const X = { KEY: 'KEY', ... } as const;` — runtime-объект, можно использовать
 *     `X.KEY` как значение, `Record<X, ...>` как тип.
 *   - `export type X = typeof X[keyof typeof X];` — string union, совместим со string-literal-ами
 *     из БД / JSON, никаких manual conversions.
 *
 * Этот паттерн фиксит TYPES-ENUM-RUNTIME-001 (04.06.2026):
 *  • DUP-008 (01.06.2026) перевёл всё в чистые `export type X = 'A' | 'B'` (без runtime) —
 *    это поломало web-seller, который импортирует `OrderStatus`/`UserRole` как значения
 *    (`OrderStatus.PENDING`, `Record<OrderStatus, …>`) → 30+ TS2693 в production build.
 *  • Возврат к `export enum` ломал admin, где используются string literals
 *    (`'ACTIVE'` → enum value).
 *  • Const-object pattern фиксит всех консьюмеров (api, admin, web-buyer, web-seller, tma)
 *    разом: ну и string literal `'ACTIVE'` присваивается в `UserStatus`, и
 *    `UserStatus.ACTIVE` доступно как runtime value, и compiled bundle минимальный
 *    (просто литерал-объект, не TS-enum-machinery).
 *
 * Соответствует Prisma-enum по форме (значения = ключи). При обновлении Prisma-схемы
 * соответствующие ключи здесь — поддерживать в sync.
 */

export const UserRole = {
  BUYER: 'BUYER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = typeof UserRole[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  BLOCKED: 'BLOCKED',
} as const;
export type UserStatus = typeof UserStatus[keyof typeof UserStatus];

export const StoreStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED',
} as const;
export type StoreStatus = typeof StoreStatus[keyof typeof StoreStatus];

export const SellerVerificationStatus = {
  UNVERIFIED: 'UNVERIFIED',
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;
export type SellerVerificationStatus =
  typeof SellerVerificationStatus[keyof typeof SellerVerificationStatus];

export const OrderStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PROCESSING: 'PROCESSING',
  SHIPPED: 'SHIPPED',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type OrderStatus = typeof OrderStatus[keyof typeof OrderStatus];

export const ProductStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
  HIDDEN_BY_ADMIN: 'HIDDEN_BY_ADMIN',
} as const;
export type ProductStatus = typeof ProductStatus[keyof typeof ProductStatus];

export const PaymentMethod = {
  COD: 'COD',
  MANUAL_TRANSFER: 'MANUAL_TRANSFER',
  ONLINE: 'ONLINE',
} as const;
export type PaymentMethod = typeof PaymentMethod[keyof typeof PaymentMethod];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = typeof PaymentStatus[keyof typeof PaymentStatus];

export const DeliveryType = {
  DELIVERY: 'DELIVERY',
  PICKUP: 'PICKUP',
} as const;
export type DeliveryType = typeof DeliveryType[keyof typeof DeliveryType];

export const ThreadType = {
  PRODUCT: 'PRODUCT',
  ORDER: 'ORDER',
} as const;
export type ThreadType = typeof ThreadType[keyof typeof ThreadType];

export const MediaVisibility = {
  PUBLIC: 'PUBLIC',
  PROTECTED: 'PROTECTED',
  PRIVATE: 'PRIVATE',
} as const;
export type MediaVisibility = typeof MediaVisibility[keyof typeof MediaVisibility];

export const InventoryMovementType = {
  ORDER_DEDUCTED: 'ORDER_DEDUCTED',
  ORDER_RELEASED: 'ORDER_RELEASED',
  MANUAL_ADJUSTMENT: 'MANUAL_ADJUSTMENT',
} as const;
export type InventoryMovementType =
  typeof InventoryMovementType[keyof typeof InventoryMovementType];

// BILLING-MACHINE-001 — Phase 1 (STARTER/PRO/BUSINESS, 99k/299k/899k UZS).
// ⚠️ BILLING-TIER-ENUM-SYNC-001 (heads-up от Азима 04.06.2026): pricing v2 меняет
// tier-enum на FREE/PRO/STUDIO (149k/399k). Сделать миграцию здесь и в Prisma
// в момент работы над BILLING-MACHINE-001, не отдельно.
export const SubscriptionTier = {
  STARTER: 'STARTER',
  PRO: 'PRO',
  BUSINESS: 'BUSINESS',
} as const;
export type SubscriptionTier = typeof SubscriptionTier[keyof typeof SubscriptionTier];

export const SubscriptionStatus = {
  TRIAL: 'TRIAL',
  ACTIVE: 'ACTIVE',
  PAST_DUE: 'PAST_DUE',
  SUSPENDED: 'SUSPENDED',
  CHURNED: 'CHURNED',
  CANCELLED: 'CANCELLED',
} as const;
export type SubscriptionStatus =
  typeof SubscriptionStatus[keyof typeof SubscriptionStatus];

export const SubscriptionPaymentMethod = {
  MANUAL_TRANSFER: 'MANUAL_TRANSFER',
  CLICK: 'CLICK',
  PAYME: 'PAYME',
  COMP: 'COMP',
} as const;
export type SubscriptionPaymentMethod =
  typeof SubscriptionPaymentMethod[keyof typeof SubscriptionPaymentMethod];

export const SubscriptionPaymentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  REFUNDED: 'REFUNDED',
  FAILED: 'FAILED',
} as const;
export type SubscriptionPaymentStatus =
  typeof SubscriptionPaymentStatus[keyof typeof SubscriptionPaymentStatus];
