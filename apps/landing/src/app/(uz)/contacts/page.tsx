import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import ContactsContent from "@/components/pages/ContactsContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.contactsPage.title,
  description: dict.contactsPage.subtitle,
  alternates: { canonical: "/contacts", languages: { uz: "/contacts", ru: "/ru/contacts" } },
};

export default function Page() {
  return <ContactsContent locale="uz" dict={dict} />;
}
