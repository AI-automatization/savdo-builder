import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_BUYER_URL || 'https://savdo.uz';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/checkout',
          '/cart',
          '/orders',
          '/orders/',
          '/wishlist',
          '/chats',
          '/api/',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
