# 06_feature_flags.md — Feature Flags

Feature flags позволяют включать/отключать функции без деплоя. В MVP — простые env-переменные.

---

## Список флагов

| Флаг | Тип | По умолчанию | Описание |
|------|-----|-------------|---------|
| `CHAT_ENABLED` | boolean | `true` | Включает/отключает весь модуль чата |
| `OTP_REQUIRED_FOR_CHECKOUT` | boolean | `false` | Требовать OTP при checkout (false = телефон достаточен) |
| `STORE_APPROVAL_REQUIRED` | boolean | `true` | Store требует одобрения admin перед публикацией |
| `WEB_PUSH_ENABLED` | boolean | `false` | Web push уведомления (отключены в MVP) |
| `MOBILE_PUSH_ENABLED` | boolean | `false` | Mobile push (включается с запуском mobile app) |
| `TELEGRAM_NOTIFICATIONS_ENABLED` | boolean | `true` | Telegram уведомления для seller-ов |
| `SMS_FALLBACK_ENABLED` | boolean | `false` | Playmobile как резерв при недоступности Eskiz |
| `ANALYTICS_ENABLED` | boolean | `true` | Запись аналитических событий в БД |
| `SELLER_INSIGHTS_ENABLED` | boolean | `false` | Страница с аналитикой для seller-а |
| `DEV_OTP_ENABLED` | boolean | `false` | В dev: выводить OTP в console вместо SMS |
| `PAYMENT_ONLINE_ENABLED` | boolean | `false` | Онлайн-платежи (отключены до Phase D) |
| `PRODUCT_IMAGE_ATTACHMENT_ENABLED` | boolean | `false` | Изображения в чате |

---

## Реализация

### В .env

```env
# Feature Flags
CHAT_ENABLED=true
OTP_REQUIRED_FOR_CHECKOUT=false
STORE_APPROVAL_REQUIRED=true
WEB_PUSH_ENABLED=false
MOBILE_PUSH_ENABLED=false
TELEGRAM_NOTIFICATIONS_ENABLED=true
SMS_FALLBACK_ENABLED=false
ANALYTICS_ENABLED=true
SELLER_INSIGHTS_ENABLED=false
DEV_OTP_ENABLED=false   # в .env.development = true
PAYMENT_ONLINE_ENABLED=false
PRODUCT_IMAGE_ATTACHMENT_ENABLED=false
```

### В NestJS Config

```typescript
// config/features.config.ts
import { registerAs } from '@nestjs/config';

export const featuresConfig = registerAs('features', () => ({
  chatEnabled: process.env.CHAT_ENABLED === 'true',
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
}));
```

### Использование в сервисе

```typescript
// В модуле
constructor(
  @Inject(featuresConfig.KEY)
  private readonly features: ConfigType<typeof featuresConfig>,
) {}

// В use case
if (!this.features.chatEnabled) {
  throw new ForbiddenException('Chat is currently disabled');
}
```

---

## Конфигурация по окружениям

| Флаг | local | development | staging | production |
|------|-------|-------------|---------|-----------|
| `DEV_OTP_ENABLED` | true | true | false | false |
| `STORE_APPROVAL_REQUIRED` | false | false | true | true |
| `ANALYTICS_ENABLED` | false | true | true | true |
| `TELEGRAM_NOTIFICATIONS_ENABLED` | false | false | true | true |
| `CHAT_ENABLED` | true | true | true | true |
| `SMS_FALLBACK_ENABLED` | false | false | false | true |

---

## Принципы

1. **Флаг — не фича-контроль в runtime.** В MVP флаги меняются через деплой (env), не через БД. Runtime управление — будущее.
2. **Безопасные дефолты.** Флаги по умолчанию указаны как production-safe (web push off, online payments off).
3. **DEV_OTP_ENABLED** — только `development` и `local`. Никогда не включать в staging/production.
4. **Не дублировать логику.** Флаг проверяется один раз на входе в use case, не разбрасывается по всему коду.
