import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // App
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),

  // APP_URL — публичный URL api сервера. Используется для построения absolute
  // URL прокси Telegram-фото и в storefront image resolution. Без него
  // фото из TG-storage отдаются как relative path, который ломается на
  // TMA-домене → 404 «фото не грузится». TMA-PHOTO-UPLOAD-DIAG-001.
  APP_URL: Joi.string().uri().required(),

  // Database
  DATABASE_URL: Joi.string().required(),

  // Redis
  REDIS_URL: Joi.string().required(),

  // JWT
  JWT_ACCESS_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: Joi.string().default('30d'),

  // Storage (S3-compatible: Cloudflare R2 / Supabase Storage / AWS S3)
  STORAGE_ENDPOINT: Joi.string().allow('').optional(),
  STORAGE_ACCESS_KEY_ID: Joi.string().allow('').optional(),
  STORAGE_SECRET_ACCESS_KEY: Joi.string().allow('').optional(),
  STORAGE_BUCKET_PUBLIC: Joi.string().allow('').optional(),
  STORAGE_BUCKET_PRIVATE: Joi.string().allow('').optional(),
  STORAGE_PUBLIC_URL: Joi.string().allow('').optional(),
  // SigV4 region. R2 принимает 'auto', Supabase требует реальный регион
  // (project region из dashboard) — иначе подпись неправильная → 403.
  STORAGE_REGION: Joi.string().default('us-east-1'),

  // Telegram Bot — OTP через Telegram (Eskiz ЗАПРЕЩЁН)
  TELEGRAM_BOT_TOKEN: Joi.string().required(),
  TELEGRAM_WEBHOOK_SECRET: Joi.string().allow('').optional(),
  TELEGRAM_BOT_USERNAME: Joi.string().default('savdo_builderBOT'),
  // Telegram-канал для хранения медиа (fallback к R2). Бот должен быть
  // админом канала с правом «Публикация сообщений». Если не выставлен и
  // R2 не сконфигурирован — uploadDirect вернёт 503.
  TELEGRAM_STORAGE_CHANNEL_ID: Joi.string().allow('').optional(),
  TMA_URL: Joi.string().uri().allow('').optional(),

  // Feature flags
  DEV_OTP_ENABLED: Joi.boolean().default(false),
  STORE_APPROVAL_REQUIRED: Joi.boolean().default(true),
  CHAT_ENABLED: Joi.boolean().default(true),
  ANALYTICS_ENABLED: Joi.boolean().default(true),
  TELEGRAM_NOTIFICATIONS_ENABLED: Joi.boolean().default(false),
  OTP_REQUIRED_FOR_CHECKOUT: Joi.boolean().default(false),
  WEB_PUSH_ENABLED: Joi.boolean().default(false),
  MOBILE_PUSH_ENABLED: Joi.boolean().default(false),
  SMS_FALLBACK_ENABLED: Joi.boolean().default(false), // ВСЕГДА false — SMS/Eskiz ЗАПРЕЩЕНЫ
  SELLER_INSIGHTS_ENABLED: Joi.boolean().default(false),
  PAYMENT_ONLINE_ENABLED: Joi.boolean().default(false),
  PRODUCT_IMAGE_ATTACHMENT_ENABLED: Joi.boolean().default(false),
  AUTO_CANCEL_PENDING_AFTER_HOURS: Joi.number().default(48),

  // CORS
  ALLOWED_ORIGINS: Joi.string().optional(),
});
