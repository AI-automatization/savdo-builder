'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';
import { ThemeToggle } from '@/components/theme-toggle';
import { LangToggle } from './LangToggle';
import { landingTrack } from '@/lib/landing/analytics';

const ANCHORS = [
  { href: '#how', key: 'nav.how' },
  { href: '#features', key: 'nav.features' },
  { href: '#pricing', key: 'nav.pricing' },
  { href: '#faq', key: 'nav.faq' },
] as const;

export function LandingHeader() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const primaryHref = isAuthenticated ? '/dashboard' : '/login';
  const primaryLabel = isAuthenticated ? t('nav.dashboard') : t('cta.create');

  return (
    <header
      className="sticky top-0 z-50 transition-colors"
      style={{
        background: scrolled ? colors.surface : 'transparent',
        borderBottom: `1px solid ${scrolled ? colors.border : 'transparent'}`,
        backdropFilter: scrolled ? 'saturate(120%) blur(8px)' : 'none',
      }}
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2" aria-label="maxsavdo">
          <MaxsavdoLogo size={32} />
          <span className="text-lg font-bold tracking-tight" style={{ color: colors.accent }}>maxsavdo</span>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} className="text-sm transition-colors hover:opacity-80" style={{ color: colors.textMuted }}>
              {t(a.key)}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <LangToggle />
          <ThemeToggle />
          {!isAuthenticated && (
            <Link href="/login" className="text-sm font-medium px-3 py-2 rounded-md transition-colors hover:opacity-80" style={{ color: colors.textPrimary }}>
              {t('nav.login')}
            </Link>
          )}
          <Link
            href={primaryHref}
            onClick={() => landingTrack('landing_cta_clicked', { place: 'header' })}
            className="text-sm font-bold px-4 py-2 rounded-md transition-opacity hover:opacity-90 active:scale-[0.98]"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {primaryLabel}
          </Link>
        </div>

        <button type="button" className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-md" aria-label="Меню" style={{ color: colors.textPrimary }} onClick={() => setOpen((v) => !v)}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden px-4 pb-4 flex flex-col gap-3" style={{ background: colors.surface, borderBottom: `1px solid ${colors.border}` }}>
          {ANCHORS.map((a) => (
            <a key={a.href} href={a.href} onClick={() => setOpen(false)} className="text-sm py-1" style={{ color: colors.textMuted }}>
              {t(a.key)}
            </a>
          ))}
          <div className="flex items-center gap-2 pt-2">
            <LangToggle />
            <ThemeToggle />
          </div>
          <Link href={primaryHref} onClick={() => { setOpen(false); landingTrack('landing_cta_clicked', { place: 'mobile-menu' }); }} className="text-sm font-bold px-4 py-2.5 rounded-md text-center" style={{ background: colors.accent, color: colors.accentTextOnBg }}>
            {primaryLabel}
          </Link>
        </div>
      )}
    </header>
  );
}
