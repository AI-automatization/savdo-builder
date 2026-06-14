// i18n базовые типы для web-seller landing.
// UZ = латиница (соглашение проекта, как в apps/tma).
export type Locale = 'ru' | 'uz';

export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';
export const LOCALE_COOKIE = 'ms_locale';

export type Dict = Record<string, string>;
export type Translations = Dict;
