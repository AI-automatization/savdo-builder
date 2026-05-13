// MARKETING-LOCALIZATION-UZ-001 — i18n базовые типы.
//
// Locale codes по BCP-47. `uz` подразумевает латиницу (по соглашению Uzum
// и других UZ-маркетплейсов с 2023). Кириллица не поддерживается — это
// раздувает bundle и не нужно для нашей аудитории.

export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * Translation dictionary — flat key-value map.
 * Ключи в dot.notation для семантической группировки.
 * Значения могут содержать плейсхолдеры вида {name} — заменяются в `t()`.
 */
export type Translations = Record<string, string>;
