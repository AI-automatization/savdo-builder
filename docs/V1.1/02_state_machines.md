# 02_state_machines.md — State Machines

Формальные описания состояний и допустимых переходов для ключевых сущностей.

Правило: **любой переход, не перечисленный в таблице допустимых переходов, запрещён** и должен возвращать domain error.

---

## 1. Store Status

### Состояния

| Статус | Описание |
|--------|----------|
| `DRAFT` | Store создан, не отправлен на проверку |
| `PENDING_REVIEW` | Seller отправил на проверку, ждёт решения admin |
| `APPROVED` | Admin одобрил. Store может быть публичным (`is_public = true`) |
| `REJECTED` | Admin отклонил с причиной. Seller может исправить и переотправить |
| `SUSPENDED` | Admin приостановил активный магазин. `is_public = false` автоматически |
| `ARCHIVED` | Магазин деактивирован. Финальное состояние, только admin может восстановить |

### Допустимые переходы

| Из | В | Кто | Условие |
|----|---|-----|---------|
| `DRAFT` | `PENDING_REVIEW` | Seller | Минимальный onboarding завершён (INV-S03) |
| `DRAFT` | `ARCHIVED` | Seller | Seller удаляет незаконченный магазин |
| `PENDING_REVIEW` | `APPROVED` | Admin | — |
| `PENDING_REVIEW` | `REJECTED` | Admin | comment обязателен |
| `REJECTED` | `PENDING_REVIEW` | Seller | После исправлений |
| `REJECTED` | `ARCHIVED` | Seller | Seller отказывается от магазина |
| `APPROVED` | `SUSPENDED` | Admin | comment обязателен |
| `APPROVED` | `ARCHIVED` | Admin | — |
| `SUSPENDED` | `APPROVED` | Admin | — |
| `SUSPENDED` | `ARCHIVED` | Admin | — |
| `ARCHIVED` | `DRAFT` | Admin | Только экстраординарный случай |

### Side effects при переходах

- `→ APPROVED`: `is_public` остаётся `false` пока seller сам не нажмёт "Опубликовать"
- `→ SUSPENDED`: `is_public = false` немедленно
- `→ ARCHIVED`: `is_public = false` немедленно
- Любой переход: создать запись `moderation_actions`, `audit_logs`
- `→ APPROVED` / `→ REJECTED`: отправить seller уведомление

### Prisma enum

```prisma
enum StoreStatus {
  DRAFT
  PENDING_REVIEW
  APPROVED
  REJECTED
  SUSPENDED
  ARCHIVED
}
```

---

## 2. Seller Verification Status

### Состояния

| Статус | Описание |
|--------|----------|
| `UNVERIFIED` | Seller только зарегистрировался, документы не поданы |
| `PENDING` | Документы поданы, ждут проверки admin |
| `VERIFIED` | Документы проверены, seller получает верифицированный бейдж |
| `REJECTED` | Документы отклонены с причиной |
| `SUSPENDED` | Seller заблокирован — write access отключён немедленно |

### Допустимые переходы

| Из | В | Кто | Условие |
|----|---|-----|---------|
| `UNVERIFIED` | `PENDING` | Seller | Загружены документы |
| `PENDING` | `VERIFIED` | Admin | — |
| `PENDING` | `REJECTED` | Admin | comment обязателен |
| `REJECTED` | `PENDING` | Seller | После загрузки новых документов |
| `VERIFIED` | `SUSPENDED` | Admin | comment обязателен |
| `SUSPENDED` | `VERIFIED` | Admin | — |

> Примечание: в V0.1 `verification_status` и `is_blocked` — два отдельных поля в sellers. В V1.1 рекомендуется сохранить `is_blocked` как быстрый runtime flag, а `verification_status` использовать для документооборота.

### Prisma enum

```prisma
enum SellerVerificationStatus {
  UNVERIFIED
  PENDING
  VERIFIED
  REJECTED
  SUSPENDED
}
```

---

## 3. Order Status

### Состояния

| Статус | Описание |
|--------|----------|
| `PENDING` | Заказ создан, ждёт подтверждения seller-а |
| `CONFIRMED` | Seller подтвердил заказ |
| `PROCESSING` | Seller готовит / собирает заказ |
| `SHIPPED` | Заказ отправлен / передан курьеру |
| `DELIVERED` | Заказ доставлен покупателю (финальное success состояние) |
| `CANCELLED` | Заказ отменён (финальное cancelled состояние) |

### Допустимые переходы

| Из | В | Кто | Условие |
|----|---|-----|---------|
| `PENDING` | `CONFIRMED` | Seller | — |
| `PENDING` | `CANCELLED` | Seller | comment рекомендуется |
| `PENDING` | `CANCELLED` | Buyer | — |
| `CONFIRMED` | `PROCESSING` | Seller | — |
| `CONFIRMED` | `CANCELLED` | Seller | comment обязателен |
| `PROCESSING` | `SHIPPED` | Seller | — |
| `PROCESSING` | `CANCELLED` | Seller | Экстренная отмена, comment обязателен |
| `SHIPPED` | `DELIVERED` | Seller | — |

> `DELIVERED` и `CANCELLED` — терминальные состояния. Переходов из них нет.

### Stock при переходах

| Переход | Stock action |
|---------|-------------|
| `* → created (PENDING)` | Stock списан немедленно при создании заказа |
| `PENDING → CANCELLED` | Stock восстановлен немедленно |
| `CONFIRMED → CANCELLED` | Stock восстановлен немедленно |
| `PROCESSING → CANCELLED` | Stock восстановлен немедленно |
| `SHIPPED → DELIVERED` | Нет действия (stock уже списан) |

> Подробное обоснование в [ADR-006](../adr/ADR-006_inventory_policy.md).

### Side effects при переходах

- Любой переход: append `order_status_history`
- `PENDING → CONFIRMED`: уведомление buyer (новый заказ подтверждён)
- `* → CANCELLED`: уведомление противоположной стороны + восстановить stock
- `SHIPPED → DELIVERED`: уведомление buyer

### Prisma enum

```prisma
enum OrderStatus {
  PENDING
  CONFIRMED
  PROCESSING
  SHIPPED
  DELIVERED
  CANCELLED
}
```

---

## 4. Product Status

| Статус | Описание |
|--------|----------|
| `DRAFT` | Не виден покупателям |
| `ACTIVE` | Виден в storefront при `is_visible = true` |
| `ARCHIVED` | Скрыт продавцом, хранится для истории |
| `HIDDEN_BY_ADMIN` | Скрыт admin-ом (нарушение / спор) |

### Переходы

| Из | В | Кто |
|----|---|-----|
| `DRAFT` | `ACTIVE` | Seller |
| `ACTIVE` | `DRAFT` | Seller |
| `ACTIVE` | `ARCHIVED` | Seller |
| `ARCHIVED` | `ACTIVE` | Seller |
| `ACTIVE` | `HIDDEN_BY_ADMIN` | Admin |
| `HIDDEN_BY_ADMIN` | `ACTIVE` | Admin |

```prisma
enum ProductStatus {
  DRAFT
  ACTIVE
  ARCHIVED
  HIDDEN_BY_ADMIN
}
```

---

## 5. Inventory: Stock Lifecycle

```
Order created
  └─ [tx] stock_quantity -= quantity  (variant level)
         total_stock -= quantity      (product level)
         inventory_movements record: type=ORDER_DEDUCTED

Order cancelled (any terminal cancel)
  └─ [tx] stock_quantity += quantity
         total_stock += quantity
         inventory_movements record: type=ORDER_RELEASED

Manual adjustment (seller)
  └─ [tx] stock_quantity += delta
         total_stock += delta
         inventory_movements record: type=MANUAL_ADJUSTMENT
```

**Overselling policy:** В MVP overselling запрещён. Если `stock_quantity < requested_quantity` → ошибка `INSUFFICIENT_STOCK` при checkout. Нет резервирования, нет "мягкого" списания — только hard block.

---

## 6. Subscription FSM (BILLING-MACHINE-001)

State machine жизненного цикла подписки seller-а на платный тариф. Управляет доступом к платным фичам, биллинг-циклом и churn-логикой.

### Состояния

| Статус | Описание |
|--------|----------|
| `TRIAL` | Пробный период (N дней после регистрации). Полный доступ, оплата не требуется |
| `ACTIVE` | Подписка оплачена и действует до `current_period_end`. Полный доступ к фичам тарифа |
| `PAST_DUE` | Платёж не прошёл при auto-renew. Grace period (N дней) — доступ сохранён, идут retry попытки |
| `SUSPENDED` | Grace period истёк без оплаты. Доступ к платным фичам отключён, store → `is_public = false`. Можно восстановить оплатой |
| `CANCELLED` | Seller отменил подписку сам. Доступ сохраняется до `current_period_end`, затем → `CHURNED`. Terminal для текущего цикла |
| `CHURNED` | Финальное состояние оттока. Подписка закрыта, доступ к платным фичам отключён. Для возврата нужна новая подписка |

### ASCII диаграмма transitions

```
                      ┌─────────────────────────────────────────┐
                      │                                         │
                      ▼                                         │
   register     ┌─────────┐   pay_success    ┌─────────┐        │ pay_success
   ───────────► │  TRIAL  │ ───────────────► │ ACTIVE  │ ◄──────┤
                └────┬────┘                  └────┬────┘        │
                     │                            │             │
                     │ trial_expired              │ renew_failed│
                     │ (no payment)               │             │
                     ▼                            ▼             │
                ┌─────────┐                  ┌──────────┐       │
                │ CHURNED │ ◄──────────────  │ PAST_DUE │ ──────┘
                └─────────┘  grace_expired   └────┬─────┘
                     ▲                            │
                     │                            │ grace_expired
                     │                            ▼
                     │ period_end           ┌───────────┐
                     │ ◄──────────────────  │ SUSPENDED │
                     │                      └─────┬─────┘
                     │                            │
                     │                            │ pay_success
                     │                            ▼
                     │                      ┌─────────┐
                     │       cancel         │ ACTIVE  │
                     │ ◄──────────────────  └────┬────┘
                     │                           │ cancel
                ┌─────────────┐                  │
                │  CANCELLED  │ ◄────────────────┘
                └──────┬──────┘
                       │ period_end
                       ▼
                  (→ CHURNED)
```

> `CHURNED` — терминальное состояние. Выход только через создание новой подписки (новый ряд в `subscriptions`).
> `CANCELLED` — terminal для текущего billing cycle: доступ сохраняется до `current_period_end`, затем автоматически переходит в `CHURNED`.

### Допустимые переходы

| Из | Event | В | Side effects | Audit action |
|----|-------|---|--------------|--------------|
| `(none)` | `seller_registered` | `TRIAL` | Создать запись `subscriptions`, выставить `trial_ends_at = now + TRIAL_DAYS` | `subscription.trial_started` |
| `TRIAL` | `pay_success` | `ACTIVE` | Списать платёж, выставить `current_period_end`, открыть доступ ко всем фичам тарифа | `subscription.activated` |
| `TRIAL` | `trial_expired` | `CHURNED` | Закрыть доступ к платным фичам, store → `is_public = false` если был публичен | `subscription.trial_expired` |
| `ACTIVE` | `renew_success` | `ACTIVE` | Продлить `current_period_end += period`, списать платёж | `subscription.renewed` |
| `ACTIVE` | `renew_failed` | `PAST_DUE` | Запустить retry-cron (через 1д, 3д, 7д), отправить уведомление seller-у | `subscription.payment_failed` |
| `ACTIVE` | `cancel_by_seller` | `CANCELLED` | Зафиксировать `cancelled_at`, доступ сохранён до `current_period_end` | `subscription.cancelled_by_user` |
| `PAST_DUE` | `pay_success` | `ACTIVE` | Списать платёж, восстановить `current_period_end`, отменить retry-cron | `subscription.recovered` |
| `PAST_DUE` | `grace_expired` | `SUSPENDED` | Отключить доступ к платным фичам, store → `is_public = false`, остановить retry-cron | `subscription.suspended` |
| `SUSPENDED` | `pay_success` | `ACTIVE` | Списать платёж, восстановить `current_period_end`, восстановить публичность store вручную seller-ом | `subscription.recovered` |
| `SUSPENDED` | `grace_expired` (final) | `CHURNED` | После N дней в SUSPENDED — финальный отток. Записать reason=PAYMENT_FAILED | `subscription.churned` |
| `CANCELLED` | `period_end` | `CHURNED` | Закрыть доступ к платным фичам, записать reason=USER_CANCELLED | `subscription.churned` |
| `CANCELLED` | `pay_success` | `ACTIVE` | Seller передумал до `period_end` — реактивация, очистить `cancelled_at` | `subscription.reactivated` |

> Любой переход, не перечисленный выше, запрещён и должен возвращать `INVALID_SUBSCRIPTION_TRANSITION`.

### Поведение по статусам

#### `TRIAL`
- Полный доступ ко всем фичам базового тарифа.
- Баннер в seller-кабинете: "Триал заканчивается через X дней".
- Email/TG-уведомления: за 3 дня, за 1 день, в день истечения.
- Можно оплатить досрочно — оставшийся trial конвертируется в credit или сгорает (см. ADR по биллингу).

#### `ACTIVE`
- Полный доступ. Auto-renew включён по умолчанию (`auto_renew = true`).
- За 3 дня до `current_period_end` — попытка списания. При успехе → `renew_success`. При отказе → `renew_failed → PAST_DUE`.
- Seller может включить/выключить `auto_renew` в любой момент без смены статуса.

#### `PAST_DUE`
- **Доступ сохранён** в течение grace period (default 7 дней).
- Cron-job делает retry попытки оплаты по расписанию (1д, 3д, 7д).
- Каждая неудачная попытка → уведомление seller-у (TG + email).
- При успешной оплате → `recovered → ACTIVE`. При истечении grace → `grace_expired → SUSPENDED`.
- Баннер в кабинете: "Платёж не прошёл. Обновите карту до DD.MM".

#### `SUSPENDED`
- Доступ к платным фичам **отключён**: store автоматически уходит в `is_public = false`, write-операции по платным endpoint-ам блокируются с кодом `SUBSCRIPTION_SUSPENDED`.
- Read-only доступ к собственным данным сохранён (seller видит свой кабинет, но не может публиковать).
- После оплаты → `ACTIVE`. Если `is_public` был принудительно снят системой — seller включает обратно вручную.
- Если seller не платит в течение N дней (default 30) после suspension → `CHURNED`.

#### `CANCELLED`
- Seller сам отменил подписку, но текущий оплаченный период доживает до `current_period_end`.
- Все фичи работают как в `ACTIVE` до `period_end`.
- `auto_renew = false` принудительно. Уведомления о продлении не шлются.
- Можно реактивировать платежом → `ACTIVE` (без потери оставшихся дней).
- По истечении `current_period_end` cron автоматически переводит в `CHURNED`.

#### `CHURNED`
- Терминальное состояние. Доступ к платным фичам отключён, store → `is_public = false`.
- Запись остаётся в `subscriptions` для аналитики оттока (reason: `USER_CANCELLED` / `PAYMENT_FAILED` / `TRIAL_EXPIRED`).
- Для возобновления — создаётся **новая** запись `subscriptions`, начиная с `ACTIVE` (без trial, кроме win-back кампаний).
- Данные seller-а (store, products, orders history) сохраняются — не удаляются.

### Side effects при переходах (общие)

- **Любой переход:** append `subscription_status_history` (from, to, event, actor, payment_id?, comment?).
- **Любой переход:** запись в `audit_logs` с соответствующим action.
- **→ `ACTIVE` из любого:** snapshot `current_plan_id`, `current_period_start`, `current_period_end`.
- **→ `SUSPENDED` / → `CHURNED`:** trigger SUSPEND-эффекта на store (см. Store Status FSM, секция 1).
- **→ `PAST_DUE` / → `SUSPENDED` / → `CHURNED`:** обязательное уведомление seller-у (TG + email).
- **→ `CANCELLED` / → `CHURNED`:** webhook в analytics для churn-метрик.

### Prisma enum

```prisma
enum SubscriptionStatus {
  TRIAL
  ACTIVE
  PAST_DUE
  SUSPENDED
  CANCELLED
  CHURNED
}
```

> Подробности биллинг-логики, retry-стратегий и win-back политики — см. ADR по биллингу (BILLING-MACHINE-001).
