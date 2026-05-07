import { CartWithItems } from './repositories/cart.repository';

function resolveMediaUrl(media: any): string | null {
  if (!media?.objectKey) return null;
  // API-BUCKET-NAME-CONSISTENCY-001: telegram-expired = мёртвый file_id.
  if (media.bucket === 'telegram-expired') return null;
  const appUrl = (process.env.APP_URL ?? '').replace(/\/$/, '');
  if (media.bucket === 'telegram') return `${appUrl}/api/v1/media/proxy/${media.id}`;
  const storageUrl = process.env.STORAGE_PUBLIC_URL ?? '';
  if (storageUrl) return `${storageUrl}/${media.objectKey}`;
  return media.id && appUrl ? `${appUrl}/api/v1/media/proxy/${media.id}` : null;
}

export interface MappedCartItem {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  product: { id: string; title: string; mediaUrl: string | null };
  variant: { id: string; sku: string | null; title: string | null } | null;
}

export interface MappedCart {
  id: string;
  storeId: string;
  items: MappedCartItem[];
  totalAmount: number;
  currencyCode: string;
}

/** Safely converts Prisma Decimal, native number, or string to number */
export function toNum(val: unknown): number {
  if (val == null) return 0;
  const n = Number(String(val));
  return isNaN(n) ? 0 : n;
}

export function mapCart(cart: CartWithItems): MappedCart {
  const items: MappedCartItem[] = (cart.items as any[]).map((item) => {
    const effectivePrice = toNum(item.salePriceSnapshot ?? item.unitPriceSnapshot);
    const unitPrice = effectivePrice;
    const subtotal = unitPrice * item.quantity;

    const product = item.product as any;
    const variant = item.variant as any;

    const variantTitle: string | null = variant
      ? (variant.titleOverride ??
          (((variant.optionValues ?? []) as any[])
            .map((ov) => ov.optionValue?.value ?? '')
            .filter(Boolean)
            .join(' / ') ||
          null))
      : null;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unitPrice,
      subtotal,
      product: {
        id: product?.id ?? item.productId,
        title: product?.title ?? '',
        mediaUrl: resolveMediaUrl(product?.images?.[0]?.media) ?? null,
      },
      variant: variant
        ? { id: variant.id, sku: variant.sku ?? null, title: variantTitle }
        : null,
    };
  });

  const totalAmount = items.reduce((sum, i) => sum + i.subtotal, 0);

  return {
    id: cart.id,
    storeId: cart.storeId,
    items,
    totalAmount,
    currencyCode: (cart as any).currencyCode ?? 'UZS',
  };
}

export function mapEmptyCart() {
  return { id: null as null, storeId: null as null, items: [] as MappedCartItem[], totalAmount: 0, currencyCode: 'UZS' };
}
