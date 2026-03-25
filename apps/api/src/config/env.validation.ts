import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Storage (R2)
  STORAGE_ENDPOINT: Joi.string().allow('').optional(),
  STORAGE_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_BUCKET_PUBLIC: Joi.string().allow('').optional(),
  STORAGE_BUCKET_PRIVATE: Joi.string().allow('').optional(),
  STORAGE_PUBLIC_URL: Joi.string().allow('').optional(),

  // Telegram
  TELEGRAM_BOT_TOKEN: Joi.string().allow('').optional(),

  // OTP
  ESKIZ_EMAIL: Joi.string().allow('').optional(),
  ESKIZ_PASSWORD: Joi.string().allow('').optional(),

  // Feature flags
  DEV_OTP_ENABLED: Joi.boolean().default(false),
  STORE_APPROVAL_REQUIRED: Joi.boolean().default(true),
  CHAT_ENABLED: Joi.boolean().default(true),
  ANALYTICS_ENABLED: Joi.boolean().default(true),
  TELEGRAM_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
  OTP_REQUIRED_FOR_CHECKOUT: Joi.boolean().default(false),
  WEB_PUSH_ENABLED: Joi.boolean().default(false),
  MOBILE_PUSH_ENABLED: Joi.boolean().default(false),
  SMS_FALLBACK_ENABLED: Joi.boolean().default(false),
  SELLER_INSIGHTS_ENABLED: Joi.boolean().default(false),
  PAYMENT_ONLINE_ENABLED: Joi.boolean().default(false),
  PRODUCT_IMAGE_ATTACHMENT_ENABLED: Joi.boolean().default(false),
  AUTO_CANCEL_PENDING_AFTER_HOURS: Joi.number().default(48),

  // CORS
  ALLOWED_ORIGINS: Joi.string().optional(),
});
