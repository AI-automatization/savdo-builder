import { buyerStoreUrl } from '@/lib/buyer-url';

// Демо-магазин для CTA «Посмотреть демо». Если slug не задан в env —
// возвращаем null, и кнопка не рендерится (никаких мёртвых ссылок в проде).
export function demoStoreUrl(): string | null {
  const slug = process.env.NEXT_PUBLIC_DEMO_STORE_SLUG?.trim();
  if (!slug) return null;
  return buyerStoreUrl(slug);
}
