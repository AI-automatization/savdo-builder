// Buyer storefront URL helper — читает NEXT_PUBLIC_BUYER_URL с фолбэком на
// shop.maxsavdo.uz, чтобы dev/staging не показывали мёртвые прод-ссылки.

const FALLBACK = 'https://shop.maxsavdo.uz';

export function buyerOrigin(): string {
  return process.env.NEXT_PUBLIC_BUYER_URL || FALLBACK;
}
