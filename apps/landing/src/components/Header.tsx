import Link from 'next/link';
import Image from 'next/image';

export type Locale = 'uz' | 'ru';

export type HeaderDict = {
  nav: {
    how: string;
    features: string;
    stores: string;
    pricing: string;
    faq: string;
    guides: string;
    start: string;
  };
};

type HeaderProps = {
  locale: Locale;
  dict: HeaderDict;
  /**
   * Where the section anchors point. Omitted on the homepage (plain `#how`).
   * On any sub-page it must be that locale's home path, otherwise `#how` resolves
   * against the current URL — `/faq#how` — and the link goes nowhere.
   */
  anchorBase?: string;
  /**
   * Target of the uz/ru switch. Defaults to the other locale's homepage; sub-pages
   * pass their own translated URL so switching language keeps you on the same page.
   */
  switchHref?: string;
};

const BOT_URL = 'https://t.me/maxsavdo_bot';

export default function Header({
  locale,
  dict,
  anchorBase = '',
  switchHref,
}: HeaderProps) {
  const otherLocale: Locale = locale === 'uz' ? 'ru' : 'uz';
  const otherHref = switchHref ?? (otherLocale === 'uz' ? '/' : '/ru');
  const guidesHref = locale === 'uz' ? '/qollanma' : '/ru/rukovodstva';
  const faqHref = locale === 'uz' ? '/faq' : '/ru/faq';

  return (
    <header
      className="sticky top-0 z-40 w-full"
      style={{
        background: 'rgba(15,15,15,0.70)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(232,165,82,0.12)',
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={locale === 'uz' ? '/' : '/ru'}
          className="flex items-center gap-2.5"
          aria-label="MaxSavdo"
        >
          <Image
            src="/logo-maxsavdo.svg"
            alt="MaxSavdo"
            width={36}
            height={36}
            priority
          />
          <span className="text-lg font-bold tracking-tight text-brand-text">
            MaxSavdo
          </span>
        </Link>

        <nav
          className="hidden items-center gap-7 text-sm text-brand-muted md:flex"
          aria-label="primary"
        >
          {[
            { href: `${anchorBase}#how`, label: dict.nav.how },
            { href: `${anchorBase}#features`, label: dict.nav.features },
            { href: `${anchorBase}#stores`, label: dict.nav.stores },
            { href: `${anchorBase}#pricing`, label: dict.nav.pricing },
            // Real URLs, not anchors: these two are crawlable pages of their own and
            // the internal links are what gets them discovered.
            { href: guidesHref, label: dict.nav.guides },
            { href: faqHref, label: dict.nav.faq },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="group relative transition-colors hover:text-brand-accent"
            >
              {item.label}
              <span
                aria-hidden
                className="absolute -bottom-1.5 left-1/2 h-px w-0 -translate-x-1/2 bg-brand-accent transition-all duration-200 group-hover:w-full"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={otherHref}
            className="rounded-lg border px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-muted transition-colors hover:text-brand-accent"
            style={{ borderColor: 'rgba(232,165,82,0.20)' }}
          >
            {otherLocale.toUpperCase()}
          </Link>

          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden rounded-xl px-4 py-2 text-sm font-semibold text-brand-bg transition-all hover:opacity-90 sm:inline-flex"
            style={{
              background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)',
              boxShadow: '0 4px 14px rgba(232,165,82,0.30)',
            }}
          >
            {dict.nav.start}
          </a>
        </div>
      </div>
    </header>
  );
}
