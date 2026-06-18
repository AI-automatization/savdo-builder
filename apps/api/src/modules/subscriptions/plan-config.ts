/**
 * Plan config — single source of truth для тарифов подписки.
 * BILLING-MACHINE-001 / business-model-v2 §5.
 *
 * Tier меняется редко через PR review (не админ-UI). Если когда-то понадобится
 * динамика — мигрировать в DB-таблицу `plans` (straightforward).
 */

import { SubscriptionTier } from '@prisma/client';

export interface PlanFeatures {
  /** UZS/мес (целые сумы). */
  priceUzs: number;
  /** UZS/год (целые сумы), скидка ~20% (см. business-model-v2 §5). */
  annualUzs: number;
  /** Максимум активных продуктов; null = безлимит. */
  productsLimit: number | null;
  /** Максимум заказов в месяц; null = безлимит. soft-limit (только баннер). */
  ordersLimitPerMonth: number | null;
  /** Feature-флаги — хард-гейты на использование фичей. */
  features: readonly string[];
}

export const PLAN_CONFIG: Record<SubscriptionTier, PlanFeatures> = {
  STARTER: {
    priceUzs: 99_000,
    annualUzs: 950_000,
    productsLimit: 50,
    ordersLimitPerMonth: 100,
    features: ['core'],
  },
  PRO: {
    priceUzs: 299_000,
    annualUzs: 2_870_000,
    productsLimit: null,
    ordersLimitPerMonth: 1_000,
    features: ['core', 'abandoned_carts', 'priority_support', 'branding'],
  },
  BUSINESS: {
    priceUzs: 899_000,
    annualUzs: 8_630_000,
    productsLimit: null,
    ordersLimitPerMonth: null,
    features: ['core', 'abandoned_carts', 'priority_support', 'branding', 'api', 'white_label'],
  },
};

/** Длина триала в днях (BILLING-MACHINE §3). */
export const TRIAL_DAYS = 14;
/** Длина grace-периода (PAST_DUE → SUSPENDED) в днях. */
export const GRACE_DAYS = 7;
/** Сколько дней SUSPENDED держим до CHURNED (политика хранения данных). */
export const CHURN_DAYS = 90;
/** Тариф при старте триала. */
export const DEFAULT_TRIAL_TIER: SubscriptionTier = 'PRO';
