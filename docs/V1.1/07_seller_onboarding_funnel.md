# 07_seller_onboarding_funnel.md — Seller Onboarding Funnel

## Цель

Seller должен получить **первый заказ** как можно быстрее.

Ключевая метрика MVP: **время от регистрации до первого заказа**.

---

## Этапы воронки

```
[1] SIGNUP STARTED
    │  Seller открывает страницу регистрации
    │  Event: signup_started

[2] OTP VERIFIED
    │  Seller ввёл телефон → получил OTP → подтвердил
    │  Event: otp_verified
    │  → создаётся user + seller запись (status: UNVERIFIED)

[3] STORE CREATED
    │  Seller заполнил название магазина
    │  Slug сгенерирован автоматически (editable)
    │  Event: store_created
    │  → создаётся store (status: DRAFT)

[4] PROFILE COMPLETED
    │  Seller заполнил:
    │  - Telegram username (обязательно)
    │  - Город (обязательно)
    │  - Telegram contact link (обязательно)
    │  Event: seller_profile_completed

[5] FIRST PRODUCT CREATED
    │  Seller добавил первый товар с ценой
    │  Event: first_product_created
    │  Система показывает подсказку "Добавьте фото"

[6] STORE SUBMITTED FOR REVIEW
    │  Seller нажал "Отправить на проверку"
    │  Event: store_submitted_for_review
    │  → store status: PENDING_REVIEW
    │  Admin получает уведомление

[7] STORE APPROVED
    │  Admin одобрил магазин
    │  Event: store_approved
    │  Seller получает уведомление в Telegram + in-app
    │  → store status: APPROVED

[8] STORE PUBLISHED
    │  Seller нажал "Опубликовать"
    │  Event: store_published
    │  → store.is_public = true

[9] STORE LINK COPIED / SHARED
    │  Seller скопировал ссылку на магазин
    │  Event: store_link_copied
    │  Система предлагает поделиться в Telegram

[10] FIRST ORDER RECEIVED
     Event: first_order_received
     → Seller получает push в Telegram
     → Ключевой момент активации
```

---

## Analytics Events

### Seller events (для воронки)

| Event | Когда | Payload |
|-------|-------|---------|
| `signup_started` | Открытие формы регистрации | `{ source: 'direct' | 'referral' }` |
| `otp_verified` | Успешная OTP-верификация | `{ phone_masked }` |
| `store_created` | Создание store | `{ store_id, slug }` |
| `seller_profile_completed` | Заполнен профиль | `{ store_id }` |
| `first_product_created` | Первый товар добавлен | `{ store_id, product_id, has_image }` |
| `product_created` | Каждый новый товар | `{ store_id, product_id, has_variants, has_image }` |
| `store_submitted_for_review` | Отправка на модерацию | `{ store_id }` |
| `store_approved` | Одобрение admin-ом | `{ store_id, time_to_approve_minutes }` |
| `store_published` | Публикация магазина | `{ store_id }` |
| `store_link_copied` | Копирование ссылки | `{ store_id }` |
| `first_order_received` | Первый заказ | `{ store_id, order_id, gmv }` |
| `order_status_changed` | Изменение статуса | `{ order_id, from, to }` |

### Buyer events (для конверсии)

| Event | Когда | Payload |
|-------|-------|---------|
| `storefront_viewed` | Открытие storefront | `{ store_id, store_slug, source }` |
| `product_viewed` | Просмотр товара | `{ store_id, product_id }` |
| `variant_selected` | Выбор варианта | `{ store_id, product_id, variant_id }` |
| `add_to_cart` | Добавление в корзину | `{ store_id, product_id, variant_id, quantity }` |
| `checkout_started` | Открытие checkout | `{ store_id, cart_items_count, cart_total }` |
| `order_created` | Создание заказа | `{ store_id, order_id, gmv, payment_method }` |
| `telegram_clicked` | Клик "Написать в Telegram" | `{ store_id, context: 'storefront' | 'product' | 'order' }` |
| `chat_started` | Открытие chat thread | `{ store_id, thread_type }` |

---

## Требования к UX воронки

### Минимум шагов

Регистрация продавца до публикации магазина — **не более 5 экранов**:
1. Телефон + OTP
2. Имя магазина + slug
3. Telegram + город + contact link
4. Первый товар
5. Submit for review

### Guided onboarding

На seller dashboard отображается progress bar:
```
[✓] Аккаунт создан
[✓] Заполнен профиль
[ ] Добавлен товар
[ ] Отправлен на проверку
[ ] Опубликован
```

### Fallback при ожидании модерации

Пока seller ждёт approval:
- Показываем "Магазин на проверке, ожидайте"
- Предлагаем добавить больше товаров
- Предлагаем проверить Telegram-уведомления (подключить бота)

### После первого заказа

- Telegram-уведомление немедленно
- In-app badge "Новый заказ"
- Ссылка прямо в заказ из уведомления

---

## Retention loop

```
Seller создаёт товар
  → Делится ссылкой в своём Telegram-канале
    → Покупатели делают заказы
      → Seller видит ценность
        → Добавляет больше товаров
          → Приглашает других продавцов (referral будущее)
```

**Ключевой момент:** seller должен получить **первый заказ в первую неделю**. Если за 7 дней нет заказа — высокий риск churn.

Метрика: **% sellers who received first order within 7 days**.
