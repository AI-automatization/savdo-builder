import Link from 'next/link';
import { MaxsavdoLogo } from '@/components/MaxsavdoLogo';
import { Send, Mail } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type FooterDict = {
  tagline: string;
  rights: string;
  contact: string;
  bot: string;
  resources: string;
  legal: {
    offer: string;
    privacy: string;
    terms: string;
  };
};

type FooterProps = {
  locale: Locale;
  dict: FooterDict;
  nav: {
    cases: string;
    blog: string;
    about: string;
    contacts: string;
    support: string;
    faq: string;
  };
};

const BOT_URL = 'https://t.me/maxsavdo_bot';
const EMAIL = 'hello@maxsavdo.uz';

export default function Footer({ locale, dict, nav }: FooterProps) {
  const year = new Date().getFullYear();
  const home = locale === 'uz' ? '/' : '/ru';
  const p = (path: string) => (locale === 'uz' ? `/${path}` : `/ru/${path}`);
  // Sitewide links to the content pages. A page reachable only from the sitemap gets
  // crawled late and treated as peripheral; a footer link on every page does not.
  // The guides slug differs per locale (qollanma / rukovodstva), so `p()` can't build it.
  const guidesHref = locale === 'uz' ? '/qollanma' : '/ru/rukovodstva';
  const guidesLabel = locale === 'uz' ? 'Qoʻllanmalar' : 'Руководства';

  return (
    <footer
      className="mt-4"
      style={{
        borderTop: '1px solid rgba(232,165,82,0.12)',
        background: 'var(--color-footer-bg)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 sm:px-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:px-8">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href={home} className="flex items-center gap-2.5" aria-label="MaxSavdo">
            <MaxsavdoLogo size={34} />
            <span className="text-lg font-bold tracking-tight text-brand-text">MaxSavdo</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-muted">
            {dict.tagline}
          </p>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {nav.about}
          </h4>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li><Link href={p('about')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.about}</Link></li>
            <li><Link href={p('cases')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.cases}</Link></li>
            <li><Link href={p('blog')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.blog}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {nav.support}
          </h4>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li><Link href={guidesHref} className="text-brand-muted transition-colors hover:text-brand-accent">{guidesLabel}</Link></li>
            <li><Link href={p('faq')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.faq}</Link></li>
            <li><Link href={p('support')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.support}</Link></li>
            <li><Link href={p('contacts')} className="text-brand-muted transition-colors hover:text-brand-accent">{nav.contacts}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {dict.contact}
          </h4>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a
                href={BOT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-muted transition-colors hover:text-brand-accent"
              >
                <Send size={15} aria-hidden /> {dict.bot}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 text-brand-muted transition-colors hover:text-brand-accent"
              >
                <Mail size={15} aria-hidden /> {EMAIL}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(232,165,82,0.08)' }}>
        <div className="mx-auto flex w-full max-w-content flex-col items-center justify-between gap-3 px-4 py-5 text-xs text-brand-muted sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} MaxSavdo. {dict.rights}</span>
          {/*
            Legal entity + terms live on web-buyer (apps/web-buyer/src/app/{offer,privacy,terms})
            but were never linked from the marketing site — a visitor evaluating
            trust had no path to them from here (2026-08-06 E-E-A-T audit).
          */}
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
            <a href="https://shop.maxsavdo.uz/offer" className="transition-colors hover:text-brand-accent">{dict.legal.offer}</a>
            <a href="https://shop.maxsavdo.uz/privacy" className="transition-colors hover:text-brand-accent">{dict.legal.privacy}</a>
            <a href="https://shop.maxsavdo.uz/terms" className="transition-colors hover:text-brand-accent">{dict.legal.terms}</a>
          </div>
          <span style={{ color: 'rgba(232,165,82,0.40)' }}>Made in Uzbekistan 🇺🇿</span>
        </div>
      </div>
    </footer>
  );
}
