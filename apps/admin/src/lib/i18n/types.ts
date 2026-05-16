// MARKETING-LOCALIZATION-UZ-001 (admin) — i18n базовые типы.
//
// Зеркалит инфраструктуру TMA (apps/tma/src/lib/i18n). Admin — внутренний
// инструмент, но локализация нужна для узбекоязычных операторов.
// `uz` подразумевает латиницу (соглашение UZ-маркетплейсов с 2023).

export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';

/**
 * Translation dictionary — flat key-value map, ключи в dot.notation.
 * Значения могут содержать плейсхолдеры {name} — заменяются в `t()`.
 * ru.ts — single source of truth для fallback.
 */
export type Translations = Record<string, string>;
