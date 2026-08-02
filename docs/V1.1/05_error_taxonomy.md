# 05_error_taxonomy.md — Error Taxonomy

## Структура ответа при ошибке

Все ошибки API возвращаются в едином формате:

```json
{
  "statusCode": 400,
  "code": "CART_STORE_MISMATCH",
  "message": "Cart can only contain items from one store",
  "details": {}
}
```

- `statusCode` — HTTP status code
- `code` — машиночитаемый error code (константа)
- `message` — человекочитаемое описание (на English в API, i18n на frontend-е)
- `details` — опциональные доп. данные (поля с ошибками валидации и т.д.)

---

## Категории ошибок

### AUTH — Аутентификация и сессии

| Code | HTTP | Описание |
|------|------|---------|
| `OTP_NOT_FOUND` | 404 | OTP запрос не найден |
| `OTP_EXPIRED` | 400 | OTP просрочен |
| `OTP_INVALID` | 400 | Неверный код |
| `OTP_ALREADY_CONSUMED` | 400 | OTP уже использован |
| `OTP_TOO_MANY_ATTEMPTS` | 429 | Превышено число попыток ввода |
| `OTP_SEND_LIMIT` | 429 | Превышен лимит отправки OTP |
| `TOKEN_EXPIRED` | 401 | Access token просрочен |
| `TOKEN_INVALID` | 401 | Access token невалиден |
| `REFRESH_TOKEN_INVALID` | 401 | Refresh token невалиден или отозван |
| `SESSION_NOT_FOUND` | 401 | Сессия не найдена |
| `UNAUTHORIZED` | 401 | Требуется авторизация |

### AUTHZ — Авторизация и ownership

| Code | HTTP | Описание |
|------|------|---------|
| `FORBIDDEN` | 403 | Недостаточно прав (общий случай) |
| `SELLER_BLOCKED` | 403 | Продавец заблокирован |
| `STORE_NOT_APPROVED` | 403 | Магазин не одобрен admin-ом |
| `STORE_SUSPENDED` | 403 | Магазин приостановлен |
| `NOT_STORE_OWNER` | 403 | Seller не владеет этим магазином |
| `NOT_PRODUCT_OWNER` | 403 | Seller не владеет этим товаром |
| `NOT_ORDER_PARTICIPANT` | 403 | Пользователь не является участником заказа |
| `NOT_THREAD_PARTICIPANT` | 403 | Пользователь не является участником чата |
| `ADMIN_ONLY` | 403 | Endpoint доступен только admin-у |

### VALIDATION — Валидация входных данных

| Code | HTTP | Описание |
|------|------|---------|
| `VALIDATION_ERROR` | 400 | Ошибка валидации DTO (details содержит поля) |
| `INVALID_PHONE` | 400 | Неверный формат номера телефона |
| `INVALID_SLUG` | 400 | Slug содержит недопустимые символы |
| `SLUG_TOO_SHORT` | 400 | Slug слишком короткий |
| `INVALID_FILE_TYPE` | 400 | Тип файла не поддерживается |
| `FILE_TOO_LARGE` | 400 | Файл превышает допустимый размер |

### STORE — Магазин

| Code | HTTP | Описание |
|------|------|---------|
| `STORE_ALREADY_EXISTS` | 409 | У seller уже есть магазин (INV-S01) |
| `STORE_NOT_FOUND` | 404 | Магазин не найден |
| `STORE_SLUG_TAKEN` | 409 | Slug уже занят |
| `STORE_SLUG_IMMUTABLE` | 400 | Slug нельзя менять после публикации (INV-S02) |
| `STORE_ONBOARDING_INCOMPLETE` | 400 | Не выполнены условия для публикации (INV-S03) |
| `STORE_INVALID_TRANSITION` | 400 | Недопустимый переход статуса |

### PRODUCT — Товар

| Code | HTTP | Описание |
|------|------|---------|
| `PRODUCT_NOT_FOUND` | 404 | Товар не найден |
| `VARIANT_NOT_FOUND` | 404 | Вариант не найден |
| `PRODUCT_NOT_ACTIVE` | 400 | Товар недоступен для покупки |
| `SKU_ALREADY_EXISTS` | 409 | SKU уже существует в этом продукте |
| `PRODUCT_INVALID_TRANSITION` | 400 | Недопустимый переход статуса |

### CART — Корзина

| Code | HTTP | Описание |
|------|------|---------|
| `CART_NOT_FOUND` | 404 | Корзина не найдена |
| `CART_STORE_MISMATCH` | 400 | Товар из другого магазина (INV-C01) |
| `CART_EMPTY` | 400 | Корзина пустая |
| `CART_EXPIRED` | 400 | Корзина просрочена |
| `CART_ITEM_NOT_FOUND` | 404 | Позиция в корзине не найдена |

### CHECKOUT & ORDERS — Оформление и заказы

| Code | HTTP | Описание |
|------|------|---------|
| `INSUFFICIENT_STOCK` | 400 | Недостаточно товара на складе |
| `ORDER_NOT_FOUND` | 404 | Заказ не найден |
| `ORDER_INVALID_TRANSITION` | 400 | Недопустимый переход статуса заказа |
| `ORDER_IMMUTABLE` | 400 | Состав заказа нельзя изменить (INV-C03) |
| `CROSS_STORE_ORDER` | 400 | Товары из разных магазинов (INV-C02) |
| `CANCEL_REASON_REQUIRED` | 400 | Требуется причина отмены |

### CHAT — Чат

| Code | HTTP | Описание |
|------|------|---------|
| `THREAD_NOT_FOUND` | 404 | Тред не найден |
| `THREAD_ALREADY_EXISTS` | 409 | Тред уже существует для этого buyer/product |
| `THREAD_CLOSED` | 400 | Тред закрыт |
| `BUYER_NOT_IDENTIFIED` | 400 | Покупатель не идентифицирован (нет телефона) |

### MEDIA — Медиа

| Code | HTTP | Описание |
|------|------|---------|
| `MEDIA_NOT_FOUND` | 404 | Файл не найден |
| `MEDIA_NOT_OWNED` | 403 | Файл не принадлежит этому пользователю |
| `MEDIA_LIMIT_EXCEEDED` | 400 | Превышено количество файлов (напр. 5 фото на товар) |
| `UPLOAD_FAILED` | 500 | Ошибка загрузки файла |

### SUBSCRIPTIONS — Подписки и тарифные планы

| Code | HTTP | Описание |
|------|------|---------|
| `SUBSCRIPTION_NOT_FOUND` | 404 | Подписка не найдена |
| `SUBSCRIPTION_ALREADY_ACTIVE` | 409 | У seller уже есть активная подписка |
| `PLAN_LIMIT_EXCEEDED` | 402 | Превышен лимит тарифного плана (требуется upgrade) |
| `TRIAL_ALREADY_USED` | 409 | Trial-период уже был использован |
| `INVALID_PLAN_TRANSITION` | 422 | Недопустимый переход между тарифами |
| `SUBSCRIPTION_SUSPENDED` | 403 | Подписка приостановлена (просрочена/заблокирована) |
| `PAYMENT_NOT_FOUND` | 404 | Платёж не найден |
| `PAYMENT_ALREADY_CONFIRMED` | 409 | Платёж уже подтверждён |

#### Детализация по кодам

##### `SUBSCRIPTION_NOT_FOUND` (404)
- **When thrown:** запрос подписки по `subscriptionId` или `sellerId`, которой нет в БД (включая случай "seller никогда не подписывался").
- **Message ru:** «Подписка не найдена.»
- **Message uz:** «Obuna topilmadi.»
- **Client reaction:** показать экран "Выбрать тариф" / редирект на `/billing/plans`. Не ретраить.

##### `SUBSCRIPTION_ALREADY_ACTIVE` (409)
- **When thrown:** попытка активировать/создать новую подписку, когда у seller уже есть активная (status = ACTIVE или TRIALING).
- **Message ru:** «У вас уже есть активная подписка. Для смены тарифа используйте upgrade.»
- **Message uz:** «Sizda allaqachon faol obuna mavjud. Tarifni o'zgartirish uchun upgrade-dan foydalaning.»
- **Client reaction:** скрыть кнопку "Активировать", показать текущую подписку и предложить `PATCH /subscriptions/:id` (change plan). Не ретраить.

##### `PLAN_LIMIT_EXCEEDED` (402 Payment Required)
- **When thrown:** seller пытается выполнить действие, превышающее квоту тарифа (например, добавить 51-й товар на Free, создать 2-ю витрину, превысить лимит чатов/заказов в месяц). `details` содержит `{ limit, current, resource }`.
- **Message ru:** «Достигнут лимит тарифа: {resource} ({current}/{limit}). Перейдите на старший тариф.»
- **Message uz:** «Tarif chegarasiga yetdingiz: {resource} ({current}/{limit}). Yuqori tarifga o'ting.»
- **Client reaction:** показать paywall-модалку с CTA "Upgrade plan" → переход на `/billing/plans`. Не ретраить запрос с теми же данными. Это **не** валидация — это бизнес-ограничение монетизации, поэтому отдельный код и 402.

##### `TRIAL_ALREADY_USED` (409)
- **When thrown:** seller повторно запрашивает trial (Free → Trial), но `trial_used_at` уже выставлен.
- **Message ru:** «Пробный период уже был использован. Выберите платный тариф.»
- **Message uz:** «Sinov muddati allaqachon ishlatilgan. Pullik tarifni tanlang.»
- **Client reaction:** скрыть кнопку "Активировать trial", показать только платные тарифы. Не ретраить.

##### `INVALID_PLAN_TRANSITION` (422)
- **When thrown:** недопустимый переход между тарифами по матрице (например, downgrade с Business → Free при `activeOrders > 0`, или скачок через тариф в обход бизнес-правил). `details` содержит `{ from, to, reason }`.
- **Message ru:** «Переход на этот тариф невозможен: {reason}.»
- **Message uz:** «Bu tarifga o'tish mumkin emas: {reason}.»
- **Client reaction:** показать пользователю причину из `details.reason`, предложить альтернативный путь (например, "сначала закройте активные заказы"). Не ретраить с теми же параметрами.

##### `SUBSCRIPTION_SUSPENDED` (403)
- **When thrown:** seller с подпиской в статусе SUSPENDED (просрочка платежа, нарушение правил, admin block) пытается выполнить защищённое действие (publish product, accept order и т.д.).
- **Message ru:** «Ваша подписка приостановлена. Оплатите задолженность или обратитесь в поддержку.»
- **Message uz:** «Obunangiz to'xtatilgan. Qarzni to'lang yoki qo'llab-quvvatlash xizmatiga murojaat qiling.»
- **Client reaction:** глобальный баннер "Подписка приостановлена" + кнопка "Оплатить" → `/billing/pay`. Заблокировать seller-actions UI до возобновления.

##### `PAYMENT_NOT_FOUND` (404)
- **When thrown:** запрос платежа по `paymentId`, которого нет (или он принадлежит другому seller — обфусцируется как 404, а не 403).
- **Message ru:** «Платёж не найден.»
- **Message uz:** «To'lov topilmadi.»
- **Client reaction:** редирект на `/billing/history`. Не ретраить.

##### `PAYMENT_ALREADY_CONFIRMED` (409)
- **When thrown:** webhook от платёжной системы или ручное подтверждение приходит повторно для платежа со status = CONFIRMED (идемпотентность).
- **Message ru:** «Платёж уже подтверждён.»
- **Message uz:** «To'lov allaqachon tasdiqlangan.»
- **Client reaction:** webhook handler возвращает 200 OK провайдеру (это нормальный дубликат, не ошибка). UI обновляет статус из ответа и не показывает ошибку пользователю.

### MODERATION — Модерация

| Code | HTTP | Описание |
|------|------|---------|
| `MODERATION_COMMENT_REQUIRED` | 400 | Комментарий обязателен при reject/suspend/block |

### SYSTEM — Системные

| Code | HTTP | Описание |
|------|------|---------|
| `INTERNAL_ERROR` | 500 | Внутренняя ошибка сервера |
| `SERVICE_UNAVAILABLE` | 503 | Сервис временно недоступен |
| `RATE_LIMIT_EXCEEDED` | 429 | Превышен rate limit |
| `NOT_FOUND` | 404 | Ресурс не найден (общий случай) |

---

## Принципы реализации

1. **Domain errors** — не `HttpException`, а кастомные классы (`CartStoreMismatchError extends DomainError`)
2. **Global exception filter** в NestJS перехватывает все ошибки и нормализует ответ
3. **Validation errors** возвращают `details` с полями: `{ "field": "phone", "message": "Invalid format" }`
4. **Не раскрывать внутренние детали** в 500 ошибках в production (только в dev/staging)
5. **Логировать все 5xx ошибки** с correlation_id
6. **Не логировать 4xx** как ошибки — это нормальные клиентские ошибки (только метрики)

---

## Error codes как TypeScript константы

```typescript
// shared/constants/error-codes.ts
export const ErrorCode = {
  // AUTH
  OTP_NOT_FOUND: 'OTP_NOT_FOUND',
  OTP_EXPIRED: 'OTP_EXPIRED',
  OTP_INVALID: 'OTP_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  // ... и т.д.
} as const;

export type ErrorCodeType = typeof ErrorCode[keyof typeof ErrorCode];
```
