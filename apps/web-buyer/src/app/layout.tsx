// build: maxsavdo dark-luxury 2026-05-25
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../lib/auth/context";
import { ThemeProvider } from "../lib/theme/theme-provider";
import { ThemeScript } from "../lib/theme/theme-script";
import { I18nProvider } from "../lib/i18n";

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "maxsavdo — магазины в Telegram",
    template: "%s",
  },
  description: "Покупайте у продавцов Узбекистана через Telegram. Быстро, удобно, без регистрации.",
  // Both languages, on purpose. The UI is ru by default with a client-side switch,
  // so there are no per-locale URLs and hreflang does not apply here — nothing to
  // point it at. Keywords are the one channel that can carry the uz vocabulary
  // without inventing URLs, and Yandex (which now runs a uz-trained neural search
  // for Uzbekistan) still reads them.
  //
  // The real uz surface is seller-written store and product text, plus path-based
  // locales (/uz/...) if that is ever decided — that is an architecture call, not a
  // metadata one. See analiz/seo-geo-aeo-report-2026-07-24.md §3.3.
  keywords: [
    'Telegram doʻkon',
    'Telegramda xarid qilish',
    'onlayn doʻkon Oʻzbekiston',
    'Toshkent yetkazib berish',
    'maxsavdo',
    'магазины в Telegram',
    'интернет магазин Узбекистан',
    'купить в Телеграм',
    'доставка Ташкент',
    'максавдо',
  ],
  openGraph: {
    type: 'website',
    siteName: 'maxsavdo',
    title: 'maxsavdo — магазины в Telegram',
    description: 'Покупайте у продавцов Узбекистана через Telegram',
    locale: 'ru_RU',
    alternateLocale: ['uz_UZ'],
    url: '/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'maxsavdo — магазины в Telegram',
    description: 'Покупайте у продавцов Узбекистана через Telegram',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript defaultTheme="system" />
      </head>
      <body className="min-h-full flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'maxsavdo',
              url: siteUrl,
              logo: `${siteUrl}/brand/maxsavdo-mark.png`,
              description: 'Платформа интернет-магазинов Узбекистана в Telegram',
              areaServed: { '@type': 'Country', name: 'Uzbekistan' },
              // maxsavdo — продукт TezCode (MCHJ, резидент IT Park). Живого сайта у
              // TezCode пока нет (tezcode.uz не резолвится) — sameAs на верифицированный
              // GitHub org, не на непроверенный домен.
              parentOrganization: {
                '@type': 'Organization',
                name: 'TezCode',
                sameAs: ['https://github.com/AI-automatization'],
              },
              sameAs: ['https://t.me/maxsavdo_bot'],
              contactPoint: [
                {
                  '@type': 'ContactPoint',
                  contactType: 'customer support',
                  email: 'hello@maxsavdo.uz',
                  url: 'https://t.me/maxsavdo_bot',
                  availableLanguage: ['ru', 'uz'],
                },
              ],
            }),
          }}
        />
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="system">
              <I18nProvider>
                {children}
              </I18nProvider>
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
