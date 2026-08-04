import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import HowItWorksContent from "@/components/pages/HowItWorksContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.howPage.title,
  description: dict.howPage.subtitle,
  alternates: {
    canonical: "/how-it-works",
    languages: { uz: "/how-it-works", ru: "/ru/how-it-works", "x-default": "/how-it-works" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("uz", "/how-it-works", dict.howPage.title, dict.howPage.subtitle),
          ),
        }}
      />
      <HowItWorksContent locale="uz" dict={dict} />
    </>
  );
}
