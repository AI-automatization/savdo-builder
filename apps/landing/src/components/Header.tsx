import Link from 'next/link';

export type Locale = 'uz' | 'ru';

export type HeaderDict = {
  nav: {
    features: string;
    pricing: string;
    faq: string;
  };
  cta: string;
};

type HeaderProps = {
  locale: Locale;
  dict: HeaderDict;
};

const BOT_URL = 'https://t.me/savdo_builderBOT';

export default function Header({ locale, dict }: HeaderProps) {
  const otherLocale: Locale = locale === 'uz' ? 'ru' : 'uz';
  const otherHref = otherLocale === 'uz' ? '/' : '/ru';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-brand-border bg-brand-bg/85 backdrop-blur-sm">
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={locale === 'uz' ? '/' : '/ru'}
          className="flex items-center gap-2"
          aria-label="MaxSavdo"
        >
          <span className="inline-block h-7 w-7 rounded-md bg-brand-accent" aria-hidden />
          <span className="text-lg font-semibold tracking-tight text-brand-text">
            MaxSavdo
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm text-brand-muted md:flex"
          aria-label="primary"
        >
          <a href="#features" className="transition-colors hover:text-brand-text">
            {dict.nav.features}
          </a>
          <a href="#pricing" className="transition-colors hover:text-brand-text">
            {dict.nav.pricing}
          </a>
          <a href="#faq" className="transition-colors hover:text-brand-text">
            {dict.nav.faq}
          </a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={otherHref}
            className="rounded-md border border-brand-border px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-muted transition-colors hover:border-brand-accent hover:text-brand-text"
            aria-label={`Switch language to ${otherLocale.toUpperCase()}`}
          >
            {otherLocale.toUpperCase()}
          </Link>

          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-lg bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-bg transition-colors hover:bg-brand-accentHover sm:inline-flex"
          >
            {dict.cta}
          </a>
        </div>
      </div>
    </header>
  );
}
