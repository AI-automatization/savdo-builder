// ⚠️ Этот barrel импортится КЛИЕНТСКИМИ компонентами (useTranslation).
// Поэтому здесь НЕЛЬЗЯ реэкспортировать server-only код (getServerLocale →
// next/headers), иначе next/headers попадёт в client-бандл и страница падает в 500.
// getServerLocale импортируется напрямую из './server-locale' в server-компонентах.
export { I18nProvider, useTranslation } from './I18nProvider';
export { SUPPORTED_LOCALES, DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from './types';
