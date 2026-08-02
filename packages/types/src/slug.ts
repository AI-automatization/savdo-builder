// Cyrillic → Latin transliteration for slug generation (store slugs, etc.)
// Single source of truth — was duplicated independently in apps/api (Telegram bot)
// and apps/web-seller (onboarding form), which caused the same typo/bug to be
// fixed twice in two different places (ONBOARD-SLUG-TRANSLIT-DEDUP-001).
const CYRILLIC_TO_LATIN: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k',
  л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts',
  ч: 'ch', ш: 'sh', щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
};

// ONBOARD-SLUG-TRANSLIT-DEDUP-001: default was 40, but the historical contract
// for store slugs (apps/api SlugService.generate() — "НЕ менять для stores")
// and the currently-live apps/web-seller onboarding form both use 60. Callers
// that forget to pass maxLength explicitly must land on the real prod value,
// not a silently shorter one.
export function toLatinSlug(name: string, maxLength = 60): string {
  return name
    .toLowerCase()
    .replace(/[а-яё]/g, (c) => CYRILLIC_TO_LATIN[c] ?? '')
    // Matches apps/web-seller's onboarding toSlug() char class exactly (\w, not
    // a-z0-9 — permits a literal underscore through from the original name) —
    // being stricter here would silently strip a character that live prod
    // slugs may already contain.
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}
