// Buyer storefront URL helpers — read NEXT_PUBLIC_BUYER_URL with savdo.uz fallback,
// so dev/staging environments don't show dead production links.

const FALLBACK = 'https://savdo.uz';

export function buyerOrigin(): string {
  return process.env.NEXT_PUBLIC_BUYER_URL || FALLBACK;
}

export function buyerStoreUrl(slug: string): string {
  return `${buyerOrigin()}/${slug}`;
}

/** Display variant without protocol (`savdo.uz/slug`, `localhost:3001/slug`). */
export function buyerStoreDisplay(slug: string): string {
  return `${buyerOrigin().replace(/^https?:\/\//, '')}/${slug}`;
}

/** Host-only display without protocol or slug (`savdo.uz`, `localhost:3001`). */
export function buyerHostDisplay(): string {
  return buyerOrigin().replace(/^https?:\/\//, '');
}

/** Product detail URL (`https://savdo.uz/{slug}/products/{productId}`). */
export function buyerProductUrl(slug: string, productId: string): string {
  return `${buyerOrigin()}/${slug}/products/${productId}`;
}
