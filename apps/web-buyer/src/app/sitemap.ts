import type { MetadataRoute } from 'next';
import { serverGetSitemapFeed } from '@/lib/api/storefront-server';

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

// SEO-AUDIT-001 п.2: было 6 статичных URL, ни одного магазина/товара —
// краулеру некуда идти дальше главной. Теперь тянем публичные магазины из
// /storefront/sitemap с честным lastModified вместо new Date() на каждый билд.
//
// ⚠️ Товары пока не эмитим: фид отдаёт только id (см. SitemapFeed в
// storefront-server.ts) — без store.slug нельзя построить канонический
// /{slug}/products/{id}. Блокер на Полате, см. analiz/logs.md SEO-AUDIT-001.
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
  ];

  const feed = await serverGetSitemapFeed().catch(() => null);
  if (!feed) return staticEntries;

  const storeEntries: MetadataRoute.Sitemap = feed.stores.map((s) => ({
    url: `${siteUrl}/${s.slug}`,
    lastModified: new Date(s.updatedAt),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  return [...staticEntries, ...storeEntries];
}
