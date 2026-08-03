import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import HowItWorksContent from "@/components/pages/HowItWorksContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.howPage.title,
  description: dict.howPage.subtitle,
  alternates: { canonical: "/how-it-works", languages: { uz: "/how-it-works", ru: "/ru/how-it-works" } },
};

export default function Page() {
  return <HowItWorksContent locale="uz" dict={dict} />;
}
