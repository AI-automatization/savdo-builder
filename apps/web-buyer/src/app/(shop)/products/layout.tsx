import type { Metadata } from 'next';

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

export default function ProductsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
