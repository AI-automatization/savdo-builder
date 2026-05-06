// build: soft-color-lifestyle 2026-05-05
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../lib/auth/context";
import { ThemeProvider } from "../lib/theme/theme-provider";
import { ThemeScript } from "../lib/theme/theme-script";

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://savdo.uz';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Savdo — магазины в Telegram",
    template: "%s",
  },
  description: "Покупайте у продавцов Узбекистана через Telegram. Быстро, удобно, без регистрации.",
  openGraph: {
    type: 'website',
    siteName: 'Savdo',
    title: 'Savdo — магазины в Telegram',
    description: 'Покупайте у продавцов Узбекистана через Telegram',
    locale: 'ru_RU',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Savdo — магазины в Telegram',
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
      lang="en"
      className={`${inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript defaultTheme="system" />
      </head>
      <body className="min-h-full flex flex-col">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="system">
              {children}
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
