import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { faqPageJsonLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import FaqList from "@/components/FaqList";
import FinalCta from "@/components/FinalCta";

const locale = "uz" as const;
const dict = t(locale);

const LANGUAGES = {
  uz: "/faq",
  ru: "/ru/faq",
  "x-default": "/faq",
};

export const metadata: Metadata = {
  // `absolute` bypasses the layout's "%s | MaxSavdo" template — the title below is
  // already the finished string and would otherwise get the brand appended twice.
  title: { absolute: dict.faqPage.title },
  description: dict.faqPage.description,
  alternates: {
    canonical: "/faq",
    languages: LANGUAGES,
  },
  openGraph: {
    type: "website",
    locale: "uz_UZ",
    url: "/faq",
    title: dict.faqPage.title,
    description: dict.faqPage.description,
  },
};

export const revalidate = 3600;

export default function FaqPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(faqPageJsonLd(dict, locale)),
        }}
      />
      <Header locale={locale} dict={dict} anchorBase="/" switchHref="/ru/faq" />
      <main className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <h1 className="text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {dict.faqPage.h1}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-brand-muted">
          {dict.faqPage.intro}
        </p>

        <FaqList title={dict.faq.title} items={dict.faq.items} headingLevel="h2" />
      </main>
      <FinalCta dict={dict.finalCta} ctaLabel={dict.hero.ctaPrimary} />
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
