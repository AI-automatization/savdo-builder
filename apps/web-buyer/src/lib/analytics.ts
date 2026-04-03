// ── Analytics — buyer events ──────────────────────────────────────────────────

import { apiClient } from './api/client';

type BuyerEvent =
  | { name: 'storefront_viewed';  payload: { store_id: string; store_slug: string; source: string } }
  | { name: 'product_viewed';     payload: { store_id: string; product_id: string } }
  | { name: 'variant_selected';   payload: { store_id: string; product_id: string; variant_id: string } }
  | { name: 'add_to_cart';        payload: { store_id: string; product_id: string; variant_id: string | null; quantity: number } }
  | { name: 'checkout_started';   payload: { store_id: string; cart_items_count: number; cart_total: number } }
  | { name: 'order_created';      payload: { store_id: string; order_id: string; gmv: number; payment_method: string } }
  | { name: 'telegram_clicked';   payload: { store_id: string; context: 'storefront' | 'product' | 'order' } }
  | { name: 'chat_started';       payload: { store_id: string; thread_type: string } };

function send(event: BuyerEvent): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[analytics:buyer]', event.name, event.payload);
  }
  const storeId = 'store_id' in event.payload ? (event.payload as Record<string, string>).store_id : undefined;
  apiClient
    .post('/analytics/track', { eventName: event.name, eventPayload: event.payload, storeId })
    .catch(() => { /* best-effort */ });
}

export const track = {
  storefrontViewed: (storeId: string, storeSlug: string, source = 'direct') =>
    send({ name: 'storefront_viewed', payload: { store_id: storeId, store_slug: storeSlug, source } }),

  productViewed: (storeId: string, productId: string) =>
    send({ name: 'product_viewed', payload: { store_id: storeId, product_id: productId } }),

  variantSelected: (storeId: string, productId: string, variantId: string) =>
    send({ name: 'variant_selected', payload: { store_id: storeId, product_id: productId, variant_id: variantId } }),

  addToCart: (storeId: string, productId: string, variantId: string | null, quantity: number) =>
    send({ name: 'add_to_cart', payload: { store_id: storeId, product_id: productId, variant_id: variantId, quantity } }),

  checkoutStarted: (storeId: string, cartItemsCount: number, cartTotal: number) =>
    send({ name: 'checkout_started', payload: { store_id: storeId, cart_items_count: cartItemsCount, cart_total: cartTotal } }),

  orderCreated: (storeId: string, orderId: string, gmv: number, paymentMethod: string) =>
    send({ name: 'order_created', payload: { store_id: storeId, order_id: orderId, gmv, payment_method: paymentMethod } }),

  telegramClicked: (storeId: string, context: 'storefront' | 'product' | 'order') =>
    send({ name: 'telegram_clicked', payload: { store_id: storeId, context } }),

  chatStarted: (storeId: string, threadType: string) =>
    send({ name: 'chat_started', payload: { store_id: storeId, thread_type: threadType } }),
};
