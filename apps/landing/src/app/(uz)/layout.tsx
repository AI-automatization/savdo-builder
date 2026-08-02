import type { Metadata, Viewport } from "next";
import { t } from "@/lib/i18n";
import { SITE_URL, keywords, verification } from "@/lib/seo";
import RootShell from "@/components/RootShell";
import "../globals.css";

const uz = t("uz");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: uz.meta.title,
    template: "%s | MaxSavdo",
  },
  description: uz.meta.description,
  applicationName: "MaxSavdo",
  keywords: keywords("uz"),
  authors: [{ name: "MaxSavdo" }],
  verification,
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
    // og:image / twitter:image are injected by the `opengraph-image.tsx` and
    // `twitter-image.tsx` file conventions in this segment — listing them here
    // too would hardcode a URL whose build hash changes.
  },
  twitter: {
    card: "summary_large_image",
    title: uz.meta.ogTitle,
    description: uz.meta.ogDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: "#0B0B0F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export default function UzRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell lang="uz">{children}</RootShell>;
}
