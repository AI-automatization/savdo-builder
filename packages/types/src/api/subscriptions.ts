// BILLING-MACHINE-001 — API contract для subscription module.
// Источник правды — `apps/api/src/modules/subscriptions/`.

import { SubscriptionTier, SubscriptionStatus, SubscriptionPaymentMethod, SubscriptionPaymentStatus } from '../enums';

export interface PlanConfigPublic {
  priceUzs: number;
  annualUzs: number;
  productsLimit: number | null;
  ordersLimitPerMonth: number | null;
  features: string[];
}

/**
 * Что seller получает через GET /seller/subscription.
 * Эти поля + плановые лимиты — всё что нужно фронту для:
 *   - баннеров (TRIAL ends in N days, PAST_DUE pay now)
 *   - dashboard read-only mode (status === SUSPENDED)
 *   - upsell на следующий тариф (plan.productsLimit hit)
 */
export interface SubscriptionDto {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  trialEndsAt: string | null;        // ISO
  currentPeriodStart: string | null; // ISO
  currentPeriodEnd: string | null;   // ISO
  graceEndsAt: string | null;        // ISO
  cancelAtPeriodEnd: boolean;
  daysLeft: number | null;
  plan: PlanConfigPublic;
}

export interface SubscriptionPaymentDto {
  id: string;
  subscriptionId: string;
  amountUzs: number;
  method: SubscriptionPaymentMethod;
  status: SubscriptionPaymentStatus;
  periodStart: string; // ISO
  periodEnd: string;   // ISO
  confirmedAt: string | null;
  notes: string | null;
  createdAt: string;
}

// Admin DTOs

export interface AdminSubscriptionListItem extends SubscriptionDto {
  seller: { id: string; fullName: string; telegramUsername: string };
  cancelledAt: string | null;
  suspendedAt: string | null;
  updatedAt: string;
}

export interface AdminSubscriptionListResponse {
  items: AdminSubscriptionListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MarkPaidRequest {
  tier: SubscriptionTier;
  amountUzs: number;
  periodStart: string; // ISO
  periodEnd: string;   // ISO
  method?: SubscriptionPaymentMethod;
  notes?: string;
}

export interface ExtendTrialRequest {
  days: number;
  reason?: string;
}

export interface CancelSubscriptionRequest {
  reason?: string;
}
