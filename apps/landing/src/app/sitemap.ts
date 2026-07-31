import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';
import { BLOG_POSTS } from '@/lib/blog-posts';

// Honest lastModified — the date of the last real content change to the homepage
// copy (i18n.ts / page components), not build time. Bump this when the copy
// actually changes; a build-time date would tell crawlers the page changed on
// every deploy, which is a lie they eventually learn to discount.
const CONTENT_LAST_MODIFIED = new Date('2026-07-26T12:00:00+05:00');
const NEW_PAGES_LAST_MODIFIED = new Date('2026-07-31T12:00:00+05:00');

function alt(path: string) {
  return {
    languages: {
      uz: `${SITE_URL}${path}`,
      ru: `${SITE_URL}/ru${path}`,
      'x-default': `${SITE_URL}${path}`,
    },
  };
}

export default function sitemap(): MetadataRoute.Sitemap {
  // Only real, separately-addressable pages belong here. `/#pricing` and `/#faq`
  // used to be listed — Google does not treat a fragment as its own URL, so they
  // were just duplicates of `/` diluting the sitemap.
  const entries: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: alt(''),
    },
    {
      url: `${SITE_URL}/ru`,
      lastModified: CONTENT_LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: alt(''),
    },
  ];

  const staticPages = ['/about', '/how-it-works', '/faq', '/contacts', '/cases', '/blog', '/support'];
  for (const path of staticPages) {
    entries.push(
      { url: `${SITE_URL}${path}`, lastModified: NEW_PAGES_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.6, alternates: alt(path) },
      { url: `${SITE_URL}/ru${path}`, lastModified: NEW_PAGES_LAST_MODIFIED, changeFrequency: 'monthly', priority: 0.55, alternates: alt(path) },
    );
  }

  for (const post of BLOG_POSTS) {
    const path = `/blog/${post.slug}`;
    entries.push(
      { url: `${SITE_URL}${path}`, lastModified: new Date(post.date), changeFrequency: 'monthly', priority: 0.5, alternates: alt(path) },
      { url: `${SITE_URL}/ru${path}`, lastModified: new Date(post.date), changeFrequency: 'monthly', priority: 0.45, alternates: alt(path) },
    );
  }

  return entries;
}
