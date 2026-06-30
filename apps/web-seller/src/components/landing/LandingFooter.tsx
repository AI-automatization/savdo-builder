'use client';

import Link from 'next/link';
import { Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';
import { buyerOrigin } from '@/lib/buyer-url';
import { LangToggle } from './LangToggle';

export function LandingFooter() {
  const { t } = useTranslation();
  const origin = buyerOrigin();
  return (
    <footer style={{ background: colors.surface, borderTop: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 grid gap-8 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2 mb-3">
            <MaxsavdoLogo size={28} />
            <span className="text-base font-bold" style={{ color: colors.accent }}>maxsavdo</span>
          </Link>
          <p className="text-xs max-w-xs" style={{ color: colors.textMuted }}>{t('footer.tagline')}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>{t('footer.legal')}</p>
          <ul className="flex flex-col gap-2 text-sm">
            <li><a href={`${origin}/offer`} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.offer')}</a></li>
            <li><a href={`${origin}/privacy`} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.privacy')}</a></li>
            <li><a href={`${origin}/terms`} className="hover:opacity-80" style={{ color: colors.textMuted }}>{t('footer.terms')}</a></li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: colors.textDim }}>{t('footer.contact')}</p>
          <a href="https://t.me/maxsavdo_bot" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm hover:opacity-80" style={{ color: colors.info }}>
            <Send size={16} /> @maxsavdo_bot
          </a>
          <div className="mt-4"><LangToggle /></div>
        </div>
      </div>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-4 text-xs" style={{ color: colors.textDim, borderTop: `1px solid ${colors.border}` }}>
        {t('footer.rights')}
      </div>
    </footer>
  );
}
