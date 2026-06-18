/**
 * Shared enums — mirror of Prisma enums (state machine docs: docs/V1.1/02_state_machines.md).
 *
 * String unions (а не TypeScript enum) выбраны намеренно:
 *  - shared между api (NestJS) и admin (Vite+React);
 *  - совместимы с string literals из БД и из JSON-ответа API без runtime-конвертации;
 *  - не загромождают bundle (TS enum компилируется в runtime-объект, string union — нет);
 *  - совпадают по форме с `enum X { ... }` Prisma-схемы, поэтому миграция бэкенда тривиальна.
 *
 * Прежняя `export enum X { ... }` форма ломала consumers где использовались string literals
 * ('ACTIVE' и т.п.) — TS строго не присваивает string-literal к TS enum value. См. DRY-аудит
 * DUP-008 (01.06.2026).
 */

export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

export type UserStatus = 'ACTIVE' | 'BLOCKED';

export type StoreStatus =
  | 'DRAFT'
  | 'PENDING_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'SUSPENDED'
  | 'ARCHIVED';

export type SellerVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING'
  | 'VERIFIED'
  | 'REJECTED'
  | 'SUSPENDED';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';

export type PaymentMethod = 'COD' | 'MANUAL_TRANSFER' | 'ONLINE';

export type PaymentStatus = 'UNPAID' | 'PAID' | 'REFUNDED';

export type DeliveryType = 'DELIVERY' | 'PICKUP';

export type ThreadType = 'PRODUCT' | 'ORDER';

export type MediaVisibility = 'PUBLIC' | 'PROTECTED' | 'PRIVATE';

export type InventoryMovementType =
  | 'ORDER_DEDUCTED'
  | 'ORDER_RELEASED'
  | 'MANUAL_ADJUSTMENT';

// BILLING-MACHINE-001
export type SubscriptionTier = 'STARTER' | 'PRO' | 'BUSINESS';

export type SubscriptionStatus =
  | 'TRIAL'
  | 'ACTIVE'
  | 'PAST_DUE'
  | 'SUSPENDED'
  | 'CHURNED'
  | 'CANCELLED';

export type SubscriptionPaymentMethod =
  | 'MANUAL_TRANSFER'
  | 'CLICK'
  | 'PAYME'
  | 'COMP';

export type SubscriptionPaymentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REFUNDED'
  | 'FAILED';
