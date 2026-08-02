import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { sortedBlogPosts } from "@/lib/blog-posts";
import { formatBlogDate } from "@/lib/format-date";

export default function BlogListContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.blogPage;
  const posts = sortedBlogPosts();
  const blogHref = (slug: string) => (locale === "uz" ? `/blog/${slug}` : `/ru/blog/${slug}`);

  return (
    <>
      <Header locale={locale} dict={dict} />
      <main>
        <section className="border-b border-brand-border py-16 sm:py-20">
          <div className="container-content text-center">
            <span className="inline-flex items-center rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-accent">
              {d.eyebrow}
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-brand-text sm:text-4xl lg:text-5xl text-balance">
              {d.title}
            </h1>
            <p className="mt-4 text-base text-brand-muted max-w-2xl mx-auto">{d.subtitle}</p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container-content max-w-3xl flex flex-col gap-5">
            {posts.map((p) => (
              <Link key={p.slug} href={blogHref(p.slug)} className="card-glass p-6 block transition-transform hover:-translate-y-0.5">
                <div className="flex items-center gap-3 mb-3 text-xs text-brand-muted">
                  <span className="px-2 py-0.5 rounded-full font-semibold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
                    {d.categories[p.category]}
                  </span>
                  <span>{formatBlogDate(p.date, locale)}</span>
                  <span>·</span>
                  <span>{p.readTime} {d.readTime}</span>
                </div>
                <h2 className="text-lg font-bold text-brand-text mb-2">{p.title[locale]}</h2>
                <p className="text-sm leading-relaxed text-brand-muted mb-3">{p.excerpt[locale]}</p>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent">
                  <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
