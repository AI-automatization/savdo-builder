import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import FaqPageContent from "@/components/pages/FaqPageContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.faqPage.title,
  description: dict.faqPage.subtitle,
  alternates: { canonical: "/faq", languages: { uz: "/faq", ru: "/ru/faq" } },
};

export default function Page() {
  return <FaqPageContent locale="uz" dict={dict} />;
}
