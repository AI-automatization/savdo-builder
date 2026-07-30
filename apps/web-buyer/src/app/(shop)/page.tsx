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
import { isSeoExcludedStore } from '@/lib/seo/index-exclusions';
import { colors } from '@/lib/styles';

export const metadata: Metadata = {
  title: 'maxsavdo — магазины Telegram Узбекистана',
  description:
    'Магазины Telegram. Без посредников. Прямая связь с продавцом. Доставка по Узбекистану.',
  // Self-referencing canonical. Declared per route rather than once in the root
  // layout on purpose: Next.js does not merge `alternates` — a canonical in the
  // root layout would be inherited verbatim by every page that does not set its
  // own, so /terms and /help would all claim to be duplicates of "/".
  alternates: { canonical: '/' },
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
  const rawFeatured = await serverGetFeatured().catch(() => undefined);

  // The same server-rendered links that make this page crawlable also hand the
  // crawler every store in the block — so a store excluded from the index has to be
  // dropped here too, not just from the sitemap. This is a homepage-only filter: the
  // /stores catalog is client-rendered off the API and is not affected.
  const featured = rawFeatured
    ? {
        ...rawFeatured,
        topStores: rawFeatured.topStores.filter(
          (store) => !isSeoExcludedStore(store.slug),
        ),
        featuredProducts: rawFeatured.featuredProducts.filter(
          (product) => !isSeoExcludedStore(product.store.slug),
        ),
      }
    : undefined;

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
