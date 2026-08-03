import { Send, Mail } from "lucide-react";
import type { Locale, Dict } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ContactForm from "@/components/ContactForm";

const ICONS = [Send, Mail];
const HREFS = ["https://t.me/maxsavdo_bot", "mailto:hello@maxsavdo.uz"];

export default function ContactsContent({ locale, dict }: { locale: Locale; dict: Dict }) {
  const d = dict.contactsPage;

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
          <div className="container-content grid gap-10 lg:grid-cols-[1fr_1.2fr]">
            <div className="flex flex-col gap-4">
              {d.channels.map((c, i) => {
                const Icon = ICONS[i];
                return (
                  <a
                    key={c.title}
                    href={HREFS[i]}
                    target={HREFS[i].startsWith("http") ? "_blank" : undefined}
                    rel={HREFS[i].startsWith("http") ? "noopener noreferrer" : undefined}
                    className="card-glass p-5 block transition-transform hover:-translate-y-0.5"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-accent/10 border border-brand-accent/30">
                      <Icon size={18} className="text-brand-accent" aria-hidden />
                    </div>
                    <h3 className="text-sm font-bold text-brand-text mb-1">{c.title}</h3>
                    <p className="text-xs text-brand-muted mb-2 leading-relaxed">{c.body}</p>
                    <p className="text-sm font-semibold text-brand-accent">{c.value}</p>
                  </a>
                );
              })}
            </div>

            <div className="card-glass p-6 sm:p-8">
              <h2 className="text-lg font-bold text-brand-text mb-5">{d.formTitle}</h2>
              <ContactForm dict={d} />
            </div>
          </div>
        </section>
      </main>
      <Footer locale={locale} dict={dict.footer} nav={dict.nav} />
    </>
  );
}
