import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { ru } from './ru';
import { uz } from './uz';
import type { Locale, Translations } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

// MARKETING-LOCALIZATION-UZ-001 (admin). Зеркалит TMA I18nProvider, но без
// Telegram — admin это desktop SPA. Локаль: localStorage → navigator.language
// → дефолт 'ru'.

const STORAGE_KEY = 'savdo_admin_locale';

const DICTS: Record<Locale, Translations> = { ru, uz };

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});

export const useTranslation = () => useContext(Ctx);

function detectInitialLocale(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // localStorage может быть недоступен
  }
  // navigator.language: 'uz', 'uz-UZ' → uz; всё остальное → ru-fallback.
  try {
    if (navigator.language?.toLowerCase().startsWith('uz')) return 'uz';
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}

/** Шаблонная подстановка {name} → vars.name. Неизвестный плейсхолдер не молчит. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const v = vars[key];
    return v != null ? String(v) : match;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => detectInitialLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // ignore
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const dict = DICTS[locale];
      const raw = dict[key] ?? ru[key] ?? key;
      return interpolate(raw, vars);
    },
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
