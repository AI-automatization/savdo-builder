import type { NextConfig } from "next";
import path from "path";

const monorepoRoot = path.resolve(__dirname, "../..");

// Derive the API host from env so next/image accepts proxied Telegram media URLs
// (Полат returns absolute https://<api-host>/api/v1/media/proxy/<id> links now).
function apiHostname(): string | null {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) return null;
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

const remoteHosts: Array<{ hostname: string }> = [];
const apiHost = apiHostname();
if (apiHost) remoteHosts.push({ hostname: apiHost });

// Cloudflare R2 public buckets (objectKey-based URLs)
remoteHosts.push({ hostname: "**.r2.dev" });
remoteHosts.push({ hostname: "**.r2.cloudflarestorage.com" });

// Fallback for Railway dev/staging domains
remoteHosts.push({ hostname: "**.up.railway.app" });

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  outputFileTracingRoot: monorepoRoot,
  transpilePackages: ["types", "ui"],
  images: {
    remotePatterns: remoteHosts.map((h) => ({
      protocol: "https",
      hostname: h.hostname,
    })),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
