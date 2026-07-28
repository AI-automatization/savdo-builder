'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X } from 'lucide-react';
import { buyerOrigin } from '@/lib/buyer-url';

export type Locale = 'uz' | 'ru';

export type HeaderDict = {
  nav: {
    features: string;
    pricing: string;
    faq: string;
    start: string;
    buyerCatalog: string;
  };
};

type HeaderProps = {
  locale: Locale;
  dict: HeaderDict;
};

const BOT_URL = 'https://t.me/savdo_builderBOT';

export default function Header({ locale, dict }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const otherLocale: Locale = locale === 'uz' ? 'ru' : 'uz';
  const otherHref = otherLocale === 'uz' ? '/' : '/ru';
  const home = locale === 'uz' ? '/' : '/ru';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className="sticky top-0 z-40 w-full transition-colors"
      style={{
        background: scrolled ? 'rgba(15,15,15,0.70)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: `1px solid ${scrolled ? 'rgba(232,165,82,0.12)' : 'transparent'}`,
      }}
    >
      <div className="mx-auto flex h-16 w-full max-w-content items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href={home} className="flex items-center gap-2.5" aria-label="MaxSavdo">
          <Image src="/logo-maxsavdo.svg" alt="MaxSavdo" width={36} height={36} priority />
          <span className="text-lg font-bold tracking-tight text-brand-text">MaxSavdo</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm text-brand-muted md:flex" aria-label="primary">
          <a href="#features" className="transition-colors hover:text-brand-accent">
            {dict.nav.features}
          </a>
          <a href="#pricing" className="transition-colors hover:text-brand-accent">
            {dict.nav.pricing}
          </a>
          <a href="#faq" className="transition-colors hover:text-brand-accent">
            {dict.nav.faq}
          </a>
          <a
            href={buyerOrigin()}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-brand-accent"
          >
            {dict.nav.buyerCatalog}
          </a>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
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
            className="inline-flex rounded-xl px-4 py-2 text-sm font-semibold text-brand-bg transition-all hover:opacity-90"
            style={{
              background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)',
              boxShadow: '0 4px 14px rgba(232,165,82,0.30)',
            }}
          >
            {dict.nav.start}
          </a>
        </div>

        <button
          type="button"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md text-brand-text md:hidden"
          aria-label="Menu"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div
          className="flex flex-col gap-3 px-4 pb-4 md:hidden"
          style={{ background: 'rgba(15,15,15,0.92)', borderBottom: '1px solid rgba(232,165,82,0.12)' }}
        >
          <a href="#features" className="py-1 text-sm text-brand-muted" onClick={() => setOpen(false)}>
            {dict.nav.features}
          </a>
          <a href="#pricing" className="py-1 text-sm text-brand-muted" onClick={() => setOpen(false)}>
            {dict.nav.pricing}
          </a>
          <a href="#faq" className="py-1 text-sm text-brand-muted" onClick={() => setOpen(false)}>
            {dict.nav.faq}
          </a>
          <a
            href={buyerOrigin()}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1 text-sm text-brand-muted"
            onClick={() => setOpen(false)}
          >
            {dict.nav.buyerCatalog}
          </a>
          <div className="flex items-center gap-2 pt-2">
            <Link
              href={otherHref}
              className="rounded-lg border px-2.5 py-1 text-xs font-medium uppercase tracking-wide text-brand-muted"
              style={{ borderColor: 'rgba(232,165,82,0.20)' }}
            >
              {otherLocale.toUpperCase()}
            </Link>
          </div>
          <a
            href={BOT_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 rounded-xl px-4 py-2.5 text-center text-sm font-semibold text-brand-bg"
            style={{ background: 'linear-gradient(135deg, #E8A552 0%, #D4922E 100%)' }}
            onClick={() => setOpen(false)}
          >
            {dict.nav.start}
          </a>
        </div>
      )}
    </header>
  );
}
