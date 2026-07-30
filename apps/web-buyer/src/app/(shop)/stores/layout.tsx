import type { Metadata } from 'next';

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

export default function StoresLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
