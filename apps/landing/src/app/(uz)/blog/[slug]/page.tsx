import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { t } from "@/lib/i18n";
import BlogPostContent from "@/components/pages/BlogPostContent";
import { getBlogPost, BLOG_POSTS } from "@/lib/blog-posts";

const dict = t("uz");

export function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "404" };
  return {
    title: post.title.uz,
    description: post.excerpt.uz,
    alternates: { canonical: `/blog/${slug}`, languages: { uz: `/blog/${slug}`, ru: `/ru/blog/${slug}` } },
  };
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();
  return <BlogPostContent locale="uz" dict={dict} post={post} />;
}
