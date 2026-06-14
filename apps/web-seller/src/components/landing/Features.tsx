'use client';

import { LayoutGrid, ShoppingCart, ClipboardList, LineChart, MessagesSquare, Send } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';

export function Features() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const items = [
    { icon: LayoutGrid, title: t('features.1.title'), body: t('features.1.body') },
    { icon: ShoppingCart, title: t('features.2.title'), body: t('features.2.body') },
    { icon: ClipboardList, title: t('features.3.title'), body: t('features.3.body') },
    { icon: LineChart, title: t('features.4.title'), body: t('features.4.body') },
    { icon: MessagesSquare, title: t('features.5.title'), body: t('features.5.body') },
    { icon: Send, title: t('features.6.title'), body: t('features.6.body') },
  ];
  return (
    <section id="features" className="scroll-mt-20 mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('features.title')}</h2>
      <div ref={ref} className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="rounded-xl p-6 transition-transform hover:-translate-y-0.5" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: colors.accentMuted }}>
                <Icon size={20} style={{ color: colors.accent }} />
              </div>
              <h3 className="text-base font-bold mb-1.5" style={{ color: colors.textPrimary }}>{it.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{it.body}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
