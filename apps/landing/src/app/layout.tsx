import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  display: "swap",
  variable: "--font-inter",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maxsavdo.uz";

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
      <body className="min-h-screen bg-bg text-text antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
