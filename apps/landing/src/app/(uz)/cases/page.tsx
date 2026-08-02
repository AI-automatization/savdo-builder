import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import CasesContent from "@/components/pages/CasesContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.casesPage.title,
  description: dict.casesPage.subtitle,
  alternates: { canonical: "/cases", languages: { uz: "/cases", ru: "/ru/cases" } },
};

export default function Page() {
  return <CasesContent locale="uz" dict={dict} />;
}
