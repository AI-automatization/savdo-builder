// apps/web-buyer/src/components/home/HomeHero.tsx
//
// Server component. Brand-voice блок: stripe + h1 + sub + 2 CTAs.
// Никаких hooks, никакого state.

import { colors } from '@/lib/styles';

const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'savdo_builderBOT';

export function HomeHero() {
  const becomeSellerHref = `https://t.me/${BOT_USERNAME}?start=become_seller`;

  return (
    <section className="px-4 sm:px-6 pt-8 sm:pt-12 pb-2 max-w-7xl mx-auto">
      <div className="max-w-2xl">
        <div
          className="text-[10px] font-bold uppercase mb-3"
          style={{ color: colors.brand, letterSpacing: '0.18em' }}
        >
          Bozor zamonaviy
        </div>
        <h1
          className="text-2xl sm:text-3xl md:text-4xl font-bold leading-tight tracking-tight mb-3"
          style={{ color: colors.textStrong }}
        >
          Магазины Telegram.<br />Без посредников.
        </h1>
        <p
          className="text-sm sm:text-base mb-5 max-w-md"
          style={{ color: colors.textMuted, lineHeight: 1.55 }}
        >
          Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану.
        </p>
        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href="#top-stores"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            Смотреть магазины
          </a>
          <a
            href={becomeSellerHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md text-sm font-semibold transition-colors"
            style={{ background: 'transparent', color: colors.textStrong, border: `1px solid ${colors.border}` }}
          >
            Стать продавцом
          </a>
        </div>
      </div>
    </section>
  );
}
