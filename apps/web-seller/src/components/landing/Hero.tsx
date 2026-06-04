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
      {/* Дышащий золотой glow — premium-акцент */}
      <div
        aria-hidden
        className="ms-glow pointer-events-none absolute top-[34%] left-1/2 h-[420px] w-[720px] rounded-full opacity-[0.5] blur-3xl"
        style={{ background: colors.accent }}
      />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 grid lg:grid-cols-2 gap-10 items-center">
        {/* left: copy */}
        <div className="flex flex-col items-center lg:items-start text-center lg:text-left gap-6">
          <span
            className="reveal text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            {t('hero.badge')}
          </span>
          <h1
            className="reveal reveal-delay-1 max-w-xl text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            {t('hero.title')}
          </h1>
          <p
            className="reveal reveal-delay-2 max-w-lg text-base sm:text-lg leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {t('hero.subtitle')}
          </p>

          <div className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center gap-3 mt-2">
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

          <div className="reveal reveal-delay-3 mt-6 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-md">
            {metrics.map((m, i) => (
              <div key={i} className="flex flex-col items-center lg:items-start">
                <span className="text-2xl sm:text-3xl font-bold" style={{ color: colors.accent }}>{m.v}</span>
                <span className="text-xs mt-1" style={{ color: colors.textMuted }}>{m.l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* right: парящий мок телефона (desktop) */}
        <div className="hidden lg:flex justify-center">
          <div
            className="ms-floaty relative w-[260px] h-[520px] rounded-[2.5rem] p-3"
            style={{ border: `2px solid ${colors.accentBorder}`, background: colors.surface, boxShadow: `0 30px 80px ${colors.accentMuted}` }}
          >
            <div className="w-full h-full rounded-[2rem] overflow-hidden flex flex-col" style={{ background: colors.bg }}>
              <div className="h-28" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBorder})` }} />
              <div className="p-3 grid grid-cols-2 gap-2">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg" style={{ aspectRatio: '3/4', background: colors.surface, border: `1px solid ${colors.border}` }} />
                ))}
              </div>
              <div className="mt-auto m-3 h-10 rounded-md" style={{ background: colors.accent }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
