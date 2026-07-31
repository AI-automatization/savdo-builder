import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import ContactsContent from "@/components/pages/ContactsContent";

const dict = t("ru");

export const metadata: Metadata = {
  title: dict.contactsPage.title,
  description: dict.contactsPage.subtitle,
  alternates: { canonical: "/ru/contacts", languages: { uz: "/contacts", ru: "/ru/contacts" } },
};

export default function Page() {
  return <ContactsContent locale="ru" dict={dict} />;
}
