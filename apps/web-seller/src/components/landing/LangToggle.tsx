'use client';

import { useTranslation } from '@/lib/i18n';
import { colors } from '@/lib/styles';

// Компактный сегмент RU / UZ. Активный язык — золотым акцентом.
export function LangToggle() {
  const { locale, setLocale } = useTranslation();
  const opts: { code: 'ru' | 'uz'; label: string }[] = [
    { code: 'ru', label: 'RU' },
    { code: 'uz', label: 'UZ' },
  ];
  return (
    <div
      className="inline-flex items-center rounded-full p-0.5"
      style={{ border: `1px solid ${colors.border}`, background: colors.surface }}
      role="group"
      aria-label="Язык / Til"
    >
      {opts.map((o) => {
        const active = locale === o.code;
        return (
          <button
            key={o.code}
            type="button"
            onClick={() => setLocale(o.code)}
            aria-pressed={active}
            className="px-2.5 py-1 text-xs font-semibold rounded-full transition-colors"
            style={{
              background: active ? colors.accent : 'transparent',
              color: active ? colors.accentTextOnBg : colors.textMuted,
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
