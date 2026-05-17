// MARKETING-LOCALIZATION-UZ-001 (web-seller) — i18n базовые типы.
// Зеркалит apps/admin/src/lib/i18n/types.ts. `uz` — латиница.

export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * Translation dictionary — плоский key-value, ключи в dot.notation.
 * Значения могут содержать плейсхолдеры {name}. ru.ts — source of truth.
 */
export type Translations = Record<string, string>;
