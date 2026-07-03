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

// TMA-SHARE-001: централизованные helper'ы для deep-link и Telegram share.
// Раньше каждый компонент строил deep-link вручную — дублирование + риск
// рассинхрона форматов с TMA parseStartParam.
const BOT_USERNAME = (import.meta.env.VITE_BOT_USERNAME as string | undefined) ?? 'maxsavdo_bot';

// Deep-link в Mini App: открывает магазин внутри Telegram одним тапом.
// Если бот не сконфигурён — fallback на публичный web-storefront (откроется
// в браузере через openLink, тоже валидный путь для расшаривания).
export function storeDeepLink(slug: string): string {
  return BOT_USERNAME
    ? `https://t.me/${BOT_USERNAME}?startapp=store_${slug}`
    : webStoreUrl(slug);
}

// Официальный Telegram share endpoint. Когда отдаётся в tg.openTelegramLink(),
// Telegram перехватывает URL и показывает нативный sheet «Поделиться в чате».
// https://core.telegram.org/api/links#share-links
export function tgShareUrl(url: string, text?: string): string {
  const params = new URLSearchParams({ url });
  if (text) params.set('text', text);
  return `https://t.me/share/url?${params.toString()}`;
}
