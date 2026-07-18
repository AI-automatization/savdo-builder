import type { MetadataRoute } from 'next';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://maxsavdo.uz';

// Honest lastModified — last real content commit to the homepage/ru page (git log),
// not build time. Update this string when page.tsx/ru/page.tsx copy actually changes.
const CONTENT_LAST_MODIFIED = new Date('2026-06-13T14:00:55+05:00');

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = CONTENT_LAST_MODIFIED;

  return [
    {
      url: `${SITE_URL}/`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/ru`,
      lastModified,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/#pricing`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/#faq`,
      lastModified,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];
}
