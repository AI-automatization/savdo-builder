// Public web-buyer URL for sharing / "open in browser" actions.
// VITE_WEB_BUYER_URL — задать на Railway (TMA service) когда домен будет на savdo.uz.
// Дефолт — production Railway URL web-buyer'a, чтобы ссылки работали без env.
const RAW = (import.meta.env.VITE_WEB_BUYER_URL as string | undefined)
  ?? 'https://savdo-builder-by-production.up.railway.app';

const WEB_BUYER_BASE = RAW.replace(/\/$/, '');

export function webStoreUrl(slug: string): string {
  return `${WEB_BUYER_BASE}/${slug}`;
}

// Display-only короткий вариант: "savdo.uz/<slug>" если в проде, иначе host из URL
export function webStoreLabel(slug: string): string {
  try {
    const host = new URL(WEB_BUYER_BASE).host;
    return `${host}/${slug}`;
  } catch {
    return `savdo.uz/${slug}`;
  }
}
