import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/i18n";
import { guideAlternates, getGuide, guidePath, guides } from "@/lib/guides";
import { guideJsonLd } from "@/lib/jsonld";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GuideBody from "@/components/GuideBody";
import FaqList from "@/components/FaqList";
import FinalCta from "@/components/FinalCta";

const locale = "ru" as const;
const dict = t(locale);

type PageProps = {
  // Next 15: params is a Promise and must be awaited.
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return guides[locale].map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(locale, slug);

  if (!guide) {
    return { title: { absolute: "404" }, robots: { index: false, follow: false } };
  }

  const path = guidePath(locale, guide.slug);

  return {
    title: { absolute: guide.title },
    description: guide.description,
    alternates: {
      canonical: path,
      languages: guideAlternates(guide.key),
    },
    openGraph: {
      type: "article",
      locale: "ru_RU",
      url: path,
      title: guide.title,
      description: guide.description,
      modifiedTime: guide.updated,
    },
  };
}

export const revalidate = 3600;

export default async function RuGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getGuide(locale, slug);

  if (!guide) {
    notFound();
  }

  const uzTwin = guides.uz.find((g) => g.key === guide.key);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(guideJsonLd(dict, locale, guide)),
        }}
      />
      <Header
        locale={locale}
        dict={dict}
        anchorBase="/ru"
        switchHref={uzTwin ? guidePath("uz", uzTwin.slug) : "/"}
      />
      <main>
        <GuideBody guide={guide} updatedLabel={dict.guidesPage.updatedLabel} />

        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6 lg:px-8">
          <FaqList title={dict.faq.title} items={guide.faq} />

          <Link
            href="/ru/rukovodstva"
            className="mt-12 inline-flex items-center gap-1.5 text-sm font-medium text-brand-accent"
          >
            <ArrowLeft size={15} aria-hidden />
            {dict.guidesPage.backLabel}
          </Link>
        </div>
      </main>
      <FinalCta dict={dict.finalCta} ctaLabel={dict.hero.ctaPrimary} />
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
