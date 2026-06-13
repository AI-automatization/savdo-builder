import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maxsavdo.uz";

const uz = t("uz");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: uz.meta.title,
    template: "%s | MaxSavdo",
  },
  description: uz.meta.description,
  applicationName: "MaxSavdo",
  keywords: [
    "Telegram doʻkon",
    "Telegram bot",
    "konstruktor",
    "savdo",
    "Uzbekistan",
    "e-commerce",
    "MaxSavdo",
    "savdobuilder",
  ],
  authors: [{ name: "MaxSavdo" }],
  alternates: {
    canonical: "/",
    languages: {
      uz: "/",
      ru: "/ru",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    alternateLocale: ["ru_RU"],
    url: SITE_URL,
    siteName: "MaxSavdo",
    title: uz.meta.ogTitle,
    description: uz.meta.ogDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "MaxSavdo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: uz.meta.ogTitle,
    description: uz.meta.ogDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="uz" className={`${inter.variable} dark`}>
      <body className="min-h-screen bg-brand-bg text-brand-text antialiased font-sans">
        {/* Ambient amber orbs — Azim base, Polat colors */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
          <div className="absolute rounded-full" style={{ width: 640, height: 640, top: -200, right: -160, background: "radial-gradient(circle, rgba(232,165,82,0.18) 0%, transparent 65%)", filter: "blur(60px)" }} />
          <div className="absolute rounded-full" style={{ width: 420, height: 420, bottom: 80, left: -110, background: "radial-gradient(circle, rgba(212,146,46,0.13) 0%, transparent 65%)", filter: "blur(50px)" }} />
          <div className="absolute rounded-full" style={{ width: 340, height: 340, top: "45%", left: "50%", transform: "translate(-50%,-50%)", background: "radial-gradient(circle, rgba(232,165,82,0.08) 0%, transparent 65%)", filter: "blur(44px)" }} />
          <div className="absolute rounded-full" style={{ width: 240, height: 240, bottom: 280, right: 80, background: "radial-gradient(circle, rgba(255,190,100,0.10) 0%, transparent 65%)", filter: "blur(34px)" }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
