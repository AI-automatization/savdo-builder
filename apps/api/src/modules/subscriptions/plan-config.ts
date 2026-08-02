/**
 * Plan config — single source of truth для тарифов подписки.
 * BILLING-MACHINE-001 / business-model-v2 §5.
 * BIZ-DECISIONS-§15 (2026-06-14): FREE/PRO/STUDIO — решение Азима.
 *
 * Tier меняется редко через PR review (не админ-UI). Если когда-то понадобится
 * динамика — мигрировать в DB-таблицу `plans` (straightforward).
 */

import { SubscriptionTier } from '@prisma/client';

export interface PlanFeatures {
  /** UZS/мес (целые сумы). 0 = бесплатно навсегда. */
  priceUzs: number;
  /** UZS/год (целые сумы), скидка ~20% (см. business-model-v2 §5). */
  annualUzs: number;
  /** Максимум активных продуктов; null = безлимит. */
  productsLimit: number | null;
  /** Максимум заказов в месяц; null = безлимит.
   *  FREE: 50 (HARD block — store скрывается при превышении).
   *  PRO/STUDIO: null (без лимита).
   */
  ordersLimitPerMonth: number | null;
  /** Feature-флаги — хард-гейты на использование фичей. */
  features: readonly string[];
}

export const PLAN_CONFIG: Record<SubscriptionTier, PlanFeatures> = {
  // FREE: бесплатно навсегда, ≤50 товаров, ≤50 заказов/мес
  FREE: {
    priceUzs: 0,
    annualUzs: 0,
    productsLimit: 50,
    ordersLimitPerMonth: 50,
    features: ['core'],
  },
  // PRO: 149 000 UZS/мес (было 299k — решение BIZ-DECISIONS-§15)
  PRO: {
    priceUzs: 149_000,
    annualUzs: 1_430_000, // 149k * 12 * 0.8
    productsLimit: null,
    ordersLimitPerMonth: null,
    features: ['core', 'abandoned_carts', 'priority_support', 'branding'],
  },
  // STUDIO: 399 000 UZS/мес, до 3 магазинов (было BUSINESS 899k)
  STUDIO: {
    priceUzs: 399_000,
    annualUzs: 3_830_000, // 399k * 12 * 0.8
    productsLimit: null,
    ordersLimitPerMonth: null,
    features: ['core', 'abandoned_carts', 'priority_support', 'branding', 'api', 'white_label', 'multi_store'],
  },
};

/** Длина триала в днях. BIZ-DECISIONS-§15: 30 дней (было 14). */
export const TRIAL_DAYS = 30;
/** Длина grace-периода (PAST_DUE → SUSPENDED) в днях. */
export const GRACE_DAYS = 7;
/** Сколько дней SUSPENDED держим до CHURNED (политика хранения данных). */
export const CHURN_DAYS = 90;
/** Тариф при старте триала. */
export const DEFAULT_TRIAL_TIER: SubscriptionTier = 'PRO';
