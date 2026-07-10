'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { demoStoreUrl } from '@/lib/landing/demo-store';
import { useReveal } from '@/lib/landing/use-reveal';
import { landingTrack } from '@/lib/landing/analytics';

// Курируемые премиум-примеры витрин — визуальное доказательство «выглядит дорого».
// Названия магазинов — бренд-литералы (не локализуются), ниши — через i18n.
// Фото royalty-free (Unsplash License). Секция всегда видна; CTA ведёт на живой
// демо-магазин (веб-демо без бота — наша отстройка от qlay).
export function Showcase() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const demo = demoStoreUrl();

  // Без rating-бейджей: витрины — дизайн-примеры, вымышленный рейтинг = fake social proof.
  const stores = [
    { cover: '/landing/s-fashion.jpg', name: 'Atelier Nur', niche: t('showcase.niche1'), initial: 'A' },
    { cover: '/landing/s-beauty.jpg', name: 'Lumé Beauty', niche: t('showcase.niche2'), initial: 'L' },
    { cover: '/landing/s-jewelry.jpg', name: 'Studio Roz', niche: t('showcase.niche3'), initial: 'S' },
  ];

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div ref={ref} className="reveal text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('showcase.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('showcase.subtitle')}</p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <div
            key={s.name}
            className="rounded-2xl overflow-hidden transition-transform hover:-translate-y-1"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div className="relative h-48">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.cover} alt={s.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0"
                style={{ background: colors.accentMuted, border: `1px solid ${colors.accentBorder}`, color: colors.accent }}
              >
                {s.initial}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold truncate" style={{ color: colors.textPrimary }}>{s.name}</div>
                <div className="text-xs truncate" style={{ color: colors.textMuted }}>{s.niche}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {demo && (
        <div className="mt-10 flex justify-center">
          <a
            href={demo}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => landingTrack('demo_store_opened')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-sm font-bold transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {t('showcase.cta')} <ArrowUpRight size={16} />
          </a>
        </div>
      )}
    </section>
  );
}
