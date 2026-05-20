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
  /** Снапшот базовой цены из CartItem.unitPriceSnapshot на момент добавления. */
  unitPriceSnapshot: number | null;
  /** Снапшот sale-цены из CartItem.salePriceSnapshot на момент добавления. */
  salePriceSnapshot: number | null;
  subtotal: number;
  product: {
    id: string;
    title: string;
    mediaUrl: string | null;
    /** Текущая базовая цена продукта (Product.basePrice). */
    basePrice: number;
    /** Текущая sale-цена продукта (Product.salePrice), null если не на скидке. */
    salePrice: number | null;
    /** Текущий складской агрегат продукта (Product.totalStock). */
    stock: number;
    /** status === ACTIVE && isVisible. */
    isAvailable: boolean;
    /** Product.isVisible. */
    isVisible: boolean;
  };
  variant: {
    id: string;
    sku: string | null;
    title: string | null;
    /** ProductVariant.priceOverride, null если вариант не переопределяет цену. */
    priceOverride: number | null;
    /** ProductVariant.salePriceOverride, null если вариант не переопределяет sale-цену. */
    salePriceOverride: number | null;
  } | null;
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

    const productStatus = product?.status as string | undefined;
    const productIsVisible = product?.isVisible === true;
    const isAvailable = productStatus === 'ACTIVE' && productIsVisible;

    return {
      id: item.id,
      productId: item.productId,
      variantId: item.variantId ?? null,
      quantity: item.quantity,
      unitPrice,
      unitPriceSnapshot: item.unitPriceSnapshot != null ? toNum(item.unitPriceSnapshot) : null,
      salePriceSnapshot: item.salePriceSnapshot != null ? toNum(item.salePriceSnapshot) : null,
      subtotal,
      product: {
        id: product?.id ?? item.productId,
        title: product?.title ?? '',
        mediaUrl: resolveMediaUrl(product?.images?.[0]?.media) ?? null,
        basePrice: toNum(product?.basePrice),
        salePrice: product?.salePrice != null ? toNum(product.salePrice) : null,
        stock: product?.totalStock != null ? toNum(product.totalStock) : 0,
        isAvailable,
        isVisible: productIsVisible,
      },
      variant: variant
        ? {
            id: variant.id,
            sku: variant.sku ?? null,
            title: variantTitle,
            priceOverride: variant.priceOverride != null ? toNum(variant.priceOverride) : null,
            salePriceOverride:
              variant.salePriceOverride != null ? toNum(variant.salePriceOverride) : null,
          }
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
