import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import AboutContent from "@/components/pages/AboutContent";

const dict = t("ru");

export const metadata: Metadata = {
  title: dict.about.title,
  description: dict.about.subtitle,
  alternates: {
    canonical: "/ru/about",
    languages: { uz: "/about", ru: "/ru/about", "x-default": "/about" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("ru", "/ru/about", dict.about.title, dict.about.subtitle),
          ),
        }}
      />
      <AboutContent locale="ru" dict={dict} />
    </>
  );
}
