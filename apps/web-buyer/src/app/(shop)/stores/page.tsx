import { serverGetStoresCatalog } from '@/lib/api/storefront-server';
import { isSeoExcludedStore } from '@/lib/seo/index-exclusions';
import StoresCatalogClient, { type StoresCatalogQuery } from './StoresCatalogClient';

/**
 * SEO-CRAWL-PATH-001: /stores теперь SSR-ит первый список витрин.
 *
 * Была client-only страница: краулер получал заголовок, фильтры и пустую сетку —
 * ни одного <a href="/{slug}">. Это единственная hub-страница на все магазины, и
 * она не вела никуда. Тот же приём, что уже стоит на homepage (serverGetFeatured →
 * HomeTopStores initialData): фетчим на сервере, отдаём клиенту как initialData,
 * фильтры/сортировка/URL-state остаются клиентскими и работают как раньше.
 *
 * Исключённые из индекса магазины убираем и здесь: страница server-rendered, её
 * ссылки — настоящие ссылки для краулера, ровно как в sitemap и в featured-блоке
 * homepage. Клиентский рефетч потом покажет полный список живому пользователю —
 * это осознанно: скрывать магазин от покупателя не нужно, нужно не звать на него
 * краулера.
 */
export default async function StoresCatalogPage({
  searchParams,
}: {
  searchParams: Promise<StoresCatalogQuery>;
}) {
  const [all, query] = await Promise.all([
    serverGetStoresCatalog().catch(() => undefined),
    searchParams,
  ]);
  const initialStores = all?.filter((s) => !isSeoExcludedStore(s.slug));

  return <StoresCatalogClient initialStores={initialStores} query={query} />;
}
