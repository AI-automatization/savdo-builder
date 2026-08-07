import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import CasesContent from "@/components/pages/CasesContent";

const dict = t("ru");

export const metadata: Metadata = {
  title: dict.casesPage.title,
  description: dict.casesPage.subtitle,
  alternates: {
    canonical: "/ru/cases",
    languages: { uz: "/cases", ru: "/ru/cases", "x-default": "/cases" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("ru", "/ru/cases", dict.casesPage.title, dict.casesPage.subtitle),
          ),
        }}
      />
      <CasesContent locale="ru" dict={dict} />
    </>
  );
}
