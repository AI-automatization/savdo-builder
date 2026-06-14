'use client';

import { Check, X } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';
import { useReveal } from '@/lib/landing/use-reveal';

type Cell = 'yes' | 'no' | 'commission' | 'expensive';

export function WhyUs() {
  const { t } = useTranslation();
  const ref = useReveal<HTMLDivElement>();
  const cols = [t('why.col.feature'), t('why.col.us'), t('why.col.dm'), t('why.col.mp'), t('why.col.builder')];
  // [фича, us, директ, маркетплейс, конструктор]
  const rows: { label: string; cells: Cell[] }[] = [
    { label: t('why.row1'), cells: ['yes', 'no', 'yes', 'yes'] },
    { label: t('why.row2'), cells: ['yes', 'no', 'no', 'yes'] },
    { label: t('why.row3'), cells: ['yes', 'yes', 'commission', 'yes'] },
    { label: t('why.row4'), cells: ['yes', 'yes', 'no', 'no'] },
    { label: t('why.row5'), cells: ['yes', 'yes', 'no', 'expensive'] },
  ];

  const renderCell = (c: Cell, isUs: boolean) => {
    if (c === 'yes') return <Check size={18} style={{ color: isUs ? colors.accent : colors.success }} className="mx-auto" aria-label={t('why.yes')} />;
    if (c === 'no') return <X size={18} style={{ color: colors.textDim }} className="mx-auto" aria-label={t('why.no')} />;
    if (c === 'commission') return <span className="text-xs" style={{ color: colors.warning }}>{t('why.commission')}</span>;
    return <span className="text-xs" style={{ color: colors.warning }}>{t('why.expensive')}</span>;
  };

  return (
    <section className="mx-auto max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
      <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10" style={{ color: colors.textPrimary }}>{t('why.title')}</h2>
      <div ref={ref} className="reveal overflow-x-auto rounded-xl" style={{ border: `1px solid ${colors.border}` }}>
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr style={{ background: colors.surface }}>
              {cols.map((c, i) => (
                <th key={i} className="px-4 py-3 text-center font-semibold" style={{ color: i === 1 ? colors.accent : colors.textMuted, borderBottom: `1px solid ${colors.border}` }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, ri) => (
              <tr key={ri} style={{ borderBottom: ri < rows.length - 1 ? `1px solid ${colors.border}` : 'none' }}>
                <td className="px-4 py-3 font-medium text-left" style={{ color: colors.textPrimary }}>{r.label}</td>
                {r.cells.map((c, ci) => (
                  <td key={ci} className="px-4 py-3 text-center" style={{ background: ci === 0 ? colors.accentMuted : 'transparent' }}>
                    {renderCell(c, ci === 0)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-xs text-center max-w-2xl mx-auto" style={{ color: colors.textMuted }}>{t('why.note')}</p>
    </section>
  );
}
