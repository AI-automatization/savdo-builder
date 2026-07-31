import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import SupportContent from "@/components/pages/SupportContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.supportPage.title,
  description: dict.supportPage.subtitle,
  alternates: { canonical: "/support", languages: { uz: "/support", ru: "/ru/support" } },
};

export default function Page() {
  return <SupportContent locale="uz" dict={dict} />;
}
