import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { guides } from "@/lib/guides";
import { guidesIndexJsonLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuideList from "@/components/GuideList";
import FinalCta from "@/components/FinalCta";

const locale = "uz" as const;
const dict = t(locale);
const list = guides[locale];

const LANGUAGES = {
  uz: "/qollanma",
  ru: "/ru/rukovodstva",
  "x-default": "/qollanma",
};

export const metadata: Metadata = {
  title: { absolute: dict.guidesPage.title },
  description: dict.guidesPage.description,
  alternates: {
    canonical: "/qollanma",
    languages: LANGUAGES,
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/qollanma",
    title: dict.guidesPage.title,
    description: dict.guidesPage.description,
  },
};

export const revalidate = 3600;

export default function GuidesIndexPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guidesIndexJsonLd(dict, locale, list)),
        }}
      />
      <Header
        locale={locale}
        dict={dict}
        anchorBase="/"
        switchHref="/ru/rukovodstva"
      />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {dict.guidesPage.h1}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-muted">
          {dict.guidesPage.intro}
        </p>

        <GuideList
          locale={locale}
          guides={list}
          readMore={dict.guidesPage.readMore}
          updatedLabel={dict.guidesPage.updatedLabel}
        />
      </main>
      <FinalCta dict={dict.finalCta} ctaLabel={dict.hero.ctaPrimary} />
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
