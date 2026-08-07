import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import { staticPageJsonLd } from "@/lib/jsonld";
import BlogListContent from "@/components/pages/BlogListContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.blogPage.title,
  description: dict.blogPage.subtitle,
  alternates: {
    canonical: "/blog",
    languages: { uz: "/blog", ru: "/ru/blog", "x-default": "/blog" },
  },
};

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            staticPageJsonLd("uz", "/blog", dict.blogPage.title, dict.blogPage.subtitle),
          ),
        }}
      />
      <BlogListContent locale="uz" dict={dict} />
    </>
  );
}
