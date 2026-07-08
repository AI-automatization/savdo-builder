'use client';

import { Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';

// Тонкая полоска соцпруфа: честный рыночный факт (без фейк-счётчиков) +
// founding-бета. Закрывает разрыв с qlay (у них «250+ магазинов»), но мы
// в бете — поэтому опираемся на факт рынка, а не на выдуманные цифры.
export function SocialProof() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-4">
      <div
        ref={ref}
        className="reveal rounded-2xl px-5 py-4 sm:px-8 sm:py-5 flex flex-col sm:flex-row items-center gap-4 sm:gap-8 justify-center text-center sm:text-left"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl sm:text-4xl font-bold tracking-tight" style={{ color: colors.accent }}>
            {t('proof.statValue')}
          </span>
          <span className="text-sm sm:text-base max-w-[15rem]" style={{ color: colors.textMuted }}>
            {t('proof.statLabel')}
          </span>
        </div>
        <div className="hidden sm:block self-stretch w-px" style={{ background: colors.border }} />
        <div className="flex items-center gap-2">
          <Sparkles size={18} style={{ color: colors.accent }} />
          <span className="text-sm" style={{ color: colors.textPrimary }}>
            <span className="font-semibold">{t('proof.betaTitle')}</span>
            <span style={{ color: colors.textMuted }}> — {t('proof.betaDesc')}</span>
          </span>
        </div>
      </div>
    </section>
  );
}
