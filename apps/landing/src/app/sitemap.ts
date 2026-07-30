import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { guideAlternates, guidePath, guides, guidesIndexPath } from '@/lib/guides';

// Honest lastModified — the date of the last real content change to the homepage
// copy (i18n.ts / page components), not build time. Bump this when the copy
// actually changes; a build-time date would tell crawlers the page changed on
// every deploy, which is a lie they eventually learn to discount.
const CONTENT_LAST_MODIFIED = new Date('2026-07-30T12:00:00+05:00');

const homeLanguages = {
  uz: `${SITE_URL}/`,
  ru: `${SITE_URL}/ru`,
  'x-default': `${SITE_URL}/`,
};

const faqLanguages = {
  uz: `${SITE_URL}/faq`,
  ru: `${SITE_URL}/ru/faq`,
  'x-default': `${SITE_URL}/faq`,
};

const guidesIndexLanguages = {
  uz: `${SITE_URL}${guidesIndexPath('uz')}`,
  ru: `${SITE_URL}${guidesIndexPath('ru')}`,
  'x-default': `${SITE_URL}${guidesIndexPath('uz')}`,
};

/** `guideAlternates` returns paths; the sitemap needs absolute URLs. */
function absoluteAlternates(paths: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(paths).map(([lang, path]) => [lang, `${SITE_URL}${path}`]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Only real, separately-addressable pages belong here. `/#pricing` and `/#faq`
  // used to be listed — Google does not treat a fragment as its own URL, so they
  // were just duplicates of `/` diluting the sitemap.
  const guideEntries: MetadataRoute.Sitemap = (['uz', 'ru'] as const).flatMap(
    (locale) =>
      guides[locale].map((guide) => ({
        url: `${SITE_URL}${guidePath(locale, guide.slug)}`,
        // Per-article date from the content itself, not one date for the section.
        lastModified: new Date(`${guide.updated}T12:00:00+05:00`),
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: { languages: absoluteAlternates(guideAlternates(guide.key)) },
      })),
  );

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: homeLanguages },
    },
    {
      url: `${SITE_URL}/ru`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages: homeLanguages },
    },
    {
      url: `${SITE_URL}${guidesIndexPath('uz')}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: guidesIndexLanguages },
    },
    {
      url: `${SITE_URL}${guidesIndexPath('ru')}`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: guidesIndexLanguages },
    },
    {
      url: `${SITE_URL}/faq`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: faqLanguages },
    },
    {
      url: `${SITE_URL}/ru/faq`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: faqLanguages },
    },
    ...guideEntries,
  ];
}
