# Архитектурный аудит проекта Savdo Builder

## Контекст

Задача понимается так: нужен не пересказ md-файла, а архитектурный аудит проекта на ранней стадии — где уже хорошо, где недоопределено, где заложены будущие проблемы, и что нужно усилить сейчас, чтобы потом не пришлось ломать фундамент.

Общий вывод:

**Фундамент хороший, но сейчас проект выглядит сильнее как «технический план сборки», чем как «управляемая продуктовая система».**

То есть уже неплохо описано **что строить**, но еще не до конца зафиксировано:
- что нельзя делать,
- какие инварианты продукта обязательны,
- как принимать архитектурные решения,
- как измерять реальную ценность,
- какие вещи могут убить масштабируемость не по трафику, а по операционке.

---

## 1. Что уже сделано очень правильно

### 1.1. Верно выбран продуктовый угол

Правильно определено, что это **не маркетплейс**, а **store-builder для Telegram-продавцов**.

Если бы проект пошёл в «общий каталог товаров», сразу выросла бы сложность:
- discovery,
- ranking,
- trust,
- moderation,
- disputes,
- payments,
- returns,
- anti-fraud.

Текущая модель проще и реалистичнее:
- один продавец → один магазин,
- Telegram не заменяется, а усиливается,
- ключевая метрика MVP — продавец быстро получил первый заказ.

### 1.2. Верно выбран архитектурный стиль

**Modular Monolith** для старта — лучший выбор.

Почему это хорошо:
- маленькая команда,
- быстрая координация,
- единая транзакционная модель,
- меньше DevOps-нагрузки,
- проще поддерживать консистентность заказов, товаров, чатов и уведомлений.

### 1.3. Хороший технологический baseline

Связка:
- Next.js
- NestJS
- PostgreSQL
- Prisma
- pnpm + Turborepo
- R2/S3-compatible storage

— это зрелый и рациональный стек для такого MVP.

### 1.4. Уже есть мышление в терминах ограничений

Уже заложены:
- one-seller cart,
- snapshot у заказа,
- soft delete,
- ownership checks,
- storeId isolation,
- rate limiting,
- hard MVP scope.

Это сильный фундамент.

---

## 2. Главные архитектурные пробелы

### 2.1. Не хватает явных product invariants

Сейчас есть features, endpoints, роли, но почти нет формализованных **инвариантов системы**.

Нужно добавить отдельный раздел:

## Product / Domain Invariants

Примеры:
1. Один seller владеет ровно одним store в MVP.
2. Покупатель не может оформить заказ с позициями из разных stores.
3. Order immutable в части состава items после создания.
4. Snapshot order items обязателен и не зависит от текущего product state.
5. Store slug неизменяем после публикации либо меняется только через controlled migration.
6. Удаление product не удаляет исторические order items.
7. Variant — единственная покупаемая сущность.
8. Store cannot be public until minimum onboarding complete.
9. Blocked seller loses write access immediately, but historical data remains visible to admin.
10. Store moderation state управляет публичной доступностью storefront.

### 2.2. Модель store publication / moderation не доведена до конечного состояния

Булевы поля вроде `isActive` и `isVerified` почти всегда приводят к неясным комбинациям.

Нужно заменить на явный state machine:

```ts
enum StoreStatus {
  DRAFT,
  PENDING_REVIEW,
  APPROVED,
  REJECTED,
  SUSPENDED,
  ARCHIVED
}
```

То же самое желательно сделать для seller verification.

### 2.3. Не до конца продумана identity model покупателя

Сейчас buyer выглядит как guest:
- просмотр без регистрации,
- заказ по телефону,
- чат buyer↔seller.

Главный вопрос: **кто такой buyer в системе?**

Иначе возникнут проблемы:
- как хранить анонимного покупателя в чате,
- как связать чат и заказ,
- как восстанавливать историю сообщений,
- как ограничить спам,
- как работать с несколькими заказами одного телефона.

#### Рекомендация
Ввести **lightweight customer identity**.

**MVP-стратегия:** global customer profile by phone + optional guest session before order.

### 2.4. Chat в MVP полезен, но недоопределён

Чат может стать самой опасной частью MVP после payments.

Проблемы:
- realtime,
- unread state,
- delivery guarantees,
- moderation,
- spam control,
- buyer identity ambiguity,
- media handling,
- socket auth edge cases.

#### Что оставить в MVP:
- text-only chat,
- attachment = нет или только 1 image type,
- только 2 thread types: product inquiry, order thread,
- no presence,
- no typing indicator,
- no reactions,
- no delete/edit,
- no voice,
- no search.

#### Альтернатива
На MVP можно оставить:
- «Написать в Telegram»
- order comments

А полноценный internal chat сделать в MVP+1.

### 2.5. Push notifications в MVP — перегруз

Web push для V0.1 почти наверняка лишняя сложность.

Лучше заменить на:
- **Telegram notifications for seller**
- **in-app notification center**

### 2.6. Order model недостаточно глубока для реального бизнеса

Нужно добавить поля:
- `source`
- `paymentMethod`
- `deliveryPrice`
- `subtotal`
- `discountAmount`
- `currency`
- `customerNote`
- `sellerInternalNote`
- `confirmedAt`
- `completedAt`
- `cancelledAt`
- `cancelReason`
- `fulfillmentType`

### 2.7. Inventory semantics не определена до конца

Нужно зафиксировать:
- уменьшается ли stock в момент order creation или confirm,
- резервируется ли stock,
- что происходит при отмене,
- допускается ли overselling.

Минимум — formalized business rule.

---

## 3. Главные продуктовые пробелы

### 3.1. Не описан seller onboarding как конверсионный funnel

Нужен явный путь активации:
1. Seller enters phone
2. OTP verify
3. Creates store name
4. Auto-generates slug
5. Adds first product
6. Uploads first image
7. Publishes store
8. Copies store link
9. Shares to Telegram
10. Gets first order

Ивенты:
- `signup_started`
- `otp_verified`
- `store_created`
- `first_product_created`
- `store_published`
- `store_link_copied`
- `first_order_received`

### 3.2. Не хватает customer acquisition loop

Нужен явный loop:

**seller creates product → shares storefront link → buyer visits → order placed → seller sees value → adds more products → invites other sellers**

### 3.3. Не описан trust layer для покупателей

Для buyer-side доверия стоит добавить:
- visible store avatar/logo,
- seller display name,
- Telegram link,
- verified badge только после реальной проверки,
- contact phone,
- simple delivery/pickup policy,
- last update / active products count.

---

## 4. Что стоит упростить в MVP

Я бы убрал или понизил приоритет:
- Web Push
- Полноценный buyer chat как rich feature
- Слишком сложную модерацию на старте
- Глобальные + store-level categories одновременно

Для MVP лучше:
- простая модерация,
- store-level categories first,
- максимум фокуса на first order.

---

## 5. Что нужно добавить обязательно

### 5.1. Analytics/Event Tracking с первого дня

Нужен отдельный раздел событий.

**Seller events:**
- signup_started
- otp_verified
- store_created
- first_product_created
- store_published
- store_link_copied
- order_status_changed

**Buyer events:**
- storefront_viewed
- product_viewed
- variant_selected
- add_to_cart
- checkout_started
- order_created
- telegram_clicked
- chat_started

### 5.2. ADR — Architecture Decision Records

Нужна папка `docs/adr/`.

Фиксировать решения:
- почему modular monolith,
- почему one store per seller,
- почему no payments in MVP,
- почему chat limited,
- почему Cloudflare R2,
- почему custom admin instead of React Admin.

### 5.3. Error taxonomy и observability

Нужно определить:
- error codes,
- business errors,
- validation errors,
- auth/session errors,
- rate limit errors,
- ownership violation,
- moderation status blocked.

И добавить:
- structured logging,
- request id / correlation id,
- audit logs,
- monitoring exceptions,
- alerts на critical failures.

### 5.4. Audit log

Обязательно логировать:
- admin approve/reject/ban,
- seller price changes,
- order status changes,
- store publication changes.

### 5.5. Feature flags

Минимально:
- `CHAT_ENABLED`
- `OTP_REQUIRED`
- `STORE_APPROVAL_REQUIRED`
- `PUSH_ENABLED`

---

## 6. Конкретные пробелы в backend-дизайне

### 6.1. Prisma schema пока больше концептуальная, чем production-ready

Нужно усилить:
- `updatedAt` почти во все сущности,
- индексы,
- unique constraints,
- audit fields,
- moderation/status enums,
- nullable/required policy,
- media как отдельную таблицу.

#### Почему `images String[]` — слабое место

Проблемы:
- нет нормального порядка,
- нет alt/meta,
- нет cover image semantics,
- нет soft delete,
- нет moderation per image.

Лучше отдельная сущность `ProductImage`.

### 6.2. Sessions model недостаточно раскрыта

Нужно определить:
- device sessions,
- revoke all sessions,
- password reset flow,
- OTP resend strategy,
- trusted sessions,
- session metadata.

### 6.3. Files module требует policy

Нужно определить:
- presigned upload или upload via backend,
- image resize strategy,
- thumbnail generation,
- max images per product,
- allowed formats,
- cleanup orphan files,
- naming convention.

---

## 7. Пробелы во frontend / UX

### 7.1. Seller dashboard должен быть заточен под скорость

Главные действия продавца:
- быстро добавить товар,
- быстро обработать заказ,
- быстро скопировать ссылку.

Анти-паттерн: делать seller panel как тяжёлую корпоративную CRM.

### 7.2. Buyer storefront должен быть ориентирован на Telegram traffic

Нужно заложить:
- быстрый TTFB,
- mobile-first UX,
- минимум визуального шума,
- clear CTA,
- sticky cart/footer CTA,
- lazy loading,
- минимальный checkout.

### 7.3. Нужен mobile-first seller panel ещё до Expo

До выхода mobile app web seller panel уже должна быть:
- fully responsive,
- touch-friendly,
- optimized for quick actions.

---

## 8. Что стоит изменить в roadmap

### Мой порядок

#### Phase A — Core foundation
- auth
- store
- product
- media
- storefront publish
- checkout
- orders

#### Phase B — Activation and pilot readiness
- onboarding funnel polish
- share link flow
- seller order handling
- analytics events
- admin approval basics

#### Phase C — Retention features
- chat
- Telegram notifications
- basic insights
- repeat order helpers

#### Phase D — Expansion
- payments
- mobile app
- advanced moderation
- seller analytics
- marketplace-like discovery experiments

Сначала нужно доказать:
1. seller быстро создаёт витрину,
2. buyer реально делает заказ,
3. seller возвращается в продукт.

---

## 9. Что может сломать проект, если не исправить заранее

### 9.1. Scope creep

Нужен backlog с категориями:
- MVP Core
- Pilot Needed
- Later
- Rejected for now

### 9.2. Перегруз backend lead-а

Нужны fallback paths:
- Eskiz fallback → console OTP in dev,
- push fallback → Telegram notification,
- chat fallback → order comments + telegram deep-link.

### 9.3. Недооценка ops/admin-support нагрузки

Нужно описать operations model:
- кто одобряет магазины,
- кто блокирует мошенников,
- кто разбирает пропавшие заказы,
- кто чистит медиа,
- кто отвечает за восстановление данных.

---

## 10. Что добавить в master document прямо сейчас

### Новые разделы
1. Product Invariants
2. Store Status State Machine
3. Customer Identity Model
4. Analytics Events
5. Notification Strategy
6. Operational Playbooks
7. Audit Logging Policy
8. Error Taxonomy
9. Feature Flags
10. ADR Index
11. Performance Budget
12. Security & Abuse Cases
13. Data retention / backup / restore policy
14. Pilot rollout plan
15. Backlog by priority tiers

---

## 11. Архитектурные рекомендации по стеку

### Backend
Оставить:
- NestJS
- PostgreSQL
- Prisma
- Redis/BullMQ только там, где реально нужно

Но:
- сразу внедрить module boundaries,
- DTO + domain services separation,
- не смешивать admin logic с seller logic,
- order creation делать транзакционно,
- audit log сделать first-class module.

### Frontend
Вариант с отдельными apps (`web`, `seller`, `admin`) оставлять можно, но shared UI и typed API client должны быть очень дисциплинированными.

### Mobile
Expo — нормальный выбор, но строго после подтверждения pilot-value.

---

## 12. Итоговый вердикт

### Сильные стороны
- верный product angle,
- разумный MVP,
- хороший стек,
- правильная high-level архитектура,
- нормальный decomposition,
- есть понимание рисков,
- нет опасного «давайте сразу всё».

### Слабые стороны
- не хватает доменных инвариантов,
- buyer identity и chat model пока сырые,
- push/realtime scope перегружает MVP,
- moderation/store lifecycle слишком поверхностные,
- analytics/observability/audit не оформлены как часть системы,
- roadmap чуть больше технический, чем product-driven.

### Оценка текущей подготовки

**8/10 как стартовый архитектурный фундамент.**

До идеала не хватает не ещё пары технологий, а именно **системной формализации правил**.

То есть следующий шаг — перейти от «плана фич» к «операционной модели продукта».

---

## 13. Следующий шаг

Самый сильный следующий ход — подготовить **Savdo Builder v1.1 Architecture Addendum**, куда войдут:
- domain invariants,
- store/customer/order state models,
- reduced MVP scope decision,
- analytics events,
- audit/error/ops policy,
- feature flags,
- pilot rollout logic.

После этого кодить будет намного безопаснее: вы будете не переделывать фундамент, а только наращивать функциональность.

