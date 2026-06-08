import Link from 'next/link';
import { Send, Mail } from 'lucide-react';

export type Locale = 'uz' | 'ru';

export type FooterDict = {
  tagline: string;
  productHeading: string;
  productLinks: { label: string; href: string }[];
  contactHeading: string;
  channelLabel: string;
  emailLabel: string;
  rights: string;
};

type FooterProps = {
  locale: Locale;
  dict: FooterDict;
};

const TG_CHANNEL = 'https://t.me/savdobuilder';
const EMAIL = 'hello@maxsavdo.uz';

export default function Footer({ locale, dict }: FooterProps) {
  const year = new Date().getFullYear();
  const home = locale === 'uz' ? '/' : '/ru';

  return (
    <footer className="border-t border-brand-border bg-brand-bg">
      <div className="mx-auto grid w-full max-w-content gap-10 px-4 py-14 sm:px-6 lg:grid-cols-3 lg:gap-12 lg:px-8">
        {/* Brand */}
        <div>
          <Link href={home} className="flex items-center gap-2" aria-label="MaxSavdo">
            <span className="inline-block h-7 w-7 rounded-md bg-brand-accent" aria-hidden />
            <span className="text-lg font-semibold text-brand-text">MaxSavdo</span>
          </Link>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-brand-muted">
            {dict.tagline}
          </p>
        </div>

        {/* Product links */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {dict.productHeading}
          </h4>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            {dict.productLinks.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  className="text-brand-text transition-colors hover:text-brand-accent"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacts */}
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
            {dict.contactHeading}
          </h4>
          <ul className="mt-4 flex flex-col gap-3 text-sm">
            <li>
              <a
                href={TG_CHANNEL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-brand-text transition-colors hover:text-brand-accent"
              >
                <Send size={16} aria-hidden /> {dict.channelLabel}
              </a>
            </li>
            <li>
              <a
                href={`mailto:${EMAIL}`}
                className="inline-flex items-center gap-2 text-brand-text transition-colors hover:text-brand-accent"
              >
                <Mail size={16} aria-hidden /> {dict.emailLabel}
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-brand-border">
        <div className="mx-auto flex w-full max-w-content flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-brand-muted sm:flex-row sm:px-6 lg:px-8">
          <span>© {year} MaxSavdo. {dict.rights}</span>
          <span>Made in Uzbekistan</span>
        </div>
      </div>
    </footer>
  );
}
