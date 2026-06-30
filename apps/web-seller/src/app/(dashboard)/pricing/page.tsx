'use client';

import { useState } from 'react';
import { useTranslation } from '@/lib/i18n';
import { colors, warningTint, dangerTint } from '@/lib/styles';
import { useSubscription } from '@/hooks/use-subscription';
import { useStore } from '@/hooks/use-seller';
import type { SubscriptionTier } from 'types';

const TIER_ORDER: SubscriptionTier[] = ['STARTER', 'PRO', 'BUSINESS'];

const TIER_CONFIG: Record<SubscriptionTier, {
  nameKey: string;
  descKey: string;
  featKey: string;
  price: string;
  highlight: boolean;
}> = {
  STARTER: { nameKey: 'pricing.tier.free',   descKey: 'pricing.tier.free.desc',   featKey: 'pricing.tier.free.feat',   price: '',        highlight: false },
  PRO:     { nameKey: 'pricing.tier.pro',    descKey: 'pricing.tier.pro.desc',    featKey: 'pricing.tier.pro.feat',    price: '149 000', highlight: true  },
  BUSINESS:{ nameKey: 'pricing.tier.studio', descKey: 'pricing.tier.studio.desc', featKey: 'pricing.tier.studio.feat', price: '399 000', highlight: false },
};

interface UpgradeTarget {
  tier: SubscriptionTier;
  name: string;
  price: string;
  feat: string;
}

export default function PricingPage() {
  const { t } = useTranslation();
  const { data: subscription, isLoading } = useSubscription();
  const { data: store } = useStore();
  const [upgradeTarget, setUpgradeTarget] = useState<UpgradeTarget | null>(null);

  const currentTier = subscription?.tier ?? 'STARTER';
  const status       = subscription?.status;
  const daysLeft     = subscription?.daysLeft;
  const currentIdx   = TIER_ORDER.indexOf(currentTier);

  function handleUpgrade(tier: SubscriptionTier) {
    const cfg = TIER_CONFIG[tier];
    setUpgradeTarget({ tier, name: t(cfg.nameKey), price: cfg.price, feat: t(cfg.featKey) });
  }

  function managerDeeplink(tierName: string) {
    const text = `Хочу перейти на ${tierName}. Мой магазин: ${store?.slug ?? '—'}`;
    return `tg://resolve?domain=ismailov_0011&text=${encodeURIComponent(text)}`;
  }

  const statusLabel =
    status === 'TRIAL'     ? t('billing.trial') :
    status === 'ACTIVE'    ? t('billing.active') :
    status === 'PAST_DUE'  ? t('billing.pastDue') :
    status === 'SUSPENDED' ? t('billing.suspended') :
    status === 'CHURNED'   ? t('billing.churned') :
    status === 'CANCELLED' ? t('billing.cancelled') : (status ?? '');

  const statusStyle: React.CSSProperties =
    status === 'PAST_DUE'  ? { background: warningTint(0.15), color: colors.warning,  border: `1px solid ${warningTint(0.30)}` } :
    status === 'SUSPENDED' ? { background: dangerTint(0.12),  color: colors.danger,   border: `1px solid ${dangerTint(0.25)}`  } :
                             { background: colors.surface,    color: colors.textDim,  border: `1px solid ${colors.border}`     };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textPrimary }}>
          {t('nav.pricing')}
        </h1>
        <p className="mt-1 text-sm" style={{ color: colors.textMuted }}>
          {t('pricing.subtitle')}
        </p>
      </div>

      {/* Trial ending soon — banner */}
      {status === 'TRIAL' && daysLeft != null && daysLeft <= 7 && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
          style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}>
          <p className="text-sm font-medium" style={{ color: colors.accent }}>
            {t('billing.trialBanner', { n: daysLeft })}
          </p>
        </div>
      )}

      {/* Past due — banner with CTA */}
      {status === 'PAST_DUE' && (
        <div className="rounded-xl px-4 py-3 mb-4 flex items-center justify-between gap-3"
          style={{ background: warningTint(0.12), border: `1px solid ${warningTint(0.30)}` }}>
          <p className="text-sm font-medium" style={{ color: colors.warning }}>
            {t('billing.pastDueBanner')}
          </p>
          <a href={managerDeeplink('Pro')} target="_blank" rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}>
            {t('billing.writeManager')}
          </a>
        </div>
      )}

      {/* Current plan card */}
      <div
        className="rounded-xl px-5 py-4 mb-8 flex items-center justify-between"
        style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: colors.textDim }}>
            {t('billing.yourPlan')}
          </p>
          {isLoading ? (
            <div className="h-5 w-32 rounded animate-pulse" style={{ background: colors.surfaceMuted }} />
          ) : (
            <p className="text-base font-bold" style={{ color: colors.accent }}>
              {t(TIER_CONFIG[currentTier].nameKey)}
              {status === 'TRIAL' && daysLeft != null && (
                <span className="ml-2 text-xs font-normal" style={{ color: colors.textMuted }}>
                  {t('billing.daysLeft', { n: daysLeft })}
                </span>
              )}
            </p>
          )}
        </div>
        {status && (
          <span className="text-[11px] font-bold px-2.5 py-1 rounded-full" style={statusStyle}>
            {statusLabel}
          </span>
        )}
      </div>

      {/* Tier grid */}
      <p className="text-sm font-medium mb-4" style={{ color: colors.textMuted }}>
        {t('pricing.ladder.title')}
      </p>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        {TIER_ORDER.map((tier) => {
          const cfg         = TIER_CONFIG[tier];
          const isCurrent   = tier === currentTier;
          const isUpgrade   = TIER_ORDER.indexOf(tier) > currentIdx;
          const isFree      = tier === 'STARTER';

          return (
            <div
              key={tier}
              className="rounded-xl p-5 flex flex-col relative"
              style={{
                background: colors.surface,
                border: `1px solid ${cfg.highlight ? colors.accentBorder : colors.border}`,
                boxShadow: cfg.highlight ? `0 16px 40px ${colors.accentMuted}` : 'none',
              }}
            >
              {isCurrent && (
                <span
                  className="absolute top-3 right-3 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: colors.surfaceElevated, color: colors.textDim }}
                >
                  {t('billing.currentPlan')}
                </span>
              )}
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold" style={{ color: colors.textPrimary }}>{t(cfg.nameKey)}</h3>
                {cfg.highlight && (
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                    style={{ background: colors.accent, color: colors.accentTextOnBg }}
                  >
                    ★
                  </span>
                )}
              </div>
              <p className="text-xs mb-3" style={{ color: colors.textMuted }}>{t(cfg.descKey)}</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span
                  className="text-xl font-bold"
                  style={{ color: isFree ? colors.accent : colors.textPrimary }}
                >
                  {isFree ? t('pricing.free') : cfg.price}
                </span>
                {!isFree && (
                  <span className="text-xs" style={{ color: colors.textMuted }}>{t('pricing.perMonth')}</span>
                )}
              </div>
              <p className="text-xs leading-relaxed mt-auto" style={{ color: colors.textMuted }}>{t(cfg.featKey)}</p>
              {isUpgrade && (
                <button
                  onClick={() => handleUpgrade(tier)}
                  className="mt-4 w-full py-2 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 active:scale-[0.98]"
                  style={{ background: colors.accent, color: colors.accentTextOnBg }}
                >
                  {t('billing.upgradeTitle', { tier: t(cfg.nameKey) })}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Payment note */}
      <div
        className="rounded-lg px-4 py-3 text-center"
        style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
      >
        <p className="text-xs" style={{ color: colors.textDim }}>
          Оплата через Click и Payme — скоро
        </p>
      </div>
      <p className="text-center text-xs mt-4" style={{ color: colors.textDim }}>
        {t('pricing.foundingNote')}
      </p>

      {/* Upgrade modal */}
      {upgradeTarget && (
        <div
          className="fixed inset-0 flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', zIndex: 200 }}
          onClick={() => setUpgradeTarget(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl p-6"
            style={{ background: colors.surfaceElevated, border: `1px solid ${colors.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>
                {t('billing.upgradeTitle', { tier: upgradeTarget.name })}
              </h3>
              <button
                onClick={() => setUpgradeTarget(null)}
                className="w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: colors.surfaceMuted, color: colors.textMuted }}
                aria-label={t('billing.upgradeClose')}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex items-baseline gap-1 mb-4">
              <span className="text-2xl font-bold" style={{ color: colors.textPrimary }}>{upgradeTarget.price}</span>
              <span className="text-sm" style={{ color: colors.textMuted }}>{t('pricing.perMonth')}</span>
            </div>

            <p className="text-sm leading-relaxed mb-5" style={{ color: colors.textMuted }}>
              {upgradeTarget.feat}
            </p>

            <a
              href={managerDeeplink(upgradeTarget.name)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center w-full py-3 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ background: colors.accent, color: colors.accentTextOnBg }}
            >
              {t('billing.upgradeCta')}
            </a>
            <button
              onClick={() => setUpgradeTarget(null)}
              className="mt-3 w-full py-2 text-sm"
              style={{ color: colors.textMuted }}
            >
              {t('billing.upgradeClose')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
