import type { Metadata } from "next";
import { t } from "@/lib/i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://maxsavdo.uz";
const ru = t("ru");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: ru.meta.title,
  description: ru.meta.description,
  alternates: {
    canonical: "/ru",
    languages: {
      uz: "/",
      ru: "/ru",
      "x-default": "/",
    },
  },
  openGraph: {
    type: "website",
    locale: "ru_RU",
    alternateLocale: ["uz_UZ"],
    url: `${SITE_URL}/ru`,
    siteName: "MaxSavdo",
    title: ru.meta.ogTitle,
    description: ru.meta.ogDescription,
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
    title: ru.meta.ogTitle,
    description: ru.meta.ogDescription,
    images: ["/og-image.png"],
  },
};

export default function RuLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Note: Next.js App Router renders only one <html>/<body> at the root layout.
  // The lang attribute is overridden per-locale at the page level via a top-level
  // wrapper plus the alternates metadata. For full per-route lang switching we
  // rely on the html lang in the locale-aware page and the `alternates.languages`
  // metadata above for SEO. This nested layout exists to provide RU-specific
  // metadata only.
  return <>{children}</>;
}
