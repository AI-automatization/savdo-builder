import type { Locale } from "./i18n";

// Не используем Intl.DateTimeFormat/toLocaleDateString('uz-UZ', ...): ICU-данные
// этой локали расходятся между Node (SSR) и Chromium (клиент) — сервер и клиент
// рендерят разный текст, React ловит hydration mismatch. Форматируем вручную.
const MONTHS: Record<Locale, string[]> = {
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
};

export function formatBlogDate(iso: string, locale: Locale): string {
  const [year, month, day] = iso.split("-").map(Number);
  const monthName = MONTHS[locale][month - 1];
  return locale === "uz" ? `${day}-${monthName}, ${year}` : `${day} ${monthName} ${year}`;
}
