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
