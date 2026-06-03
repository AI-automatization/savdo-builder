'use client';

import { PackageX, MessageCircleQuestion, BarChartBig } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

export function ProblemSection() {
  const { t } = useTranslation();
  const items = [
    { icon: PackageX, title: t('problem.1.title'), body: t('problem.1.body') },
    { icon: MessageCircleQuestion, title: t('problem.2.title'), body: t('problem.2.body') },
    { icon: BarChartBig, title: t('problem.3.title'), body: t('problem.3.body') },
  ];
  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: colors.textPrimary }}>{t('problem.title')}</h2>
        <p className="mt-2 text-sm sm:text-base" style={{ color: colors.textMuted }}>{t('problem.subtitle')}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {items.map((it, i) => {
          const Icon = it.icon;
          return (
            <div key={i} className="rounded-xl p-6" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
              <div className="w-11 h-11 rounded-lg flex items-center justify-center mb-4" style={{ background: colors.surfaceMuted }}>
                <Icon size={20} style={{ color: colors.danger }} />
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
