/**
 * Normalize a "contact-link" style string: trim whitespace, convert empty
 * string → null. Used for fields that are nullable in the API contract
 * (`packages/types/src/api/stores.ts` — `telegramContactLink: string | null`)
 * but historically могли попасть в DB как пустая строка `""`.
 *
 * API-TELEGRAM-LINK-EMPTY-001 (audit 24.05.2026): web-buyer показывал кнопку
 * «Написать в TG» с href="" → клик ведёт на 404. Defensive normalize гарантирует
 * что фронт всегда видит либо валидную ссылку, либо null.
 */
export function normalizeContactLink(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

/**
 * Canonical mapping для городов Узбекистана. Источник правописания: латиница uz
 * (2023+, официальная орфография — Toshkent, Samarqand, Buxoro). Английский вариант
 * `Tashkent` и любые case-variations → канонический uz-Latin.
 *
 * API-CITY-NORMALIZATION-001 (audit 24.05.2026): в проде встречались оба написания
 * (`Toshkent`, `Tashkent`), что ломало фильтрацию storefront по городу и aggregation.
 */
const CITY_CANONICAL: Record<string, string> = {
  // Tashkent (capital)
  tashkent: 'Toshkent',
  toshkent: 'Toshkent',
  ташкент: 'Toshkent',
  тошкент: 'Toshkent',
  // Samarkand
  samarkand: 'Samarqand',
  samarqand: 'Samarqand',
  самарканд: 'Samarqand',
  // Bukhara
  bukhara: 'Buxoro',
  buxoro: 'Buxoro',
  бухара: 'Buxoro',
  // Andijan
  andijan: 'Andijon',
  andijon: 'Andijon',
  андижан: 'Andijon',
  // Namangan
  namangan: 'Namangan',
  // Fergana
  fergana: 'Farg‘ona',
  ferghana: 'Farg‘ona',
  'farg‘ona': 'Farg‘ona',
  fargona: 'Farg‘ona',
  фергана: 'Farg‘ona',
  // Qarshi
  karshi: 'Qarshi',
  qarshi: 'Qarshi',
  карши: 'Qarshi',
  // Nukus
  nukus: 'Nukus',
  нукус: 'Nukus',
  // Urgench
  urgench: 'Urganch',
  urganch: 'Urganch',
  ургенч: 'Urganch',
  // Termez
  termez: 'Termiz',
  termiz: 'Termiz',
  термез: 'Termiz',
  // Jizzakh
  jizzakh: 'Jizzax',
  jizzax: 'Jizzax',
  джизак: 'Jizzax',
  // Navoiy
  navoi: 'Navoiy',
  navoiy: 'Navoiy',
  навои: 'Navoiy',
  // Gulistan
  gulistan: 'Guliston',
  guliston: 'Guliston',
  гулистан: 'Guliston',
};

/**
 * Нормализовать название города к каноническому варианту (uz-Latin, официальное).
 * Для незнакомых городов — trim + Title Case (первая буква большая, остальные нижние).
 * Пустая строка → ''.
 */
export function normalizeCity(value: string | null | undefined): string {
  if (value == null) return '';
  const trimmed = value.trim();
  if (trimmed === '') return '';
  const canonical = CITY_CANONICAL[trimmed.toLowerCase()];
  if (canonical) return canonical;
  // Fallback: Title Case первой буквы (для городов которых нет в mapping)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}
