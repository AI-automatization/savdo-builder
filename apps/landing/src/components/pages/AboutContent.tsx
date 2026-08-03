import { ShieldCheck, Sparkles, Send } from "lucide-react";
import type { Locale } from "@/lib/i18n";
import type { Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ICONS = [ShieldCheck, Sparkles, Send];

export default function AboutContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.about;

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
          <div className="container-content grid gap-10 sm:grid-cols-2">
            <div>
              <h2 className="text-xl font-bold text-brand-text mb-3">{d.missionTitle}</h2>
              <p className="text-sm leading-relaxed text-brand-muted">{d.missionBody}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-text mb-3">{d.storyTitle}</h2>
              <p className="text-sm leading-relaxed text-brand-muted">{d.storyBody}</p>
            </div>
          </div>

          <div className="container-content mt-14 grid gap-4 sm:grid-cols-3">
            {d.stats.map((s) => (
              <div key={s.label} className="card-glass p-6 text-center">
                <div className="text-3xl font-bold text-brand-accent">{s.value}</div>
                <div className="mt-1.5 text-xs text-brand-muted">{s.label}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-brand-border bg-brand-surface/40 py-16 sm:py-20">
          <div className="container-content">
            <h2 className="text-2xl font-bold text-brand-text text-center mb-10">{d.valuesTitle}</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {d.values.map((v, i) => {
                const Icon = ICONS[i % ICONS.length];
                return (
                  <div key={v.title} className="card-glass p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/10 border border-brand-accent/30">
                      <Icon size={20} className="text-brand-accent" aria-hidden />
                    </div>
                    <h3 className="text-base font-bold text-brand-text mb-1.5">{v.title}</h3>
                    <p className="text-sm leading-relaxed text-brand-muted">{v.body}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="py-16 sm:py-20 text-center">
          <div className="container-content max-w-2xl">
            <h2 className="text-xl font-bold text-brand-text mb-3">{d.parentTitle}</h2>
            <p className="text-sm leading-relaxed text-brand-muted">{d.parentBody}</p>
          </div>
        </section>

        <section className="pb-20">
          <div className="container-content max-w-2xl text-center">
            <div className="card-glass-highlight p-10">
              <h2 className="text-2xl font-bold text-brand-text mb-2">{d.ctaTitle}</h2>
              <p className="text-sm text-brand-muted mb-6">{d.ctaBody}</p>
              <a
                href="https://t.me/maxsavdo_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
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
