import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { BlogPost } from "@/lib/blog-posts";
import { formatBlogDate } from "@/lib/format-date";

export default function BlogPostContent({ locale, dict, post }: { locale: Locale; dict: Dict; post: BlogPost }) {
  const d = dict.blogPage;
  const blogHref = locale === "uz" ? "/blog" : "/ru/blog";

  return (
    <>
      <Header locale={locale} dict={dict} />
      <main>
        <article className="container-content max-w-2xl py-16 sm:py-20">
          <Link href={blogHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent mb-8 hover:opacity-80">
            <ArrowLeft size={16} /> {d.backToBlog}
          </Link>

          <div className="flex items-center gap-3 mb-4 text-xs text-brand-muted">
            <span className="px-2 py-0.5 rounded-full font-semibold bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
              {d.categories[post.category]}
            </span>
            <span>{d.publishedOn} {formatBlogDate(post.date, locale)}</span>
            <span>·</span>
            <span>{post.readTime} {d.readTime}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold text-brand-text mb-8 text-balance">{post.title[locale]}</h1>

          <div className="flex flex-col gap-4">
            {post.body[locale].map((p) => (
              <p key={p.slice(0, 24)} className="text-sm sm:text-base leading-relaxed text-brand-muted">{p}</p>
            ))}
          </div>

          <div className="card-glass mt-14 p-8 text-center">
            <h2 className="text-lg font-bold text-brand-text mb-2">{d.ctaTitle}</h2>
            <p className="text-sm text-brand-muted mb-5">{d.ctaBody}</p>
            <a href="https://t.me/maxsavdo_bot" target="_blank" rel="noopener noreferrer" className="btn-primary">
              {dict.hero.ctaPrimary}
            </a>
          </div>
        </article>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
