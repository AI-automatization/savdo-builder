'use client';

import { useTranslation, SUPPORTED_LOCALES, type Locale } from '@/lib/i18n';
import { colors } from '@/lib/styles';

const LABELS: Record<Locale, string> = { ru: 'RU', uz: 'UZ' };

/**
 * Сегментированный переключатель локали RU | UZ.
 * Смена мгновенная (Context re-render), сохраняется в localStorage.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div
      role="radiogroup"
      aria-label={t('settings.language')}
      className={`inline-flex rounded-full p-0.5 ${className}`}
      style={{ border: `1px solid ${colors.border}`, background: colors.surfaceMuted }}
    >
      {SUPPORTED_LOCALES.map((l) => {
        const active = l === locale;
        return (
          <button
            key={l}
            type="button"
            role="radio"
            onClick={() => setLocale(l)}
            aria-checked={active}
            className="h-7 min-w-[42px] rounded-full px-3 text-xs font-semibold transition-colors"
            style={{
              background: active ? colors.brand : 'transparent',
              color: active ? '#fff' : colors.textMuted,
            }}
          >
            {LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
