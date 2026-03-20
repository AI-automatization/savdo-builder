import { registerAs } from '@nestjs/config';

export const featuresConfig = registerAs('features', () => ({
  chatEnabled: process.env.CHAT_ENABLED !== 'false',
  otpRequiredForCheckout: process.env.OTP_REQUIRED_FOR_CHECKOUT === 'true',
  storeApprovalRequired: process.env.STORE_APPROVAL_REQUIRED !== 'false',
  webPushEnabled: process.env.WEB_PUSH_ENABLED === 'true',
  mobilePushEnabled: process.env.MOBILE_PUSH_ENABLED === 'true',
  telegramNotificationsEnabled: process.env.TELEGRAM_NOTIFICATIONS_ENABLED !== 'false',
  smsFallbackEnabled: process.env.SMS_FALLBACK_ENABLED === 'true',
  analyticsEnabled: process.env.ANALYTICS_ENABLED !== 'false',
  sellerInsightsEnabled: process.env.SELLER_INSIGHTS_ENABLED === 'true',
  devOtpEnabled: process.env.DEV_OTP_ENABLED === 'true',
  paymentOnlineEnabled: process.env.PAYMENT_ONLINE_ENABLED === 'true',
  productImageAttachmentEnabled: process.env.PRODUCT_IMAGE_ATTACHMENT_ENABLED === 'true',
  autoCancelPendingAfterHours: parseInt(process.env.AUTO_CANCEL_PENDING_AFTER_HOURS ?? '48', 10),
}));
