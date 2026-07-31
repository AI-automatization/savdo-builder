import Link from "next/link";
import { Check, X, ArrowRight } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function HowItWorksContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.howPage;
  const faqHref = locale === "uz" ? "/faq" : "/ru/faq";

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
            <div className="flex flex-col gap-8">
              {d.steps.map((s, i) => (
                <div key={s.n} className="flex gap-5">
                  <div className="flex flex-col items-center shrink-0">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-brand-accent/30 bg-brand-accent/10 text-base font-bold text-brand-accent">
                      {s.n}
                    </div>
                    {i < d.steps.length - 1 && <div className="mt-2 w-px flex-1 bg-brand-border" />}
                  </div>
                  <div className="pb-2">
                    <h3 className="text-base font-bold text-brand-text mb-1.5">{s.title}</h3>
                    <p className="text-sm leading-relaxed text-brand-muted">{s.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-brand-border bg-brand-surface/40 py-16 sm:py-20">
          <div className="container-content max-w-3xl">
            <h2 className="text-2xl font-bold text-brand-text text-center mb-10">{d.compareTitle}</h2>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="card-glass p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-muted mb-4">{d.beforeTitle}</h3>
                <ul className="flex flex-col gap-3">
                  {d.before.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-brand-muted">
                      <X size={16} className="shrink-0 mt-0.5 text-red-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card-glass-highlight p-6">
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-accent mb-4">{d.afterTitle}</h3>
                <ul className="flex flex-col gap-3">
                  {d.after.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm font-medium text-brand-text">
                      <Check size={16} className="shrink-0 mt-0.5 text-emerald-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 text-center">
          <h2 className="text-xl font-bold text-brand-text mb-4">{d.faqTeaserTitle}</h2>
          <Link href={faqHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:opacity-80">
            {d.faqTeaserCta} <ArrowRight size={16} />
          </Link>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
