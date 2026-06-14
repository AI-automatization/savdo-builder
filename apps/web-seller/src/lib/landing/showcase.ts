import { buyerStoreUrl } from '@/lib/buyer-url';

export interface ShowcaseStore {
  slug: string;
  url: string;
}

// Список витрин для секции showcase из env (slug магазинов через запятую).
// Пусто → [] → секция не рендерится (никаких мёртвых ссылок в проде).
export function showcaseStores(): ShowcaseStore[] {
  const raw = process.env.NEXT_PUBLIC_SHOWCASE_SLUGS?.trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((slug) => ({ slug, url: buyerStoreUrl(slug) }));
}
