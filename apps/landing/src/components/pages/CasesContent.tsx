"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { CASES } from "@/lib/cases-data";

function CaseCard({ c, locale, dict }: { c: (typeof CASES)[number]; locale: Locale; dict: Dict["casesPage"] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="card-glass overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left">
        <div className="flex flex-col sm:flex-row gap-0 sm:gap-5">
          <div className="relative h-44 sm:h-auto sm:w-56 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.cover} alt={c.storeName} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 p-5 sm:pl-0">
            <div className="flex items-center justify-between gap-3 mb-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 bg-brand-accent/10 border border-brand-accent/30 text-brand-accent">
                  {c.initial}
                </div>
                <div>
                  <div className="text-sm font-bold text-brand-text">{c.storeName}</div>
                  <div className="text-xs text-brand-muted">{c.niche[locale]}</div>
                </div>
              </div>
              <ChevronDown size={20} className="shrink-0 text-brand-muted transition-transform" style={{ transform: open ? "rotate(180deg)" : "none" }} />
            </div>
            <p className="mt-3 text-sm italic leading-relaxed text-brand-muted">&laquo;{c.quote[locale]}&raquo;</p>
            <div className="mt-4 grid grid-cols-3 gap-3 max-w-sm">
              <div>
                <div className="text-sm font-bold text-brand-accent">{c.ordersPerMonth}</div>
                <div className="text-[11px] text-brand-muted">{dict.metricOrders}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-brand-accent">{c.launchTime}</div>
                <div className="text-[11px] text-brand-muted">{dict.metricTime}</div>
              </div>
              <div>
                <div className="text-sm font-bold text-brand-accent">{c.repeatRate}</div>
                <div className="text-[11px] text-brand-muted">{dict.metricRepeat}</div>
              </div>
            </div>
            <div className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-accent">{dict.readMore}</div>
          </div>
        </div>
      </button>
      {open && (
        <div className="px-5 pb-6 sm:pl-[15.5rem] flex flex-col gap-3">
          <h3 className="text-base font-bold text-brand-text mb-1">{c.title[locale]}</h3>
          {c.body[locale].map((p) => (
            <p key={p.slice(0, 24)} className="text-sm leading-relaxed text-brand-muted">{p}</p>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CasesContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.casesPage;

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
            <p className="mt-3 text-xs text-brand-muted/70 max-w-xl mx-auto">{d.note}</p>
          </div>
        </section>

        <section className="py-16 sm:py-20">
          <div className="container-content max-w-4xl flex flex-col gap-5">
            {CASES.map((c) => (
              <CaseCard key={c.slug} c={c} locale={locale} dict={d} />
            ))}
          </div>
        </section>

        <section className="pb-20">
          <div className="container-content max-w-2xl text-center">
            <div className="card-glass-highlight p-10">
              <h2 className="text-2xl font-bold text-brand-text mb-2">{d.ctaTitle}</h2>
              <p className="text-sm text-brand-muted mb-6">{d.ctaBody}</p>
              <a href="https://t.me/maxsavdo_bot" target="_blank" rel="noopener noreferrer" className="btn-primary">
                {dict.hero.ctaPrimary}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
