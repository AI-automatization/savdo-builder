import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import CasesContent from "@/components/pages/CasesContent";

const dict = t("ru");

export const metadata: Metadata = {
  title: dict.casesPage.title,
  description: dict.casesPage.subtitle,
  alternates: { canonical: "/ru/cases", languages: { uz: "/cases", ru: "/ru/cases" } },
};

export default function Page() {
  return <CasesContent locale="ru" dict={dict} />;
}
