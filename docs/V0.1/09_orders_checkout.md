# 09_orders_checkout.md

## 1. Orders and Checkout Overview

Checkout и order domain — это ядро всей платформы.  
Именно здесь продукт перестаёт быть просто “витриной” и становится полноценной торговой системой.

На V0.1 checkout и orders должны решать следующие задачи:

- переводить intent в реальный заказ
- сохранять историческую корректность данных
- поддерживать seller-centric модель
- учитывать локальный рынок, где cash on delivery очень важен
- поддерживать и buyer, и seller operational flows
- не зависеть от сложной логистической инфраструктуры
- оставлять пространство для будущего online payment flow

Главная цель:
сделать процесс заказа простым для buyer-а и управляемым для seller-а, не усложняя систему тем, что пока не нужно.

---

## 2. Scope of Checkout on V0.1

## 2.1 In Scope
- cart for one store
- cart validation
- variant-aware checkout
- guest-style checkout with phone-based lightweight identity
- customer contact capture
- address capture
- pickup / delivery mode
- seller-defined delivery fee model
- order creation
- order status lifecycle
- buyer cancellation before seller confirmation
- seller confirm / cancel
- order-bound chat
- order history for buyer and seller
- cash on delivery as first-class payment method

## 2.2 Out of Scope
- multi-seller checkout
- marketplace-wide combined cart
- automated logistics
- courier assignment
- advanced refund engine
- partial refunds
- split payments
- split shipments
- warehouse orchestration
- coupon engine
- dynamic shipping integrations

---

## 3. Core Product Rules

## 3.1 One Cart = One Seller
Это жёсткое системное правило.

Buyer не может оформить один заказ из товаров разных sellers/stores.

### Why
- проще UX
- проще order ownership
- проще pricing
- проще cancellation flow
- проще chat binding
- проще future payments
- проще seller operations

Если buyer пытается добавить товар из другого магазина:
- либо предлагается очистить текущую корзину
- либо создаётся отдельная новая корзина по продуктовой политике

На V0.1 лучше придерживаться более явного UX:
- одна активная корзина на store context
- при конфликте показывать явное предупреждение

---

## 4. Cart Model

## 4.1 Cart Purpose
Корзина — это подготовительное состояние перед заказом.

Она должна хранить:
- store context
- items
- selected variants
- quantities
- pricing snapshots for UX stability
- buyer/session identity linkage

## 4.2 Cart Ownership
Cart может быть связан:
- с session key для anonymous buyer
- с buyer profile после phone verification / checkout identity step

## 4.3 Cart Lifecycle
Основные состояния:
- active
- converted
- abandoned
- expired

### Principles
- cart should be recoverable while session valid
- cart should be invalidated cleanly after order creation
- cart should not remain authoritative after conversion

---

## 5. Cart Item Model

## 5.1 Purchasable Unit
В корзину добавляется:
- конкретный variant
или
- default purchasable variant для товара без явных вариантов

Нельзя опираться только на product id без точной purchasable unit semantics.

## 5.2 Cart Item Data
Cart item должен учитывать:
- product id
- variant id
- quantity
- pricing snapshot
- display label for chosen options

## 5.3 Quantity Rules
- quantity must be positive integer
- quantity must not exceed available stock by policy
- stock validation must happen again at checkout

---

## 6. Checkout Flow Overview

## 6.1 Canonical Buyer Checkout Flow

1. buyer adds items to cart
2. buyer opens checkout
3. system validates current cart state
4. buyer enters or confirms:
   - full name
   - phone
   - delivery/pickup
   - address if needed
   - comment
   - payment method
5. system creates lightweight identity if needed
6. checkout preview/validation finalizes
7. order is created
8. cart becomes converted
9. order chat becomes available
10. seller receives in-app and push notification

---

## 7. Buyer Identity During Checkout

## 7.1 Guest-Like Checkout
На V0.1 buyer UX должен выглядеть почти как guest checkout.

Но система всё равно должна иметь устойчивую identity для:
- order history
- chat
- notifications
- status updates

## 7.2 Recommended Model
Guest-like flow through phone confirmation:
- buyer can browse and cart anonymously
- at checkout buyer confirms phone
- system creates or attaches buyer profile
- order binds to buyer identity

### Why
Это даёт лучший баланс между:
- conversion
- persistence
- operational clarity

---

## 8. Checkout Fields

## 8.1 Required Fields
Для V0.1 checkout должен собирать:

- customer full name
- customer phone
- delivery type
- address fields if delivery
- comment optional
- payment method

## 8.2 Delivery Case
Если selected delivery type = delivery:
- city
- region optional
- address line
- landmark optional

## 8.3 Pickup Case
Если selected delivery type = pickup:
- address fields may be omitted
- pickup notes can be shown from store settings

## 8.4 Why Minimalism Matters
Checkout должен быть коротким.  
Чем длиннее форма, тем выше шанс, что buyer уйдёт обратно в Telegram.

---

## 9. Delivery Model

## 9.1 Product Rule
Платформа не занимается автоматизацией логистики на V0.1.

Но checkout всё равно должен поддерживать базовую delivery semantics.

## 9.2 Supported Modes
- delivery
- pickup

## 9.3 Store Delivery Settings Influence
Seller настраивает:
- supports delivery
- supports pickup
- delivery fee mode
- fixed delivery fee or manual logic note

## 9.4 Delivery Fee Strategy
На V0.1 допустимы:
- fixed delivery fee
- zero delivery fee
- manual fee policy only if product rule clearly defined

### Recommended V0.1 operational simplification
Для MVP лучше в order total использовать:
- fixed fee
или
- zero

Если seller работает по manual fee logic, нужно очень аккуратно отражать это в UX, чтобы не ломать trust.
Лучше не перегружать checkout слишком сложной delivery math на старте.

---

## 10. Payment Model

## 10.1 Payment Methods on V0.1
Поддерживаемые методы:
- cash on delivery
- manual transfer / manual agreement
- online payment as future expansion point

## 10.2 Primary Method
Primary method for current target market:
- cash on delivery

Это должно быть first-class path, а не “временная заглушка”.

## 10.3 Why This Matters
Если checkout будет слишком ориентирован только на online payments, это не совпадёт с реальным поведением рынка.

---

## 11. Online Payment Positioning

## 11.1 Strategic Position
Online payment нужно закладывать архитектурно, но не делать центральной опорой V0.1, если это тормозит запуск и усложняет весь order lifecycle.

## 11.2 What Must Be Ready Even Before Full Integration
Даже без полного online acquiring, order schema и checkout domain должны уже иметь:
- payment_method
- payment_status
- room for transaction reference later
- extensible order lifecycle

---

## 12. Checkout Validation

Checkout должен валидировать больше, чем просто поля формы.

## 12.1 Required Validation
- cart exists
- cart belongs to one store
- store is public and active
- seller/store not suspended
- all products active/visible according to policy
- selected variants valid
- stock sufficient
- quantity valid
- delivery type supported by store
- phone/name valid
- address valid for delivery case

## 12.2 Revalidation Principle
Даже если buyer видел всё корректно на product/cart screens, checkout обязан всё перепроверить.

Frontend never guarantees order correctness.

---

## 13. Checkout Preview

## 13.1 Why Useful
Перед final order creation полезен preview step / preview endpoint, который:
- пересчитывает totals
- validates cart
- confirms delivery fee logic
- returns final payable summary

## 13.2 Preview Output
Should include:
- item summaries
- quantity
- unit prices
- line totals
- subtotal
- delivery fee
- total
- store context
- warnings if any

### Note
Preview не заменяет final validation during confirm.
Final confirm must validate again.

---

## 14. Order Creation Flow

## 14.1 Canonical Backend Flow

1. resolve buyer identity or create lightweight buyer profile
2. load active cart
3. validate cart/store/products/variants/stock
4. compute authoritative totals
5. create order
6. create order item snapshots
7. create order status history entry
8. create or initialize order chat thread
9. mark cart as converted
10. emit order created domain event
11. enqueue notifications

## 14.2 Transaction Boundary
Шаги от order creation до cart conversion должны быть transactional.

Это critical business flow.

---

## 15. Order Snapshot Principle

## 15.1 Why Mandatory
После оформления заказа товар может измениться:
- title
- description
- price
- sale state
- stock
- image
- category

Но заказ должен сохранять своё исторически корректное состояние.

## 15.2 Snapshot Fields
В order items нужно snapshot-ить:
- product title
- product description optional
- selected variant label
- SKU
- unit price
- old price
- sale price
- image preview URL
- quantity
- line total

## 15.3 Result
Order detail должен корректно читаться даже если product later hidden, edited or deleted.

---

## 16. Stock Handling

## 16.1 V0.1 Principle
Stock must be respected, but inventory policy не должна превращаться в складскую ERP-систему.

## 16.2 Required Stock Behavior
- stock lives on variant level
- cart add validates current stock roughly
- checkout confirm validates stock authoritatively
- order creation updates inventory according to selected policy

## 16.3 Accepted Stock Policy (V0.1 Decision)

**Выбранная политика: немедленное списание при создании заказа с восстановлением при отмене.**

Правила:
- при создании заказа: `stock_quantity -= quantity` для каждого variant
- при отмене заказа (buyer до подтверждения или seller): `stock_quantity += quantity` восстанавливается
- при завершении заказа (completed): stock не изменяется, уже списан

Это фиксируется через `inventory_movements` запись при каждом изменении.

Причины выбора:
- простой mental model для команды
- меньше риска overselling
- restore logic прямолинейный
- не требует состояния "reserved"

## 16.4 Implementation Rules
- stock validation происходит в той же транзакции, что и создание order
- если stock недостаточен для любого из items → всё отклоняется с явной ошибкой
- `inventory_movements` пишется атомарно с order creation
- `movement_type`:
  - `order_reserved` — при создании заказа
  - `order_released` — при отмене (restore)
  - `order_completed` — при завершении (informational)
  - `manual_adjustment` — ручная коррекция через admin/seller

---

## 17. Order Status Lifecycle

## 17.1 V0.1 Statuses
- pending
- confirmed
- cancelled
- completed

## 17.2 Meaning

### pending
Order placed by buyer, awaiting seller action

### confirmed
Seller accepted order

### cancelled
Order cancelled either by buyer before confirmation or by seller/admin policy

### completed
Order fulfilled / delivered / closed operationally

## 17.3 Why Keep It Simple
Слишком раннее добавление:
- packed
- shipped
- delivered
- returned
может перегрузить seller UX и admin model

Но backend должен быть готов к future expansion.

---

## 18. Status Transition Rules

## 18.1 Allowed Buyer Actions
Buyer can:
- place order
- cancel order only before seller confirmation

## 18.2 Allowed Seller Actions
Seller can:
- confirm pending order
- cancel/reject pending order
- mark confirmed order as completed

## 18.3 Admin Actions
Admin can inspect and, if policy allows, intervene manually with auditable actions

## 18.4 Example Transition Matrix

- pending → confirmed
- pending → cancelled
- confirmed → completed
- confirmed → cancelled only by exceptional/admin/policy case if allowed later
- completed → no ordinary transition

---

## 19. Buyer Cancellation

## 19.1 Rule
Buyer cancellation is allowed only before seller confirms order.

## 19.2 Why
Это сохраняет справедливый и простой operational model:
- buyer can correct mistake quickly
- seller isn’t disrupted after confirmation stage

## 19.3 Effects of Buyer Cancellation
- order status becomes cancelled
- status history entry created
- stock restored if deducted/reserved
- seller notified
- order chat remains as historical context or becomes read-only by policy

---

## 20. Seller Rejection / Cancellation

## 20.1 Rule
Seller can reject/cancel pending order.

## 20.2 Typical Reasons
- item out of stock
- seller cannot fulfill
- invalid order context
- operational issue

## 20.3 Effects
- order status becomes cancelled
- stock restored if needed
- buyer notified
- reason may be recorded for audit/UX clarity

---

## 21. Order Completion

## 21.1 Rule
Seller can mark confirmed order as completed.

## 21.2 Meaning
На V0.1 completion — это practical closure of fulfilled order.  
Не нужно пытаться моделировать весь logistics chain.

## 21.3 Effects
- order status becomes completed
- history entry created
- buyer notified
- order remains available in history and chat

---

## 22. Order History

## 22.1 Buyer History
Buyer должен видеть:
- own orders
- status
- totals
- item snapshots
- order dates
- chat entry
- order detail

## 22.2 Seller History
Seller должен видеть:
- store orders
- current queue
- filtered by status
- order detail
- linked chat

## 22.3 Admin Visibility
Admin должен видеть:
- all orders
- all transitions
- all linked seller/store context
- audit-worthy interventions

---

## 23. Order Detail Requirements

## 23.1 Buyer Order Detail
Must show:
- order number
- status
- items and variants
- totals
- delivery/pickup info
- comment
- payment method
- cancellation possibility if allowed
- chat entry

## 23.2 Seller Order Detail
Must show:
- buyer identity and phone
- items
- variants
- order total
- order notes
- address/pickup mode
- confirm/cancel actions
- chat entry

## 23.3 Admin Order Detail
Must show:
- full operational context
- history
- related seller/store
- chat link
- audit view

---

## 24. Order Number Strategy

## 24.1 Need
Human-readable order number is required.

UUID alone is not suitable as visible order reference.

## 24.2 Accepted Format (V0.1 Decision)

**Выбранный формат: `YYMMDD-XXXXX` где XXXXX — atomically incremented per-day sequence.**

Пример: `260318-00001`, `260318-00042`

Реализация:
- использовать PostgreSQL sequence или atomic counter in Redis
- генерировать в момент создания заказа внутри транзакции
- хранить в поле `order_number varchar(50) unique not null`

Свойства:
- читабелен человеком
- сортируется по времени
- уникален в рамках платформы
- достаточно короткий для сообщения продавцу устно

Не использовать:
- UUID как публичный номер заказа
- последовательный глобальный счётчик без prefix (легко угадать объём)

---

## 25. Pricing Model

## 25.1 Authoritative Pricing
Authoritative pricing must come from backend during checkout.

Client cannot be trusted for:
- final unit price
- sale price applicability
- line totals
- delivery fee
- total amount

## 25.2 Components
Order price consists of:
- subtotal
- discount amount if represented via old/sale price difference
- delivery fee
- total

## 25.3 Currency
V0.1 should assume single primary currency:
- UZS

Schema may remain extensible, but UX should stay simple.

---

## 26. Discounts on V0.1

## 26.1 Supported Model
На V0.1 поддерживается простая скидочная модель:
- base price
- old price
- sale price

## 26.2 Not Supported
- promo codes
- campaign engine
- bundle discount engine
- user-specific discounting

## 26.3 Checkout Behavior
If variant has price override / sale override, authoritative line pricing must be derived from variant-specific price logic.

---

## 27. Chat Binding to Orders

## 27.1 Order Chat Rule
Each order should have its own order-context thread.

## 27.2 Why Important
Это даёт:
- clear communication context
- easier seller operations
- easier dispute handling
- direct linking from order detail
- clean notification semantics

## 27.3 Thread Timing
Recommended:
- create order thread on order creation
- expose it immediately after order placed

---

## 28. Notifications Around Orders

## 28.1 Buyer Notifications
Buyer should receive:
- order created
- order confirmed
- order cancelled
- order completed
- new message in order chat

## 28.2 Seller Notifications
Seller should receive:
- new order
- buyer cancellation
- new message in order chat
- relevant admin actions later

## 28.3 Delivery Channels
- realtime if active
- push/web push if not actively viewing
- Telegram notification for seller as configured

---

## 29. Error Handling in Checkout

Checkout failures must be explicit and understandable.

## 29.1 Common Error Cases
- cart empty
- cart store mismatch
- product unavailable
- variant unavailable
- insufficient stock
- invalid phone
- invalid address
- delivery mode unsupported
- seller/store suspended
- stale cart state

## 29.2 UX Principle
Error should guide action:
- update cart
- change variant
- refresh checkout
- re-enter info

Не должно быть “order failed” без объяснения.

---

## 30. Recovery and Idempotency

## 30.1 Why Important
Checkout — чувствительная зона.  
Повторный тап, network retry или reconnect не должны создавать хаос.

## 30.2 Recommended Strategy
- protect order creation with idempotency strategy where practical
- ensure repeated final submit does not create duplicate orders easily
- client should handle pending mutation state properly

## 30.3 Result
Это особенно важно на mobile under weak network conditions.

---

## 31. Admin and Manual Intervention

## 31.1 Admin Role in Orders
На V0.1 admin primarily:
- inspects orders
- investigates issues
- sees history and linked chat

## 31.2 Manual Overrides
If manual status override exists:
- must be rare
- must be explicit
- must be audited
- must not silently bypass history

---

## 32. Returns and Refunds on V0.1

## 32.1 Product Rule
Automated refund/return engine is out of scope.

## 32.2 Practical Rule
Post-delivery returns:
- handled manually
- discussed through chat
- governed by seller policy
- may later involve admin if dispute mechanisms evolve

## 32.3 Why
Это сохраняет MVP manageable while still allowing real-world problem handling.

---

## 33. Key API Surfaces

### Suggested endpoints

```http
GET    /api/v1/cart/current
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id

POST   /api/v1/checkout/preview
POST   /api/v1/checkout/confirm

GET    /api/v1/buyer/orders
GET    /api/v1/buyer/orders/:id
PATCH  /api/v1/buyer/orders/:id/cancel

GET    /api/v1/seller/orders
GET    /api/v1/seller/orders/:id
PATCH  /api/v1/seller/orders/:id/confirm
PATCH  /api/v1/seller/orders/:id/cancel
PATCH  /api/v1/seller/orders/:id/complete

34. Testing Priorities
34.1 Critical Flows

add to cart

one-store cart enforcement

change quantity

cart survives identity transition

checkout preview

create order

create order with variant pricing

buyer cancel before confirmation

seller confirm

seller cancel

seller complete

stock restore on cancellation

order chat creation

34.2 Failure Cases

duplicate checkout submission

stale stock

hidden/suspended product during checkout

suspended store

invalid delivery selection

bad phone validation

network interruption during confirm

35. Final Orders and Checkout Rules

one cart belongs to one store only

checkout must feel simple even if backend logic is strict

backend is the only source of truth for totals, stock and order validity

order data must be snapshot-based

cash on delivery is a first-class path, not a fallback

buyer can cancel only before seller confirmation

seller can confirm, cancel or complete according to policy

order chat must be tightly linked to order context

logistics are not automated, but delivery/pickup semantics must still be explicit

future payments and richer statuses must be possible without breaking the V0.1 model

Главная цель order/checkout слоя:
сделать оформление покупки понятным и надёжным для buyer-а, а обработку заказа — простой и управляемой для seller-а и платформы.