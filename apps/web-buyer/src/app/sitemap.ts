import type { MetadataRoute } from 'next';
import { serverGetSitemapFeed } from '@/lib/api/storefront-server';
import { isSeoExcludedStore } from '@/lib/seo/index-exclusions';

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

// SEO-AUDIT-001 п.2: было 6 статичных URL, ни одного магазина/товара —
// краулеру некуда идти дальше главной. Теперь тянем публичные магазины и товары из
// /storefront/sitemap с честным lastModified вместо new Date() на каждый билд.
//
// Honest lastModified per static page — last real content commit (git log), not build
// time. Homepage stays "now" since it genuinely aggregates live featured stores/products.
// Update the relevant date below when that page's actual content changes.
const LEGAL_CONTENT_LAST_MODIFIED = new Date('2026-05-25T15:46:34+05:00'); // terms/privacy/offer/refund
const HELP_LAST_MODIFIED = new Date('2026-07-14T15:26:09+05:00');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${siteUrl}/terms`, lastModified: LEGAL_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/privacy`, lastModified: LEGAL_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/offer`, lastModified: LEGAL_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/refund`, lastModified: LEGAL_CONTENT_LAST_MODIFIED, changeFrequency: 'yearly', priority: 0.3 },
    { url: `${siteUrl}/help`, lastModified: HELP_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.4 },
    // Catalog routes: crawlable, linked from the bottom nav, and now carrying their
    // own metadata + canonical (see (shop)/stores/layout.tsx, (shop)/products/layout.tsx).
    { url: `${siteUrl}/stores`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${siteUrl}/products`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
  ];

  const feed = await serverGetSitemapFeed().catch(() => null);
  if (!feed) return staticEntries;

  const storeEntries: MetadataRoute.Sitemap = feed.stores
    .filter((s) => !isSeoExcludedStore(s.slug))
    .map((s) => ({
      url: `${siteUrl}/${s.slug}`,
      lastModified: new Date(s.updatedAt),
      changeFrequency: 'daily',
      priority: 0.8,
    }));

  // Products of an excluded store go with it — otherwise the store URL is gone from
  // the sitemap while its product pages are still advertised.
  const productEntries: MetadataRoute.Sitemap = feed.products
    .filter((p) => !isSeoExcludedStore(p.storeSlug))
    .map((p) => ({
      url: `${siteUrl}/${p.storeSlug}/products/${p.id}`,
      lastModified: new Date(p.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  return [...staticEntries, ...storeEntries, ...productEntries];
}
