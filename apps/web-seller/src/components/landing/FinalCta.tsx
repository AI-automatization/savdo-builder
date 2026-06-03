'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuth } from '@/lib/auth/context';
import { colors } from '@/lib/styles';
import { landingTrack } from '@/lib/landing/analytics';

export function FinalCta() {
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <div className="relative overflow-hidden rounded-2xl p-10 sm:p-16 text-center" style={{ background: colors.accent }}>
        <h2 className="text-3xl sm:text-4xl font-bold" style={{ color: colors.accentTextOnBg }}>{t('final.title')}</h2>
        <p className="mt-3 text-sm sm:text-base opacity-90" style={{ color: colors.accentTextOnBg }}>{t('final.subtitle')}</p>
        <Link
          href={isAuthenticated ? '/dashboard' : '/login'}
          onClick={() => landingTrack('landing_cta_clicked', { place: 'final' })}
          className="inline-flex items-center gap-2 mt-7 px-7 py-3 rounded-md text-sm font-bold transition-transform hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: colors.bg, color: colors.textPrimary }}
        >
          {t('cta.createFree')} <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}
