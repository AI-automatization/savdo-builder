import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Pin the tracing root to this app: the repo root also has a pnpm-lock.yaml
  // (monorepo-wide), and this app now ships its own package-lock.json — without
  // this, Next.js infers the workspace root from whichever lockfile it finds
  // first walking up and warns about "multiple lockfiles" on every build.
  outputFileTracingRoot: path.join(__dirname),
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'savdo-api-production.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: 'savdo-builder-by-production.up.railway.app',
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          // No camera/mic/geolocation anywhere on this site — closing off browser
          // features we never use is free hardening, no functional risk.
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          // HSTS: tells browsers to never try http:// again. Also a (small)
          // trust signal for search engines. `preload` is safe here because the
          // apex and every subdomain (shop/seller/api) are already HTTPS-only.
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
      {
        // Static assets under /public (product photos, logo) — unlike hashed
        // /_next/static chunks, these have stable filenames but shipped with
        // max-age=0, forcing revalidation on every repeat view.
        source: '/(landing|guides)/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/logo-maxsavdo.svg',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // www → apex. Both hostnames currently serve 200; the canonical tag points
      // at the apex, which mostly saves us, but a 301 removes the duplicate
      // outright and consolidates any links that land on www.
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www.maxsavdo.uz' }],
        destination: 'https://maxsavdo.uz/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
