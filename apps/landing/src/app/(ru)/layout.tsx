import type { Metadata, Viewport } from "next";
import { t } from "@/lib/i18n";
import { SITE_URL, keywords, verification } from "@/lib/seo";
import RootShell from "@/components/RootShell";
import "../globals.css";

const ru = t("ru");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  // `absolute` — the uz layout appends " | MaxSavdo" via a template; without
  // this the RU title rendered as "... | Бот + Сайт + Канал | MaxSavdo".
  title: { absolute: ru.meta.title },
  description: ru.meta.description,
  applicationName: "MaxSavdo",
  keywords: keywords("ru"),
  authors: [{ name: "MaxSavdo" }],
  verification,
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
    // See the uz layout: images come from the file conventions in `(ru)/ru/`.
  },
  twitter: {
    card: "summary_large_image",
    title: ru.meta.ogTitle,
    description: ru.meta.ogDescription,
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

export default function RuRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <RootShell lang="ru">{children}</RootShell>;
}
