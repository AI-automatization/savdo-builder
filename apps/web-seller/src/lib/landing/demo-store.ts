import { buyerStoreUrl } from '@/lib/buyer-url';

const DEFAULT_DEMO_SLUG = 'azim-mnx4na25';
const BOT_USERNAME = process.env.NEXT_PUBLIC_TG_BOT_USERNAME ?? 'maxsavdo_bot';

function demoSlug(): string {
  return process.env.NEXT_PUBLIC_DEMO_STORE_SLUG?.trim() || DEFAULT_DEMO_SLUG;
}

// Ссылка на демо-магазин в браузере (web-buyer).
export function demoStoreUrl(): string | null {
  return buyerStoreUrl(demoSlug());
}

// Ссылка на тот же магазин внутри Telegram Mini App.
// Формат совпадает с products/page.tsx — https://t.me/{bot}?startapp={slug}
export function demoTmaUrl(): string {
  return `https://t.me/${BOT_USERNAME}?startapp=${demoSlug()}`;
}
