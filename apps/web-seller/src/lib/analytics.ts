// ── Analytics — seller events ─────────────────────────────────────────────────
//
// No backend POST endpoint in MVP contract.
// Events are logged in dev; swap `send` to push to PostHog/Segment/custom API.

type SellerEvent =
  | { name: 'signup_started';              payload: { source: 'direct' | 'referral' } }
  | { name: 'otp_verified';                payload: { phone_masked: string } }
  | { name: 'store_created';               payload: { store_id: string; slug: string } }
  | { name: 'seller_profile_completed';    payload: { store_id: string } }
  | { name: 'first_product_created';       payload: { store_id: string; product_id: string; has_image: boolean } }
  | { name: 'product_created';             payload: { store_id: string; product_id: string; has_variants: boolean; has_image: boolean } }
  | { name: 'store_submitted_for_review';  payload: { store_id: string } }
  | { name: 'store_published';             payload: { store_id: string } }
  | { name: 'store_link_copied';           payload: { store_id: string } }
  | { name: 'order_status_changed';        payload: { order_id: string; from: string; to: string } };

function send(event: SellerEvent): void {
  if (process.env.NODE_ENV === 'development') {
    // eslint-disable-next-line no-console
    console.debug('[analytics:seller]', event.name, event.payload);
  }
  // TODO: replace with real sink
  // analytics.track(event.name, event.payload);
}

export const track = {
  signupStarted: (source: 'direct' | 'referral' = 'direct') =>
    send({ name: 'signup_started', payload: { source } }),

  otpVerified: (phone: string) =>
    send({ name: 'otp_verified', payload: { phone_masked: phone.slice(0, -4) + '****' } }),

  storeCreated: (storeId: string, slug: string) =>
    send({ name: 'store_created', payload: { store_id: storeId, slug } }),

  sellerProfileCompleted: (storeId: string) =>
    send({ name: 'seller_profile_completed', payload: { store_id: storeId } }),

  firstProductCreated: (storeId: string, productId: string) =>
    send({ name: 'first_product_created', payload: { store_id: storeId, product_id: productId, has_image: false } }),

  productCreated: (storeId: string, productId: string) =>
    send({ name: 'product_created', payload: { store_id: storeId, product_id: productId, has_variants: false, has_image: false } }),

  storeSubmittedForReview: (storeId: string) =>
    send({ name: 'store_submitted_for_review', payload: { store_id: storeId } }),

  storePublished: (storeId: string) =>
    send({ name: 'store_published', payload: { store_id: storeId } }),

  storeLinkCopied: (storeId: string) =>
    send({ name: 'store_link_copied', payload: { store_id: storeId } }),

  orderStatusChanged: (orderId: string, from: string, to: string) =>
    send({ name: 'order_status_changed', payload: { order_id: orderId, from, to } }),
};
