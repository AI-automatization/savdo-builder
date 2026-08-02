import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import AboutContent from "@/components/pages/AboutContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.about.title,
  description: dict.about.subtitle,
  alternates: { canonical: "/about", languages: { uz: "/about", ru: "/ru/about" } },
};

export default function Page() {
  return <AboutContent locale="uz" dict={dict} />;
}
