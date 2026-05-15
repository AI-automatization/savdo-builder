# 01_domain_invariants.md — Инварианты системы

Инвариант — это правило, которое **никогда не нарушается**, независимо от actor-а, контекста или состояния системы.

Каждый инвариант обязателен к проверке на уровне service layer. Нарушение инварианта — domain error, не validation error.

---

## Seller & Store

**INV-S01** — В MVP один seller владеет ровно одним store.
> Технически: `stores.seller_id UNIQUE`. При попытке создать второй магазин — ошибка `STORE_ALREADY_EXISTS`.

**INV-S02** — Store slug неизменяем после публикации.
> После первого перехода в статус `APPROVED` slug заморожен. Изменение slug = новая URL = 404 для всех поделённых ссылок. Если изменение необходимо — только через admin action с созданием redirect-записи.

**INV-S03** — Store не может стать публичным без прохождения минимального onboarding.
> Обязательные условия перед `is_public = true`:
> - seller phone verified
> - seller full_name заполнен
> - telegram_username заполнен
> - store name заполнен
> - store slug заполнен
> - store city заполнен
> - telegram_contact_link заполнен
> - store status = `APPROVED` (admin approval получен)

**INV-S04** — Заблокированный seller теряет write access немедленно.
> `sellers.is_blocked = true` → все write endpoints возвращают `SELLER_BLOCKED`. Исторические данные (заказы, товары) остаются видимыми для admin. Покупатели не видят магазин.

**INV-S05** — Store moderation state управляет публичной доступностью.
> `is_public = true` возможен только при `status = APPROVED`. Любой переход в `SUSPENDED` или `ARCHIVED` автоматически устанавливает `is_public = false`.

---

## Product & Variant

**INV-P01** — Variant — единственная покупаемая единица.
> Покупатель всегда покупает конкретный variant, даже если у product один вариант. Cart items ссылаются на `variant_id`. Order items содержат snapshot variant-а.

**INV-P02** — Удаление product не удаляет исторические order items.
> Soft delete: `products.deleted_at` устанавливается, но `order_items` остаются нетронутыми — они хранят snapshot. `product_id` в `order_items` может стать null после физического удаления только через admin migration.

**INV-P03** — Product принадлежит ровно одному store.
> `products.store_id NOT NULL`. Product нельзя перенести между store-ами.

**INV-P04** — Variant не может существовать без product.
> CASCADE delete: при soft delete product, все его variants тоже soft deleted.

**INV-P05** — SKU variant уникален в пределах product.
> `UNIQUE(product_id, sku)` на уровне БД.

---

## Cart & Checkout

**INV-C01** — Корзина содержит товары только из одного store.
> При попытке добавить товар из другого store — ошибка `CART_STORE_MISMATCH`. Решение для покупателя: очистить корзину или создать новую сессию.

**INV-C02** — Заказ не может быть создан с товарами из разных store-ов.
> Проверяется при `checkout/confirm`. Это не может произойти технически если INV-C01 соблюдён, но проверка остаётся как defense-in-depth.

**INV-C03** — Состав заказа immutable после создания.
> После создания `order` и `order_items` — состав не изменяется. Только статус заказа может меняться. Отмена заказа не меняет order_items.

**INV-C04** — Snapshot order items обязателен и независим от текущего product state.
> `order_items` содержат: `product_title_snapshot`, `variant_label_snapshot`, `unit_price_snapshot`, `primary_image_url_snapshot`. Эти поля заполняются в момент создания заказа и после не читаются из таблицы products/variants.

---

## Orders

**INV-O01** — Order number генерируется один раз и не изменяется.
> Формат `YYMMDD-XXXXX`. После создания — immutable. Используется для внешней коммуникации с покупателем.

**INV-O02** — Переходы статусов заказа строго однонаправленны.
> Подробная state machine описана в [02_state_machines.md](02_state_machines.md). Нельзя вернуть заказ в предыдущий статус кроме явно разрешённых переходов.

**INV-O03** — История статусов заказа не удаляется.
> `order_status_history` — append-only. Никаких UPDATE или DELETE.

**INV-O04** — Stock списывается в момент создания заказа, восстанавливается при отмене.
> Подробно в ADR-006 и [02_state_machines.md](02_state_machines.md).

---

## Chat

**INV-CH01** — Chat thread привязан к конкретному product или order.
> `thread_type` определяет тип: `product` → `product_id NOT NULL`, `order` → `order_id NOT NULL`. Thread без контекста не создаётся.

**INV-CH02** — Chat messages — soft-mutable в пределах ADR-007.
> Физически append-only (нет hard-delete `DELETE FROM`). Edit — только автор,
> окно 15 минут, text-only, ставит `editedAt`. Delete — только автор, soft
> (`chat_messages.is_deleted = true` + обнуление текста). См. `docs/adr/ADR-007`.
> Обновлено 15.05.2026 — ранее «append-only, edit/delete не поддерживаются».

**INV-CH03** — Участники thread определяются при создании.
> Buyer и seller определяются при создании thread и не меняются.

---

## Admin & Moderation

**INV-A01** — Admin action всегда пишет audit log.
> Каждый admin action (approve/reject/suspend/block/restore) создаёт запись в `audit_logs` и `moderation_actions`. Без этого — operation incomplete.

**INV-A02** — Rejection требует указания причины.
> `moderation_actions.comment NOT NULL` при `action_type IN ('reject', 'suspend', 'block')`.

---

## Identity

**INV-I01** — Phone — primary identity key для buyer и seller.
> Нельзя изменить phone без OTP-верификации нового номера.

**INV-I02** — OTP не может быть переиспользован.
> После успешной верификации `otp_requests.consumed_at` устанавливается. Повторное использование — ошибка `OTP_ALREADY_CONSUMED`.

**INV-I03** — Refresh token хранится только в hashed виде.
> В `user_sessions.refresh_token_hash` — только bcrypt/argon2 hash. Plain token нигде не персистируется.
