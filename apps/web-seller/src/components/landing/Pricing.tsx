'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';
import { landingTrack } from '@/lib/landing/analytics';

export function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const ref = useReveal<HTMLDivElement>();
  const free = t('pricing.free');
  const tiers = [
    { name: t('pricing.tier.free'), desc: t('pricing.tier.free.desc'), feat: t('pricing.tier.free.feat'), price: free, highlight: false },
    { name: t('pricing.tier.pro'), desc: t('pricing.tier.pro.desc'), feat: t('pricing.tier.pro.feat'), price: '149 000', highlight: true },
    { name: t('pricing.tier.studio'), desc: t('pricing.tier.studio.desc'), feat: t('pricing.tier.studio.feat'), price: '399 000', highlight: false },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      {/* Главный founding-блок */}
      <div className="rounded-2xl p-8 sm:p-12 text-center" style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }}>
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('pricing.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('pricing.subtitle')}</p>
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          onClick={() => landingTrack('landing_cta_clicked', { place: 'pricing' })}
          className="inline-flex mt-6 px-7 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          {t('pricing.cta')}
        </Link>
      </div>

      {/* Лестница тарифов */}
      <p className="text-center text-sm font-medium mt-12 mb-6" style={{ color: colors.textMuted }}>{t('pricing.ladder.title')}</p>
      <div ref={ref} className="reveal grid gap-4 sm:grid-cols-3">
        {tiers.map((tier, i) => (
          <div
            key={i}
            className="rounded-xl p-6 flex flex-col"
            style={{
              background: colors.surface,
              border: `1px solid ${tier.highlight ? colors.accentBorder : colors.border}`,
              boxShadow: tier.highlight ? `0 20px 50px ${colors.accentMuted}` : 'none',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{tier.name}</h3>
              {tier.highlight && (
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: colors.accent, color: colors.accentTextOnBg }}>★</span>
              )}
            </div>
            <p className="text-xs mt-1 mb-3" style={{ color: colors.textMuted }}>{tier.desc}</p>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold" style={{ color: tier.price === free ? colors.accent : colors.textPrimary }}>{tier.price}</span>
              {tier.price !== free && <span className="text-xs" style={{ color: colors.textMuted }}>{t('pricing.perMonth')}</span>}
            </div>
            <p className="text-xs mt-3 leading-relaxed" style={{ color: colors.textMuted }}>{tier.feat}</p>
          </div>
        ))}
      </div>
      <p className="text-center text-xs mt-6" style={{ color: colors.textDim }}>{t('pricing.foundingNote')}</p>
    </section>
  );
}
