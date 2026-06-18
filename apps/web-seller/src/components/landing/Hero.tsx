'use client';

import Link from 'next/link';
import { ArrowRight, Heart, Star, Search, LayoutGrid, ShoppingBag, User } from 'lucide-react';
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
  const nicheRef = useReveal<HTMLParagraphElement>();
  const ctaRef = useReveal<HTMLDivElement>();
  const metricsRef = useReveal<HTMLDivElement>();
  const metrics = [
    { v: t('hero.metric1.value'), l: t('hero.metric1.label') },
    { v: t('hero.metric2.value'), l: t('hero.metric2.label') },
    { v: t('hero.metric3.value'), l: t('hero.metric3.label') },
  ];
  // Демо-витрина внутри мок-телефона (royalty-free фото, Unsplash License).
  const mockProducts = [
    { name: t('mock.p1'), price: '1 290 000', old: '1 690 000', off: '-23%', rating: '4.9', img: '/landing/p-bag.jpg' },
    { name: t('mock.p2'), price: '2 400 000', old: null, off: null, rating: '4.8', img: '/landing/p-watch.jpg' },
    { name: t('mock.p3'), price: '890 000', old: null, off: null, rating: '5.0', img: '/landing/p-heels.jpg' },
    { name: t('mock.p4'), price: '1 150 000', old: null, off: null, rating: '4.7', img: '/landing/p-perfume.jpg' },
  ];
  const mockCats = [t('mock.cat.all'), t('mock.cat.bags'), t('mock.cat.watches'), t('mock.cat.shoes')];
  const navItems = [
    { icon: LayoutGrid, label: t('mock.nav.catalog'), active: true, badge: 0 },
    { icon: Search, label: t('mock.nav.search'), active: false, badge: 0 },
    { icon: ShoppingBag, label: t('mock.nav.cart'), active: false, badge: 2 },
    { icon: User, label: t('mock.nav.profile'), active: false, badge: 0 },
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
          <p
            ref={nicheRef}
            className="reveal reveal-delay-2 text-xs sm:text-sm font-medium tracking-wide"
            style={{ color: colors.accent }}
          >
            {t('hero.niches')}
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
              {/* карточка-шапка магазина — как в TMA StorePage */}
              <div className="mx-2.5 mt-2.5 mb-2 p-2.5 rounded-2xl" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}`, color: colors.accent }}
                  >
                    A
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[13px] font-bold truncate" style={{ color: colors.textPrimary }}>Atelier Nur</span>
                      <span
                        className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full text-[8px] font-bold shrink-0"
                        style={{ background: 'rgba(37,99,235,0.20)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.45)' }}
                      >
                        ✓
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="inline-flex items-center gap-0.5 text-[8px] font-semibold" style={{ color: colors.textPrimary }}>
                        <Star size={8} fill={colors.accent} style={{ color: colors.accent }} /> 4.9
                        <span className="font-normal" style={{ color: colors.textMuted }}>(214)</span>
                      </span>
                      <span style={{ color: colors.border }}>·</span>
                      <span className="text-[8px]" style={{ color: colors.textMuted }}>{t('mock.products')}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* поиск */}
              <div
                className="mx-2.5 mb-2 h-7 rounded-lg flex items-center gap-1.5 px-2"
                style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
              >
                <Search size={11} style={{ color: colors.textMuted }} />
                <span className="text-[8px]" style={{ color: colors.textMuted }}>{t('mock.search')}</span>
              </div>

              {/* чипы категорий */}
              <div className="px-2.5 flex gap-1.5 overflow-hidden">
                {mockCats.map((c, i) => (
                  <span
                    key={c}
                    className="text-[8px] font-semibold px-2 py-1 rounded-full whitespace-nowrap"
                    style={
                      i === 0
                        ? { background: colors.accent, color: colors.accentTextOnBg }
                        : { background: colors.surface, border: `1px solid ${colors.border}`, color: colors.textMuted }
                    }
                  >
                    {c}
                  </span>
                ))}
              </div>

              {/* лейбл секции */}
              <div className="px-2.5 mt-2.5 mb-1.5 flex items-center justify-between">
                <span className="text-[8px] font-semibold uppercase tracking-wider" style={{ color: colors.textMuted }}>{t('mock.section')} · 128</span>
                <span className="text-[8px]" style={{ color: colors.accent }}>{t('mock.sort')}</span>
              </div>

              {/* сетка товаров — бесконечный авто-скролл */}
              <div className="flex-1 overflow-hidden px-2.5">
                <div className="ms-phone-scroll grid grid-cols-2 gap-2 content-start">
                {[...mockProducts, ...mockProducts].map((p, i) => (
                  <div key={i} className="rounded-xl overflow-hidden flex flex-col" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
                    <div className="relative" style={{ aspectRatio: '1/1' }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={p.img} alt={p.name} className="w-full h-full object-cover" />
                      {p.off && (
                        <span
                          className="absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded"
                          style={{ background: colors.accent, color: colors.accentTextOnBg }}
                        >
                          {p.off}
                        </span>
                      )}
                      <span
                        className="absolute top-1 right-1 w-4 h-4 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.35)' }}
                      >
                        <Heart size={9} style={{ color: '#fff' }} />
                      </span>
                    </div>
                    <div className="px-1.5 py-1.5 flex flex-col gap-1">
                      <span className="text-[9px] font-semibold leading-tight truncate" style={{ color: colors.textPrimary }}>{p.name}</span>
                      <span className="inline-flex items-center gap-0.5 text-[7px]" style={{ color: colors.textMuted }}>
                        <Star size={7} fill={colors.accent} style={{ color: colors.accent }} /> {p.rating}
                      </span>
                      <div className="flex items-end justify-between gap-1">
                        <div className="flex flex-col leading-none min-w-0">
                          {p.old && <span className="text-[7px] line-through truncate" style={{ color: colors.textMuted }}>{p.old}</span>}
                          <span className="text-[9px] font-bold truncate" style={{ color: colors.accent }}>{p.price}</span>
                        </div>
                        <span
                          className="w-5 h-5 rounded-md flex items-center justify-center text-[12px] font-bold leading-none shrink-0"
                          style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}`, color: colors.accent }}
                        >
                          +
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                </div>
              </div>

              {/* нижняя навигация — как в TMA */}
              <div
                className="mt-auto flex items-stretch justify-around px-1 pt-1.5 pb-2"
                style={{ background: colors.surface, borderTop: `1px solid ${colors.border}` }}
              >
                {navItems.map(({ icon: Icon, label, active, badge }) => (
                  <div key={label} className="relative flex flex-col items-center gap-0.5" style={{ color: active ? colors.accent : colors.textMuted }}>
                    <Icon size={14} />
                    <span className="text-[7px] font-medium">{label}</span>
                    {badge > 0 && (
                      <span
                        className="absolute -top-1 right-1 min-w-3 h-3 px-0.5 rounded-full text-[7px] font-bold flex items-center justify-center"
                        style={{ background: colors.accent, color: colors.accentTextOnBg }}
                      >
                        {badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
