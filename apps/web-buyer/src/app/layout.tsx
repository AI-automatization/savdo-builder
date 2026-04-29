// build: light revamp 2026-04-29
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../lib/auth/context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
          <QueryProvider>
            <AuthProvider>{children}</AuthProvider>
          </QueryProvider>
        </body>
    </html>
  );
}
