import Link from "next/link";
import { Send, Clock, ArrowRight } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

export default function SupportContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.supportPage;
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
          <div className="container-content max-w-4xl">
            <div className="grid gap-5 sm:grid-cols-2 mb-14">
              <div className="card-glass p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-accent/10 border border-brand-accent/30">
                  <Clock size={20} className="text-brand-accent" aria-hidden />
                </div>
                <div className="text-2xl font-bold text-brand-accent">{d.responseValue}</div>
                <h3 className="text-sm font-bold text-brand-text mt-1">{d.responseTitle}</h3>
                <p className="text-xs text-brand-muted mt-1">{d.responseBody}</p>
              </div>
              <div className="card-glass-highlight p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-bg border border-brand-accent/30">
                  <Send size={20} className="text-brand-accent" aria-hidden />
                </div>
                <h3 className="text-sm font-bold text-brand-text mb-1">{d.channelTitle}</h3>
                <p className="text-xs text-brand-muted mb-4">{d.channelBody}</p>
                <a href="https://t.me/maxsavdo_bot" target="_blank" rel="noopener noreferrer" className="btn-primary">
                  <Send size={15} /> {d.channelCta}
                </a>
              </div>
            </div>

            <div className="mb-14">
              <h2 className="text-lg font-bold text-brand-text mb-5">{d.issuesTitle}</h2>
              <div className="flex flex-col gap-3">
                {d.issues.map((it) => (
                  <div key={it.title} className="card-glass p-5">
                    <h3 className="text-sm font-bold text-brand-text mb-1.5">{it.title}</h3>
                    <p className="text-sm leading-relaxed text-brand-muted">{it.body}</p>
                  </div>
                ))}
              </div>
              <div className="mt-6">
                <Link href={faqHref} className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-accent hover:opacity-80">
                  {d.faqLink} <ArrowRight size={15} />
                </Link>
              </div>
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-lg font-bold text-brand-text mb-5">{d.formTitle}</h2>
              <ContactForm dict={dict.contactsPage} />
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
