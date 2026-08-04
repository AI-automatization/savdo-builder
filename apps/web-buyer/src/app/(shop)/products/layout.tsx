import type { Metadata } from 'next';
import { serverGetProductsCatalog } from '@/lib/api/storefront-server';
import { isSeoExcludedStore } from '@/lib/seo/index-exclusions';

const SITE_URL = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

/**
 * Metadata carrier for `/products` — same reason as `stores/layout.tsx`: the page
 * itself is a client component and cannot export `metadata`, so without this the
 * route inherited the homepage's title and description verbatim.
 */
export const metadata: Metadata = {
  title: 'Каталог товаров — maxsavdo',
  description:
    'Товары от продавцов Узбекистана в Telegram: цена видна сразу, заказ без регистрации, доставка по стране.',
  alternates: { canonical: '/products' },
  openGraph: {
    type: 'website',
    siteName: 'maxsavdo',
    title: 'Каталог товаров — maxsavdo',
    description: 'Товары от продавцов Узбекистана в Telegram.',
    url: '/products',
    locale: 'ru_RU',
  },
};

/**
 * SEO-ITEMLIST-001: same reasoning as `stores/layout.tsx`. A product without
 * a resolvable store slug can't get a real canonical URL — skipped rather
 * than emitted with a broken/missing `url`, since an ItemList entry without
 * a URL is worse than no entry (schema validators flag it).
 */
async function buildProductsItemListJsonLd() {
  const products = await serverGetProductsCatalog().catch(() => []);
  const visible = products.filter((p) => p.store?.slug && !isSeoExcludedStore(p.store.slug));
  if (visible.length === 0) return null;

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: visible.map((p, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      url: `${SITE_URL}/${p.store!.slug}/products/${p.id}`,
      name: p.title,
    })),
  };
}

export default async function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const jsonLd = await buildProductsItemListJsonLd();
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
