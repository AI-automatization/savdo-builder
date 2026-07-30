/**
 * Stores that must never reach a search index.
 *
 * Why this exists: `test-udalit-ms1gi4um` ("ТЕСТ - удалить") is an approved, public
 * store in production. It was in the sitemap at priority 0.8 / changefreq daily,
 * linked from the homepage "Топ магазины" block, and served a self-referencing
 * canonical — everything needed for Google to index a store literally named
 * "TEST - delete" as one of only two shops on the platform.
 *
 * This list is the *guard*, not the fix. The actual fix is removing or unpublishing
 * the store in admin; once that happens its slug can come off this list. Keeping the
 * guard afterwards is still worthwhile: it makes "this store is not for the public
 * index" expressible in code instead of depending on production data hygiene.
 *
 * Deliberately an explicit list rather than a /test|demo/ pattern — a pattern would
 * silently deindex a legitimate seller whose shop name happens to contain "test".
 */
export const SEO_EXCLUDED_STORE_SLUGS: readonly string[] = [
  'test-udalit-ms1gi4um',
];

export function isSeoExcludedStore(slug: string): boolean {
  return SEO_EXCLUDED_STORE_SLUGS.includes(slug);
}
