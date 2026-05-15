import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import { useTelegram } from '@/providers/TelegramProvider';
import { ru } from './ru';
import { uz } from './uz';
import type { Locale, Translations } from './types';
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from './types';

const STORAGE_KEY = 'savdo_locale';

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

function detectInitialLocale(tgLangCode: string | undefined): Locale {
  // Приоритет 1: явный выбор пользователя из localStorage
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED_LOCALES.includes(stored as Locale)) {
      return stored as Locale;
    }
  } catch {
    // localStorage может быть недоступен (Telegram WebView в режиме incognito)
  }

  // Приоритет 2: язык Telegram-пользователя.
  // tg.initDataUnsafe.user.language_code = 'ru' | 'uz' | 'en' | ...
  // 'ru' → ru. 'uz' (или любая Latin-локаль с 2026 в UZ) → uz.
  // Всё остальное (en/...) → ru-fallback (наша целевая аудитория RU+UZ).
  if (tgLangCode === 'uz') return 'uz';
  if (tgLangCode === 'ru') return 'ru';

  return DEFAULT_LOCALE;
}

/**
 * Простая шаблонная подстановка {name} → vars.name. Если плейсхолдер
 * не найден в vars — оставляет его как есть для отладки (не молчит).
 */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const v = vars[key];
    return v != null ? String(v) : match;
  });
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const { user: tgUser } = useTelegram();
  const [locale, setLocaleState] = useState<Locale>(() =>
    detectInitialLocale(tgUser?.language_code),
  );

  // Если tgUser появился после монтирования (initData приходит асинхронно),
  // обновим локаль — но только если пользователь сам ничего не выбирал.
  useEffect(() => {
    if (!tgUser?.language_code) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return; // явный выбор уже есть
    } catch { /* ignore */ }
    const detected = detectInitialLocale(tgUser.language_code);
    setLocaleState((prev) => (prev === detected ? prev : detected));
  }, [tgUser?.language_code]);

  // Обновляем <html lang> для a11y и Telegram WebView TTS.
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch { /* ignore */ }
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
