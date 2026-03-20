/**
 * All analytics event names for Savdo.
 * Full list: docs/V1.1/07_seller_onboarding_funnel.md
 */
export const AnalyticsEvent = {
  // Seller funnel
  SIGNUP_STARTED: 'signup_started',
  OTP_VERIFIED: 'otp_verified',
  STORE_CREATED: 'store_created',
  SELLER_PROFILE_COMPLETED: 'seller_profile_completed',
  FIRST_PRODUCT_CREATED: 'first_product_created',
  PRODUCT_CREATED: 'product_created',
  STORE_SUBMITTED_FOR_REVIEW: 'store_submitted_for_review',
  STORE_APPROVED: 'store_approved',
  STORE_PUBLISHED: 'store_published',
  STORE_LINK_COPIED: 'store_link_copied',
  FIRST_ORDER_RECEIVED: 'first_order_received',
  ORDER_STATUS_CHANGED: 'order_status_changed',

  // Buyer funnel
  STOREFRONT_VIEWED: 'storefront_viewed',
  PRODUCT_VIEWED: 'product_viewed',
  VARIANT_SELECTED: 'variant_selected',
  ADD_TO_CART: 'add_to_cart',
  CHECKOUT_STARTED: 'checkout_started',
  ORDER_CREATED: 'order_created',
  TELEGRAM_CLICKED: 'telegram_clicked',
  CHAT_STARTED: 'chat_started',
} as const;

export type AnalyticsEventType = (typeof AnalyticsEvent)[keyof typeof AnalyticsEvent];
