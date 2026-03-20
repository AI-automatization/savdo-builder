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
