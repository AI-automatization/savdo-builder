'use client';

import Link from 'next/link';
import { ArrowRight, Heart, ShoppingBag, Star } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { demoStoreUrl } from '@/lib/landing/demo-store';
import { landingTrack } from '@/lib/landing/analytics';
import { useReveal } from '@/lib/landing/use-reveal';

export function Hero() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const demo = demoStoreUrl();
  // reveal-on-scroll: каждый блок проявляется со своим delay (стаггер).
  const badgeRef = useReveal<HTMLSpanElement>();
  const titleRef = useReveal<HTMLHeadingElement>();
  const subtitleRef = useReveal<HTMLParagraphElement>();
  const ctaRef = useReveal<HTMLDivElement>();
  const metricsRef = useReveal<HTMLDivElement>();
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
            ref={badgeRef}
            className="reveal text-xs font-medium px-3 py-1 rounded-full"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }}
          >
            {t('hero.badge')}
          </span>
          <h1
            ref={titleRef}
            className="reveal reveal-delay-1 max-w-xl text-4xl sm:text-5xl font-bold leading-[1.1] tracking-tight"
            style={{ color: colors.textPrimary }}
          >
            {t('hero.title')}
          </h1>
          <p
            ref={subtitleRef}
            className="reveal reveal-delay-2 max-w-lg text-base sm:text-lg leading-relaxed"
            style={{ color: colors.textMuted }}
          >
            {t('hero.subtitle')}
          </p>

          <div ref={ctaRef} className="reveal reveal-delay-3 flex flex-col sm:flex-row items-center gap-3 mt-2">
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

          <div ref={metricsRef} className="reveal reveal-delay-3 mt-6 grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-md">
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
              {/* обложка магазина + айдентика */}
              <div className="relative h-20" style={{ background: `linear-gradient(135deg, ${colors.accent}, ${colors.accentBorder})` }}>
                <div
                  className="absolute -bottom-4 left-3 w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black"
                  style={{ background: colors.bg, color: colors.accent, border: `2px solid ${colors.bg}` }}
                >
                  N
                </div>
              </div>
              <div className="px-3 pt-5 pb-2">
                <div className="text-sm font-bold leading-none" style={{ color: colors.textPrimary }}>Atelier Nur</div>
                <div className="mt-1 flex items-center gap-1 text-[10px]" style={{ color: colors.textMuted }}>
                  <Star size={9} style={{ color: colors.accent }} fill={colors.accent} /> 4.9 · Аксессуары
                </div>
              </div>
              {/* витрина товаров */}
              <div className="px-3 grid grid-cols-2 gap-2">
                {[
                  { price: '290 000', g: 'linear-gradient(135deg,#4a4036,#1a1a1a)' },
                  { price: '540 000', g: 'linear-gradient(135deg,#3a3a42,#18181c)' },
                  { price: '180 000', g: 'linear-gradient(135deg,#4a3a3a,#1a1414)' },
                  { price: '760 000', g: 'linear-gradient(135deg,#3a4240,#161a18)' },
                ].map((it, i) => (
                  <div key={i} className="rounded-lg overflow-hidden" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <div className="relative" style={{ aspectRatio: '1/1', background: it.g }}>
                      <Heart size={11} className="absolute top-1 right-1" style={{ color: colors.accent }} />
                    </div>
                    <div className="px-1.5 py-1">
                      <div className="text-[10px] font-bold leading-none" style={{ color: colors.textPrimary }}>{it.price}</div>
                      <div className="text-[8px] mt-0.5" style={{ color: colors.textMuted }}>сум</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* корзина */}
              <div
                className="mt-auto m-3 h-9 rounded-md flex items-center justify-center gap-2 text-xs font-bold"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <ShoppingBag size={14} /> Корзина · 2
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
