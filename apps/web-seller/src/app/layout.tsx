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

export const metadata: Metadata = {
  title: "maxsavdo — Seller Dashboard",
  description: "Управляй магазином в Telegram",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      className={`${inter.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="h-full antialiased">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="dark">
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
