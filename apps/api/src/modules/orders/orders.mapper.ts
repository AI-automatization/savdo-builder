import { toNum } from '../cart/cart.mapper';

export function mapOrderDetail(o: any) {
  const deliveryAddress = o.city || o.addressLine1
    ? {
        street: o.addressLine1 ?? null,
        city: o.city ?? null,
        region: o.region ?? null,
      }
    : undefined;

  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    storeId: o.storeId,
    buyerId: o.buyerId,
    createdAt: (o.placedAt ?? o.createdAt ?? new Date()).toISOString(),
    updatedAt: (o.updatedAt ?? o.placedAt ?? new Date()).toISOString(),
    totalAmount: toNum(o.totalAmount),
    currencyCode: o.currencyCode ?? 'UZS',
    deliveryFee: toNum(o.deliveryFeeAmount ?? o.deliveryFee),
    deliveryType: o.deliveryType ?? null,
    deliveryAddress,
    paymentMethod: o.paymentMethod ?? null,
    paymentStatus: o.paymentStatus ?? null,
    customerPhone: o.customerPhone ?? null,
    customerFullName: o.customerFullName ?? null,
    buyerNote: o.customerComment ?? o.buyerNote ?? null,
    buyer: o.buyer ? { phone: o.buyer.user?.phone ?? null } : null,
    store: o.store
      ? { name: o.store.name, telegramContactLink: o.store.telegramContactLink ?? null }
      : null,
    items: (o.items ?? []).map((i: any) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId ?? null,
      title: i.productTitleSnapshot ?? '',
      variantTitle: i.variantLabelSnapshot ?? null,
      quantity: i.quantity,
      unitPrice: toNum(i.unitPriceSnapshot),
      subtotal: toNum(i.lineTotalAmount),
    })),
  };
}
