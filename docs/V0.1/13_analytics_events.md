# 13_analytics_events.md

## 1. Analytics Overview

Analytics в этом проекте — это не “потом добавим метрики”, а базовый инструмент понимания:

- растёт ли продукт
- где ломается воронка
- как ведут себя buyer-ы
- как работают seller-ы
- где теряются заказы
- какие части UX требуют улучшения

На V0.1 analytics должны быть простыми, но правильными по архитектуре, чтобы:

- не переделывать всё позже
- иметь минимальный, но достаточный набор событий
- не перегружать систему
- не замедлять основные flows

---

## 2. Goals

Основные цели analytics на V0.1:

- измерять conversion (view → cart → order)
- понимать activation seller-ов
- отслеживать usage chat
- фиксировать ключевые product events
- давать основу для будущего BI
- не усложнять backend и client unnecessarily

---

## 3. Analytics Philosophy

## 3.1 Track Only What Matters
Не нужно пытаться отслеживать всё подряд.

На V0.1 важно:
- ключевые действия
- критические точки воронки
- основные операционные события

## 3.2 Backend as Source of Truth
Критичные события (например, order.created) должны фиксироваться на backend.

Frontend может отправлять UI-level события, но бизнес-события — только backend.

## 3.3 Events Over Aggregates
Сначала собираем сырые события → потом агрегируем.

## 3.4 Async Processing
Analytics не должны блокировать основной flow.
Все события должны уходить через queue.

---

## 4. Event Architecture

## 4.1 Flow

1. событие происходит (frontend или backend)
2. событие нормализуется
3. событие отправляется в analytics service
4. событие кладётся в queue
5. worker обрабатывает событие
6. событие сохраняется в storage
7. optional: отправка во внешние системы позже

---

## 5. Event Types

События делятся на 3 категории:

## 5.1 Product Events (User Behavior)
- что делает пользователь

## 5.2 Business Events (Core Domain)
- что происходит в системе

## 5.3 System Events (Infra / Errors)
- что происходит на уровне системы

---

## 6. Buyer Events

## 6.1 Store Interaction

- `store_viewed`
- `store_scrolled`
- `store_category_selected`

## 6.2 Product Interaction

- `product_viewed`
- `variant_selected`
- `product_shared` optional later

## 6.3 Cart Interaction

- `add_to_cart`
- `remove_from_cart`
- `cart_viewed`

## 6.4 Checkout Funnel

- `checkout_started`
- `checkout_filled`
- `checkout_submitted`
- `order_created`

## 6.5 Chat

- `chat_opened`
- `message_sent`
- `message_received`

---

## 7. Seller Events

## 7.1 Onboarding

- `seller_registered`
- `seller_profile_completed`
- `store_created`
- `store_submitted_for_review`
- `seller_approved`
- `seller_rejected`

## 7.2 Product Management

- `product_created`
- `product_updated`
- `product_deleted`
- `variant_created`
- `variant_updated`

## 7.3 Orders

- `seller_viewed_orders`
- `order_confirmed`
- `order_cancelled`
- `order_completed`

## 7.4 Chat

- `seller_opened_chat`
- `seller_replied_message`

---

## 8. Business Events (Backend Only)

Эти события всегда генерируются backend:

- `order_created`
- `order_confirmed`
- `order_cancelled`
- `order_completed`
- `chat_message_created`
- `seller_approved`
- `store_published`

Эти события — основа аналитики, потому что они достоверны.

---

## 9. Event Structure

Каждое событие должно иметь стандартную структуру.

## 9.1 Required Fields

```json
{
  "event": "order_created",
  "timestamp": "...",
  "userId": "...",
  "role": "buyer",
  "sessionId": "...",
  "metadata": {}
}

9.2 Metadata Examples
product_viewed
{
  "productId": "...",
  "storeId": "...",
  "category": "..."
}
order_created
{
  "orderId": "...",
  "storeId": "...",
  "total": 120000,
  "itemsCount": 3,
  "paymentMethod": "cash"
}
10. Identity in Analytics
10.1 Before Auth

Используется:

sessionId

deviceId optional

10.2 After Auth

Используется:

userId

role

10.3 Important Rule

События до и после авторизации должны быть связаны.

11. Session Tracking
11.1 Session Definition

Session — это период активности пользователя.

11.2 Required Data

sessionId

startedAt

lastActivityAt

device/platform

11.3 Why

Это нужно для:

понимания поведения

анализа retention

анализа conversion

12. Funnel Tracking
12.1 Buyer Funnel

store_viewed

product_viewed

add_to_cart

checkout_started

order_created

12.2 Seller Funnel

seller_registered

store_created

store_submitted

seller_approved

product_created

order_received

13. Storage Strategy
13.1 V0.1 Storage

Analytics можно хранить в PostgreSQL.

Таблица:

events

jsonb metadata

13.2 Future

Позже можно:

ClickHouse

BigQuery

Data warehouse

Но не нужно усложнять на MVP.

14. Queue Integration

Все analytics события должны идти через queue.

14.1 Why

не блокирует API

retry при ошибках

scalable

decoupled

15. Performance Rules

не отправлять события синхронно

не логировать слишком много событий

минимальный payload

не дублировать события

16. Privacy Rules

не хранить лишние персональные данные

не логировать телефоны открыто

не хранить sensitive content из чата

не хранить адреса в raw виде без необходимости

17. Admin Usage

Admin должен видеть:

сколько заказов

сколько seller-ов

conversion

pending sellers

На V0.1 можно делать через:

простые агрегаты

или отдельные endpoints

18. Future Extensions

Позже можно добавить:

retention analytics

cohort analysis

LTV

recommendation engine

fraud detection

seller performance dashboards

19. Testing

Проверить:

order_created всегда отправляется

нет дубликатов

события приходят в storage

metadata корректна

события не ломают API

20. Final Rules

analytics должны быть минимальными, но правильными

backend события важнее frontend

всё идёт через queue

структура событий единая

не перегружать систему

думать о будущем, но не усложнять сейчас

Главная цель analytics слоя:
дать прозрачность продукту, чтобы понимать рост, проблемы и поведение пользователей без перегрузки системы и команды.