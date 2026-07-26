import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

// Honest lastModified — the date of the last real content change to the homepage
// copy (i18n.ts / page components), not build time. Bump this when the copy
// actually changes; a build-time date would tell crawlers the page changed on
// every deploy, which is a lie they eventually learn to discount.
const CONTENT_LAST_MODIFIED = new Date('2026-07-26T12:00:00+05:00');

const languages = {
  uz: `${SITE_URL}/`,
  ru: `${SITE_URL}/ru`,
  'x-default': `${SITE_URL}/`,
};

export default function sitemap(): MetadataRoute.Sitemap {
  // Only real, separately-addressable pages belong here. `/#pricing` and `/#faq`
  // used to be listed — Google does not treat a fragment as its own URL, so they
  // were just duplicates of `/` diluting the sitemap.
  return [
    {
      url: `${SITE_URL}/`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages },
    },
    {
      url: `${SITE_URL}/ru`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages },
    },
  ];
}
