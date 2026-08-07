import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import ContactsContent from "@/components/pages/ContactsContent";

const dict = t("ru");

export const metadata: Metadata = {
  title: dict.contactsPage.title,
  description: dict.contactsPage.subtitle,
  alternates: {
    canonical: "/ru/contacts",
    languages: { uz: "/contacts", ru: "/ru/contacts", "x-default": "/contacts" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("ru", "/ru/contacts", dict.contactsPage.title, dict.contactsPage.subtitle),
          ),
        }}
      />
      <ContactsContent locale="ru" dict={dict} />
    </>
  );
}
