"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

function FaqGroup({ title, items }: { title: string; items: { q: string; a: string }[] }) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="mb-10 last:mb-0">
      <h2 className="text-sm font-bold uppercase tracking-wider text-brand-accent mb-4">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((it, idx) => {
          const open = openIdx === idx;
          return (
            <li key={it.q} className={open ? "card-glass-highlight" : "card-glass"} style={{ overflow: "hidden" }}>
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIdx(open ? null : idx)}
                className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-semibold text-brand-text"
              >
                <span>{it.q}</span>
                <ChevronDown
                  size={18}
                  aria-hidden
                  className="shrink-0 text-brand-muted transition-transform"
                  style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
                />
              </button>
              {open && (
                <div className="px-5 pb-4 pt-0 text-sm leading-relaxed text-brand-muted border-t border-brand-accent/15">
                  {it.a}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default function FaqPageContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  // Renamed during the main→SEO-branch merge: `faqPage` now belongs to the routed
  // /faq page (FaqList + FAQPage JSON-LD). This categorised copy is kept because it
  // carries five questions that list does not — see LANDING-FAQ-CONTENT-MERGE-001.
  const d = dict.faqCategories;
  const supportHref = locale === "uz" ? "/support" : "/ru/support";

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
          <div className="container-content max-w-2xl">
            {d.categories.map((cat) => (
              <FaqGroup key={cat.title} title={cat.title} items={cat.items} />
            ))}
            <div className="mt-4 text-center">
              <Link href={supportHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:opacity-80">
                {d.cta} →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
