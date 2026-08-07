import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import SupportContent from "@/components/pages/SupportContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.supportPage.title,
  description: dict.supportPage.subtitle,
  alternates: {
    canonical: "/support",
    languages: { uz: "/support", ru: "/ru/support", "x-default": "/support" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("uz", "/support", dict.supportPage.title, dict.supportPage.subtitle),
          ),
        }}
      />
      <SupportContent locale="uz" dict={dict} />
    </>
  );
}
