// apps/web-buyer/src/app/(shop)/page.tsx
//
// Slim homepage: Hero + TopStores. Решение 21.05.2026 после фидбэка Азима
// «было лучше без лишних вещей». Chips / Featured / Recent / QuickLinks
// убраны со страницы (компоненты на диске оставлены — на случай возврата).

import type { Metadata } from 'next';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeTopStores } from '@/components/home/HomeTopStores';
import { colors } from '@/lib/styles';

export const metadata: Metadata = {
  title: 'Savdo — магазины Telegram Узбекистана',
  description:
    'Магазины Telegram. Без посредников. Прямая связь с продавцом. Доставка по Узбекистану.',
  openGraph: {
    title: 'Savdo — магазины Telegram Узбекистана',
    description: 'Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану.',
    siteName: 'Savdo',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <HomeHero />
      <HomeTopStores />
      <p
        className="text-[11px] text-center mt-10 pb-6"
        style={{ color: colors.textMuted }}
      >
        © 2026 Savdo
      </p>
      <BottomNavBar active="store" />
    </div>
  );
}
