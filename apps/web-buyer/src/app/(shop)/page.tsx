// apps/web-buyer/src/app/(shop)/page.tsx
//
// Slim homepage: Hero + TopStores. Решение 21.05.2026 после фидбэка Азима
// «было лучше без лишних вещей». Chips / Featured / Recent / QuickLinks
// убраны со страницы (компоненты на диске оставлены — на случай возврата).

import type { Metadata } from 'next';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { HomeHero } from '@/components/home/HomeHero';
import { HomeTopStores } from '@/components/home/HomeTopStores';
import { serverGetFeatured } from '@/lib/api/storefront-server';
import { colors } from '@/lib/styles';

export const metadata: Metadata = {
  title: 'maxsavdo — магазины Telegram Узбекистана',
  description:
    'Магазины Telegram. Без посредников. Прямая связь с продавцом. Доставка по Узбекистану.',
  openGraph: {
    title: 'maxsavdo — магазины Telegram Узбекистана',
    description: 'Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану.',
    siteName: 'maxsavdo',
    locale: 'ru_RU',
    type: 'website',
  },
};

export default async function HomePage() {
  // SEO-AUDIT-001 п.3: server-фетч featured, чтобы краулер видел реальные
  // <a href="/{slug}"> в первом HTML, а не только client-side skeleton.
  const featured = await serverGetFeatured().catch(() => undefined);

  return (
    <div className="min-h-screen">
      <HomeHero />
      <HomeTopStores initialData={featured} />
      <p
        className="text-[11px] text-center mt-10 pb-6"
        style={{ color: colors.textMuted }}
      >
        © 2026 maxsavdo
      </p>
      <BottomNavBar active="store" />
    </div>
  );
}
