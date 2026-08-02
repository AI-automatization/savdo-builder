import type { Metadata } from "next";
import { t } from "@/lib/i18n";
import BlogListContent from "@/components/pages/BlogListContent";

const dict = t("uz");

export const metadata: Metadata = {
  title: dict.blogPage.title,
  description: dict.blogPage.subtitle,
  alternates: { canonical: "/blog", languages: { uz: "/blog", ru: "/ru/blog" } },
};

export default function Page() {
  return <BlogListContent locale="uz" dict={dict} />;
}
