// apps/web-buyer/src/app/(shop)/page.tsx
//
// Server component с metadata для SEO. Hero — server, остальные блоки
// (chips/top stores/featured) — client с TanStack Query.

import type { Metadata } from 'next';
import { RecentStores } from '@/components/home/RecentStores';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeCategoryChips } from '@/components/home/HomeCategoryChips';
import { HomeTopStores } from '@/components/home/HomeTopStores';
import { HomeFeaturedFeed } from '@/components/home/HomeFeaturedFeed';
import { HomeQuickLinks } from '@/components/home/HomeQuickLinks';
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
    <div className="min-h-screen flex flex-col">
      <HomeHero />
      <HomeCategoryChips />
      <HomeTopStores />
      <HomeFeaturedFeed />
      <div className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto w-full">
        <RecentStores />
      </div>
      <HomeQuickLinks />
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
