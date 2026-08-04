import type { Metadata } from 'next';
import { serverGetStoresCatalog } from '@/lib/api/storefront-server';
import { isSeoExcludedStore } from '@/lib/seo/index-exclusions';

const SITE_URL = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

/**
 * Metadata carrier for `/stores`.
 *
 * `stores/page.tsx` is a client component (filters, sorting, URL state), and a
 * client component cannot export `metadata`. Without this layout the route fell
 * through to the root layout's metadata, so `/stores`, `/products` and `/` all
 * shipped the same title and description — three URLs claiming to be the same
 * page, and no canonical anywhere.
 */
export const metadata: Metadata = {
  title: 'Каталог магазинов Telegram — maxsavdo',
  description:
    'Каталог магазинов Telegram Узбекистана: одежда, обувь, косметика, техника. Прямая связь с продавцом, без посредников.',
  alternates: { canonical: '/stores' },
  openGraph: {
    type: 'website',
    siteName: 'maxsavdo',
    title: 'Каталог магазинов Telegram — maxsavdo',
    description: 'Магазины Telegram Узбекистана в одном каталоге.',
    url: '/stores',
    locale: 'ru_RU',
  },
};

/**
 * SEO-ITEMLIST-001: `/stores` is the hub page for every storefront — ItemList
 * is the schema.org type for exactly this ("a list of things"), same reason
 * the product detail page carries a `Product` type instead of nothing. Fetched
 * independently from `page.tsx` (which is client-only) — this layout is a
 * server component purely to grab the data for the script tag, it doesn't
 * touch what the client renders.
 */
async function buildStoresItemListJsonLd() {
  const stores = await serverGetStoresCatalog().catch(() => []);
  const visible = stores.filter((s) => !isSeoExcludedStore(s.slug));
  if (visible.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: visible.map((s, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${s.slug}`,
      name: s.name,
    })),
  };
}

export default async function StoresLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = await buildStoresItemListJsonLd();
  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
