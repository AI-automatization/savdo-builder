'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';

export function HowItWorks() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const steps = [
    { n: '1', title: t('how.1.title'), body: t('how.1.body') },
    { n: '2', title: t('how.2.title'), body: t('how.2.body') },
    { n: '3', title: t('how.3.title'), body: t('how.3.body') },
  ];
  return (
    <section id="how" className="scroll-mt-20" style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{t('how.title')}</h2>
          <p className="mt-2 text-sm sm:text-base" style={{ color: colors.textMuted }}>{t('how.subtitle')}</p>
        </div>
        <div ref={ref} className="reveal grid gap-8 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold mb-4" style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}>
                {s.n}
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: colors.textPrimary }}>{s.title}</h3>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: colors.textMuted }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
