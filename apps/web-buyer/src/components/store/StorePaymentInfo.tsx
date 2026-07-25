// apps/web-buyer/src/components/store/StorePaymentInfo.tsx
// SELLER-PAYMENT-REQUISITES-001: информационный блок реквизитов продавца.
// Осознанно НЕ привязан к CheckoutPaymentMethod (там `card` значит "картой
// курьеру", не "перевод заранее") — оплата остаётся cash/договорная, это
// просто подсказка покупателю, куда переводить, если продавец включил приём
// перевода на карту.
'use client';

import { useState } from 'react';
import { CreditCard, Check, Copy, ExternalLink } from 'lucide-react';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';
import type { StorePaymentRequisites } from '@/lib/api/storefront-server';

interface Props {
  requisites: StorePaymentRequisites | undefined;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <div className="min-w-0">
        <p className="text-[10px] tracking-[0.14em] uppercase" style={{ color: colors.textMuted }}>{label}</p>
        <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{value}</p>
      </div>
      <button
        type="button"
        onClick={copy}
        aria-label={label}
        className="shrink-0 p-2 rounded-md transition-opacity hover:opacity-80"
        style={{ background: colors.surfaceMuted, color: copied ? colors.success : colors.textMuted }}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
    </div>
  );
}

export function StorePaymentInfo({ requisites }: Props) {
  const { t } = useTranslation();

  if (!requisites?.acceptsCardTransfer || !requisites.cardNumber) return null;

  return (
    <section
      className="rounded-lg overflow-hidden mt-6"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}
      >
        <CreditCard size={15} style={{ color: colors.brand }} />
        <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
          {t('store.payment.title')}
        </p>
      </div>
      <div className="px-4 py-1">
        <p className="text-xs pt-2.5 pb-1" style={{ color: colors.textMuted }}>
          {t('store.payment.hint')}
        </p>
        <div className="divide-y" style={{ borderColor: colors.divider }}>
          <CopyField label={t('store.payment.cardNumber')} value={requisites.cardNumber} />
          {requisites.cardHolder && (
            <CopyField label={t('store.payment.cardHolder')} value={requisites.cardHolder} />
          )}
        </div>
        {(requisites.clickLink || requisites.paymeLink) && (
          <div className="flex gap-2 py-3">
            {requisites.clickLink && (
              <a
                href={requisites.clickLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                Click <ExternalLink size={12} />
              </a>
            )}
            {requisites.paymeLink && (
              <a
                href={requisites.paymeLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-semibold transition-opacity hover:opacity-90"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                Payme <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
