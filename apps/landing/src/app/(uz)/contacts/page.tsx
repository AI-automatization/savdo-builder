import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import ContactsContent from "@/components/pages/ContactsContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.contactsPage.title,
  description: dict.contactsPage.subtitle,
  alternates: {
    canonical: "/contacts",
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
            staticPageJsonLd("uz", "/contacts", dict.contactsPage.title, dict.contactsPage.subtitle),
          ),
        }}
      />
      <ContactsContent locale="uz" dict={dict} />
    </>
  );
}
