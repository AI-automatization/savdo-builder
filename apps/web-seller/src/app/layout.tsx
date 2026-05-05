import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "../providers/query-provider";
import { AuthProvider } from "../lib/auth/context";
import { ThemeProvider } from "../lib/theme/theme-provider";
import { ThemeScript } from "../lib/theme/theme-script";

export const metadata: Metadata = {
  title: "Savdo — Seller Dashboard",
  description: "Управляй магазином в Telegram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full" suppressHydrationWarning>
      <head>
        <ThemeScript defaultTheme="dark" />
      </head>
      <body className="h-full">
        <QueryProvider>
          <AuthProvider>
            <ThemeProvider defaultTheme="dark">
              {children}
            </ThemeProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
