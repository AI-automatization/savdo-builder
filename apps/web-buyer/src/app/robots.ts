import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://shop.maxsavdo.uz';

const PRIVATE_PATHS = [
  '/checkout',
  '/cart',
  '/orders',
  '/wishlist',
  '/chats',
  '/api/',
];

const AI_CRAWLERS = [
  'GPTBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-Web',
  'Anthropic-AI',
  'Google-Extended',
  'PerplexityBot',
  'YouBot',
  'Applebot',
  'Applebot-Extended',
  'Meta-ExternalAgent',
  'Grokbot',
  'CCBot',
  'cohere-ai',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: PRIVATE_PATHS,
      },
      ...AI_CRAWLERS.map((userAgent) => ({ userAgent, allow: '/', disallow: PRIVATE_PATHS })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
