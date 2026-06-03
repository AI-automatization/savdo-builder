'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function Pricing() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const tiers = [
    { name: t('pricing.tier.free'), desc: t('pricing.tier.free.desc'), price: '0', highlight: false },
    { name: t('pricing.tier.pro'), desc: t('pricing.tier.pro.desc'), price: t('pricing.soon'), highlight: true },
    { name: t('pricing.tier.business'), desc: t('pricing.tier.business.desc'), price: t('pricing.soon'), highlight: false },
  ];
  return (
    <section id="pricing" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      {/* Главный beta-блок */}
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

      {/* Тизер лестницы — без цифр */}
      <p className="text-center text-sm font-medium mt-12 mb-6" style={{ color: colors.textMuted }}>{t('pricing.ladder.title')}</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiers.map((tier, i) => (
          <div key={i} className="rounded-xl p-6 flex flex-col" style={{ background: colors.surface, border: `1px solid ${tier.highlight ? colors.accentBorder : colors.border}` }}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold" style={{ color: colors.textPrimary }}>{tier.name}</h3>
              {tier.highlight && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full" style={{ background: colors.accent, color: colors.accentTextOnBg }}>★</span>}
            </div>
            <p className="text-xs mt-1 mb-3" style={{ color: colors.textMuted }}>{tier.desc}</p>
            <div className="text-lg font-bold" style={{ color: tier.price === '0' ? colors.accent : colors.textDim }}>
              {tier.price === '0' ? '0 сум' : tier.price}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
