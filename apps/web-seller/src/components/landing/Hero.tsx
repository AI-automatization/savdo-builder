'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { demoStoreUrl } from '@/lib/landing/demo-store';
import { landingTrack } from '@/lib/landing/analytics';

export function Hero() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const demo = demoStoreUrl();
  const metrics = [
    { v: t('hero.metric1.value'), l: t('hero.metric1.label') },
    { v: t('hero.metric2.value'), l: t('hero.metric2.label') },
    { v: t('hero.metric3.value'), l: t('hero.metric3.label') },
  ];

  return (
    <section className="relative overflow-hidden">
      {/* Точечный золотой glow — premium-акцент, не перебор */}
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[420px] w-[720px] rounded-full opacity-[0.12] blur-3xl" style={{ background: colors.accent }} />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 flex flex-col items-center text-center gap-6">
        <span className="text-xs font-medium px-3 py-1 rounded-full" style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}>
          {t('hero.badge')}
        </span>
        <h1 className="max-w-3xl text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight" style={{ color: colors.textPrimary }}>
          {t('hero.title')}
        </h1>
        <p className="max-w-2xl text-base sm:text-lg leading-relaxed" style={{ color: colors.textMuted }}>
          {t('hero.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-3 mt-2">
          <Link
            href={isAuthenticated ? '/dashboard' : '/login'}
            onClick={() => landingTrack('landing_cta_clicked', { place: 'hero' })}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {t('cta.createFree')} <ArrowRight size={16} />
          </Link>
          {demo && (
            <a
              href={demo}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => landingTrack('demo_store_opened')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-semibold transition-colors hover:opacity-80"
              style={{ border: `1px solid ${colors.border}`, color: colors.textPrimary }}
            >
              {t('cta.demo')} <ArrowRight size={16} />
            </a>
          )}
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-lg">
          {metrics.map((m, i) => (
            <div key={i} className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl font-bold" style={{ color: colors.accent }}>{m.v}</span>
              <span className="text-xs mt-1" style={{ color: colors.textMuted }}>{m.l}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
