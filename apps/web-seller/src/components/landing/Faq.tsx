'use client';

import { ChevronDown } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';

export function Faq() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const items = [1, 2, 3, 4, 5, 6].map((n) => ({ q: t(`faq.${n}.q`), a: t(`faq.${n}.a`) }));
  return (
    <section id="faq" className="scroll-mt-20" style={{ background: colors.surface, borderTop: `1px solid ${colors.border}`, borderBottom: `1px solid ${colors.border}` }}>
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-16 sm:py-20">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('faq.title')}</h2>
        <div ref={ref} className="reveal flex flex-col gap-3">
          {items.map((it, i) => (
            <details key={i} className="group rounded-xl px-5 py-4" style={{ background: colors.bg, border: `1px solid ${colors.border}` }}>
              <summary className="flex items-center justify-between cursor-pointer list-none text-sm font-semibold" style={{ color: colors.textPrimary }}>
                {it.q}
                <ChevronDown size={18} className="transition-transform group-open:rotate-180" style={{ color: colors.textMuted }} />
              </summary>
              <p className="mt-3 text-sm leading-relaxed" style={{ color: colors.textMuted }}>{it.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
