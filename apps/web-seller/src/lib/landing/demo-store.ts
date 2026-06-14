import { buyerStoreUrl } from '@/lib/buyer-url';

// Дефолтный публичный демо-магазин (живой на проде). Переопределяется через
// NEXT_PUBLIC_DEMO_STORE_SLUG; пустое значение env-переменной возвращает дефолт.
const DEFAULT_DEMO_SLUG = 'azim-mnx4na25';

// Демо-магазин для CTA «Посмотреть демо». Веб-демо без бота — наша отстройка
// от qlay, поэтому кнопка показывается всегда (есть дефолтный живой магазин).
export function demoStoreUrl(): string | null {
  const slug = process.env.NEXT_PUBLIC_DEMO_STORE_SLUG?.trim() || DEFAULT_DEMO_SLUG;
  return buyerStoreUrl(slug);
}
