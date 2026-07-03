// apps/web-buyer/src/components/home/HomeHero.tsx
//
// Client component (uses useTranslation hook). Brand-voice блок: stripe + h1 + sub + 2 CTAs.
// 'use client' does NOT remove SSR — Next.js App Router still SSRs this for initial HTML.
'use client';

import Link from 'next/link';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'maxsavdo_bot';

export function HomeHero() {
  const { t } = useTranslation();
  const becomeSellerHref = `https://t.me/${BOT_USERNAME}?start=become_seller`;

  // Dict value uses \n as line separator — split and render <br /> to preserve layout.
  const titleLines = t('home.hero.title').split('\n');

  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-2 max-w-7xl mx-auto">
      <div className="max-w-2xl">
        <div
          className="text-[10px] font-bold uppercase mb-3"
          style={{ color: colors.brand, letterSpacing: '0.18em' }}
        >
          {t('home.hero.tagline')}
        </div>
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-3"
          style={{ color: colors.textStrong }}
        >
          {titleLines.map((line, i) => (
            <span key={i}>
              {i > 0 && <br />}
              {line}
            </span>
          ))}
        </h1>
        <p
          className="text-sm sm:text-base mb-5 max-w-md"
          style={{ color: colors.textMuted, lineHeight: 1.55 }}
        >
          {t('home.hero.subtitle')}
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/stores"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {t('home.hero.browseStores')}
          </Link>
          <a
            href={becomeSellerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: 'transparent', color: colors.textStrong, border: `1px solid ${colors.border}` }}
          >
            {t('home.hero.becomeSeller')}
          </a>
        </div>
      </div>
    </section>
  );
}
