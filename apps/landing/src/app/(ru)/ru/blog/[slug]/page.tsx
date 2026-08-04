import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import { blogPostJsonLd } from "@/lib/jsonld";
import BlogPostContent from "@/components/pages/BlogPostContent";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog-posts";

const dict = t("ru");

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "404" };
  return {
    title: post.title.ru,
    description: post.excerpt.ru,
    alternates: {
      canonical: `/ru/blog/${slug}`,
      languages: { uz: `/blog/${slug}`, ru: `/ru/blog/${slug}`, "x-default": `/blog/${slug}` },
    },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogPostJsonLd("ru", slug, post.title.ru, post.excerpt.ru, post.date),
          ),
        }}
      />
      <BlogPostContent locale="ru" dict={dict} post={post} />
    </>
  );
}
