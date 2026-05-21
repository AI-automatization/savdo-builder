/**
 * API-CHECKOUT-PREVIEW-DELIVERY-FEE-001 — единый расчёт платы за доставку.
 *
 * Раньше preview хардкодил `deliveryFee = 0`, а confirm считал реальную плату
 * из `store.deliverySettings` — покупатель видел «Бесплатно» в preview, но
 * платил fixed-плату при confirm (WB-B01, money-bug). Теперь оба используют
 * этот helper — preview и confirm всегда согласованы.
 *
 * API-DELIVERY-FEE-CLIENT-CONTROLLED-001: сумма считается ТОЛЬКО на бэкенде,
 * клиент её не контролирует.
 *
 *  - `fixed`  → `fixedDeliveryFee` (или 0 если не задан)
 *  - `manual` → 0 (продавец выставит плату вручную при подтверждении заказа)
 *  - `none`   → 0
 */
export interface DeliverySettingsLike {
  deliveryFeeType: string; // 'fixed' | 'manual' | 'none'
  fixedDeliveryFee: unknown; // Prisma Decimal | number | null
}

export function computeDeliveryFee(
  settings: DeliverySettingsLike | null | undefined,
): number {
  if (!settings) return 0;
  if (settings.deliveryFeeType !== 'fixed') return 0;
  if (settings.fixedDeliveryFee == null) return 0;
  const fee = Number(String(settings.fixedDeliveryFee));
  return Number.isFinite(fee) && fee > 0 ? fee : 0;
}
