'use client';

import { ArrowUpRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { showcaseStores } from '@/lib/landing/showcase';
import { useReveal } from '@/lib/landing/use-reveal';
import { landingTrack } from '@/lib/landing/analytics';

export function Showcase() {
  const { t } = useTranslation();
  const stores = showcaseStores();
  const ref = useReveal<HTMLDivElement>();
  if (stores.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div ref={ref} className="reveal text-center mb-10">
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.textPrimary }}>{t('showcase.title')}</h2>
        <p className="mt-3 text-sm sm:text-base max-w-xl mx-auto" style={{ color: colors.textMuted }}>{t('showcase.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stores.map((s) => (
          <a
            key={s.slug}
            href={s.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => landingTrack('showcase_store_opened', { slug: s.slug })}
            className="group reveal rounded-xl overflow-hidden transition-transform hover:-translate-y-1"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <div className="h-44" style={{ background: `linear-gradient(135deg, ${colors.accentMuted}, ${colors.surface})` }} />
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{s.slug}</span>
              <ArrowUpRight
                size={16}
                style={{ color: colors.accent }}
                className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
              />
            </div>
          </a>
        ))}
      </div>
    </section>
  );
}
