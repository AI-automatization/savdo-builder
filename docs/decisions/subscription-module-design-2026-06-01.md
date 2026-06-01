# BILLING-MACHINE-001 (impl plan) — Design

**Дата:** 2026-06-01
**Автор:** Полат + Claude (по бизнес-модели v2 §7)
**Статус:** 🟡 Draft (ждёт sign-off Полат/Азим)
**Контракт (canonical):** `docs/business/billing-machine-spec-v1-2026-05-31.md` (Азим, 31.05) — высокоуровневая спека FSM + DTO contract.
**Этот документ:** backend implementation plan под Азимовский контракт (Prisma модели, миграция, use-cases, cron, endpoints).
**Реализует:** `docs/business/business-model-v2-2026-05-31.md` §7 Биллинг и энфорсмент
**Связано:** ADR-003 (no payments in MVP) — теперь pivot, нужны подписки до launch.

---

## 1. Scope

**Phase 1 (этот документ):**
- Subscription entity на Seller (1:1, INV-S01-совместимо)
- 3 тарифа (STARTER / PRO / BUSINESS) — config в коде (TS constants), без `plans` таблицы
- State machine: TRIAL → ACTIVE → PAST_DUE → SUSPENDED → CHURNED (+ CANCELLED)
- 14-дневный триал на Pro
- Ручная оплата (admin отмечает paidUntil)
- Cron daily: пересчёт статусов
- Admin endpoints: extend trial, mark paid, comp, list
- Seller endpoints: get current, cancel
- Store suspend integration: при SUSPENDED → storefront 503, dashboard read-only
- Plan limits enforcement в существующих use-cases (create-product, etc)
- Audit log для всех state transitions

**Phase 2 (вне scope сейчас):**
- Click/Payme авто-charge
- Hybrid комиссия 1-3%
- Pay-as-you-go (0 подписки + 5%)
- Recurring auto-renewal
- Multi-store на Business

---

## 2. Prisma Schema

### Новые enums

```prisma
enum SubscriptionTier {
  STARTER
  PRO
  BUSINESS
}

enum SubscriptionStatus {
  TRIAL       // 14-дневный free триал на Pro features
  ACTIVE      // оплаченная активная подписка (currentPeriodEnd > now)
  PAST_DUE    // не оплатил после конца периода, grace 7 дней
  SUSPENDED   // grace истёк, store недоступен, dashboard read-only
  CHURNED     // 90+ дней SUSPENDED, готов к удалению данных
  CANCELLED   // seller сам отменил (instant, без waiting до конца периода — Phase 1 простоту)
}

enum SubscriptionPaymentMethod {
  MANUAL_TRANSFER  // ручной перевод (Phase 1)
  CLICK            // Phase 2
  PAYME            // Phase 2
  COMP             // admin-grant (beta-когорта, грандфазер, реферал — бесплатно)
}

enum SubscriptionPaymentStatus {
  PENDING     // создан запрос на оплату
  CONFIRMED   // admin подтвердил получение (Phase 1) или gateway success (Phase 2)
  REFUNDED    // возврат
  FAILED      // gateway отказ (Phase 2)
}
```

### Новые модели

```prisma
model Subscription {
  id                 String              @id @default(uuid())
  sellerId           String              @unique  // INV-S01: один seller = одна подписка
  tier               SubscriptionTier
  status             SubscriptionStatus  @default(TRIAL)

  // Trial
  trialStartedAt     DateTime?
  trialEndsAt        DateTime?

  // Активный период
  currentPeriodStart DateTime?
  currentPeriodEnd   DateTime?   // = "paidUntil" из бизнес-плана

  // Состояния
  graceEndsAt        DateTime?
  suspendedAt        DateTime?
  churnedAt          DateTime?
  cancelledAt        DateTime?

  // Phase 2 autorenew (в Phase 1 всегда false)
  autoRenew          Boolean     @default(false)

  // Скидки: BETA cohort / MIGRATION offer / REFERRAL
  discountPercent    Int         @default(0)  // 0..99
  discountEndsAt     DateTime?
  discountReason     String?     // "BETA" | "MIGRATION" | "REFERRAL_<sellerId>"

  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt

  seller   Seller                @relation(fields: [sellerId], references: [id])
  payments SubscriptionPayment[]

  @@index([status])
  @@index([currentPeriodEnd])  // cron: find expired
  @@index([graceEndsAt])        // cron: find past_due → suspend
  @@index([trialEndsAt])        // cron: find trial → past_due
  @@map("subscriptions")
}

model SubscriptionPayment {
  id             String                    @id @default(uuid())
  subscriptionId String

  amountUzs      Int                       // в UZS (целые сумы — не float)
  method         SubscriptionPaymentMethod
  status         SubscriptionPaymentStatus @default(PENDING)

  // За какой период
  periodStart    DateTime
  periodEnd      DateTime

  // Подтверждение (Phase 1 — admin вручную)
  confirmedByUserId String?
  confirmedAt       DateTime?
  notes             String?   // "Карта Полата 8600... перевод 25.05 в 14:30"

  // Phase 2 (gateway)
  externalId        String?   // Click/Payme transaction id

  createdAt         DateTime  @default(now())

  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  confirmedByUser User?        @relation("subscriptionPaymentConfirmer", fields: [confirmedByUserId], references: [id])

  @@index([subscriptionId])
  @@index([status])
  @@map("subscription_payments")
}
```

### Изменения в existing моделях

```prisma
// model Seller — добавить опциональную связь:
subscription Subscription?

// model User — добавить opposite relation:
confirmedSubscriptionPayments SubscriptionPayment[] @relation("subscriptionPaymentConfirmer")
```

### Почему НЕТ модели `Plan`

Тарифы (limits + features + цены) живут как TS constants в `apps/api/src/modules/subscriptions/plan-config.ts`. Причины:
- Меняются редко, через PR review (а не через admin UI)
- Нет N+1 запросов на чтение
- Простой rollback (revert файла vs revert миграции)
- Будущая миграция в DB-таблицу — straightforward, если когда-то понадобятся динамические планы

```ts
export const PLAN_CONFIG = {
  STARTER:  { priceUzs:  99_000, annualUzs:  950_000, productsLimit:  50, ordersLimitPerMonth: 100,  features: ['core'] },
  PRO:      { priceUzs: 299_000, annualUzs: 2_870_000, productsLimit: null, ordersLimitPerMonth: 1000, features: ['core', 'abandoned_carts', 'priority_support', 'branding'] },
  BUSINESS: { priceUzs: 899_000, annualUzs: 8_630_000, productsLimit: null, ordersLimitPerMonth: null, features: ['core', 'abandoned_carts', 'priority_support', 'branding', 'api', 'white_label'] },
} as const;
```

---

## 3. State Machine

```
                  ┌────────────────────────────────────────┐
                  │            CANCELLED                    │
                  │     (instant on seller request)         │
                  └─────────────┬──────────────┬────────────┘
                                ▲              ▲
        admin cancel │          │          │ seller cancel
                                │          │
   ┌──────┐  trial expired   ┌──┴────┐  pay confirmed  ┌────────┐
   │TRIAL │ ──────────────► │PAST_  │ ◄────────────── │ ACTIVE │
   │      │                  │ DUE  │                  │        │
   └──┬───┘                  └───┬───┘                  └────┬───┘
      │ trial→pay confirmed       │ grace ended (7d)        │ period ended
      ▼                           ▼                          ▼
   ┌──────┐                   ┌──────────┐               ┌────────┐
   │ACTIVE│                   │SUSPENDED │               │PAST_DUE│
   └──────┘                   │          │               └────────┘
                              │ data kept│
                              │ 90 days  │
                              └────┬─────┘
                                   │ 90d without payment
                                   ▼
                              ┌──────────┐
                              │ CHURNED  │
                              │ pending  │
                              │  delete  │
                              └──────────┘
```

**Transitions (event-driven):**

| From | Event | To | Side effects |
|---|---|---|---|
| _new seller_ | `seller created` | TRIAL | `trialStartedAt = now`, `trialEndsAt = now + 14d`, `tier = PRO` |
| TRIAL | `payment confirmed` | ACTIVE | `currentPeriodStart = now`, `currentPeriodEnd = +30d`, `trialEndsAt = null` |
| TRIAL | `trialEndsAt < now` (cron) | PAST_DUE | `graceEndsAt = trialEndsAt + 7d` |
| TRIAL | `seller cancel` | CANCELLED | `cancelledAt = now` |
| ACTIVE | `currentPeriodEnd < now` (cron) | PAST_DUE | `graceEndsAt = currentPeriodEnd + 7d` |
| ACTIVE | `seller cancel` | CANCELLED | `cancelledAt = now` (доступ до конца period сохраняется flag-ом в use-cases) |
| ACTIVE | `seller upgrade tier` | ACTIVE | new `tier`, period не меняется (pro-rate в Phase 2) |
| PAST_DUE | `payment confirmed` | ACTIVE | new `currentPeriodStart/End`, `graceEndsAt = null` |
| PAST_DUE | `graceEndsAt < now` (cron) | SUSPENDED | `suspendedAt = now`, store.isPublic = false (через event) |
| SUSPENDED | `payment confirmed` | ACTIVE | reopen store (isPublic = true if was APPROVED), новый period |
| SUSPENDED | `+90d without pay` (cron) | CHURNED | `churnedAt = now`, hard delete pending (manual ops) |
| any | `admin extend-trial` | TRIAL | new `trialEndsAt` |
| any | `admin comp` | ACTIVE | grant N months free (`method=COMP`) |

---

## 4. API Endpoints

### Seller side (`/api/v1/seller/subscription`)

| Method | Path | Guard | Body | Returns |
|---|---|---|---|---|
| GET | `/seller/subscription` | JWT+Seller | — | `{ tier, status, trialEndsAt?, currentPeriodEnd?, graceEndsAt?, daysLeft }` |
| POST | `/seller/subscription/upgrade` | JWT+Seller | `{ targetTier: 'PRO'\|'BUSINESS' }` | новый subscription state (Phase 1: создаёт PENDING payment, ждёт admin) |
| POST | `/seller/subscription/cancel` | JWT+Seller | — | `{ status: 'CANCELLED' }` |

### Admin side (`/api/v1/admin/subscriptions`)

| Method | Path | Guard | Body | Returns |
|---|---|---|---|---|
| GET | `/admin/subscriptions` | Admin+`subscription:read` | query: status, tier, page, limit | paginated list |
| GET | `/admin/subscriptions/:id` | Admin+`subscription:read` | — | full subscription + payment history |
| POST | `/admin/subscriptions/:id/extend-trial` | Admin+`subscription:moderate` | `{ days: number }` | updated |
| POST | `/admin/subscriptions/:id/mark-paid` | Admin+`subscription:moderate` | `{ amountUzs, periodStart, periodEnd, notes? }` | new payment + new ACTIVE period |
| POST | `/admin/subscriptions/:id/comp` | Admin+`subscription:moderate` | `{ months: number, reason: string }` | grants `method=COMP` period |
| POST | `/admin/subscriptions/:id/cancel` | Admin+`subscription:moderate` | `{ reason: string }` | sets CANCELLED |

Все mutations пишут audit_log (INV-A01).

---

## 5. Use-cases

```
apps/api/src/modules/subscriptions/use-cases/
├── start-trial.use-case.ts           // вызывается при создании Seller (или в seed для existing)
├── get-current-subscription.use-case.ts
├── request-upgrade.use-case.ts       // создаёт PENDING payment
├── confirm-payment.use-case.ts       // admin: ставит ACTIVE
├── extend-trial.use-case.ts          // admin
├── comp-subscription.use-case.ts     // admin grant free
├── cancel-subscription.use-case.ts   // seller или admin
├── expire-trials.use-case.ts         // cron job
├── expire-active.use-case.ts          // cron job (period ended)
├── suspend-past-due.use-case.ts      // cron job (grace ended)
├── churn-suspended.use-case.ts       // cron job (90 days)
└── enforce-plan-limit.use-case.ts    // helper для других модулей
```

---

## 6. Cron / Expiry Jobs

**Подход:** BullMQ repeatable job, расписание `0 3 * * *` (3:00 UTC = 8:00 Tashkent), 1 раз в сутки.

```ts
@Processor(QUEUE_SUBSCRIPTIONS)
class SubscriptionExpiryProcessor {
  @Process('daily-check')
  async daily() {
    const now = new Date();
    await this.expireTrials.execute(now);    // TRIAL→PAST_DUE
    await this.expireActive.execute(now);     // ACTIVE→PAST_DUE
    await this.suspendPastDue.execute(now);   // PAST_DUE→SUSPENDED + store.isPublic=false
    await this.churnSuspended.execute(now);   // SUSPENDED→CHURNED (90d)
  }
}
```

Регистрация: `BullModule.registerQueue({ name: QUEUE_SUBSCRIPTIONS })` + `addRepeatable` при boot.

---

## 7. Store Suspend Integration

При SUSPENDED Subscription:
- `store.isPublic = false` (NOT `status = SUSPENDED` — это для admin-suspend, разные семантики)
- `storefront/stores` уже фильтрует по `isPublic: true` → магазин исчезает из публичного listing
- `storefront/stores/:slug` отдаёт 403 + специальный код `STORE_OWNER_SUBSCRIPTION_SUSPENDED` (web-buyer показывает "магазин временно недоступен")
- Dashboard для seller → read-only mode (Азим на фронте уважает флаг `subscription.status === 'SUSPENDED'`)

При возврате в ACTIVE: автоматический rollback `isPublic = true` (если `store.status === APPROVED`).

---

## 8. Plan Limits Enforcement

В существующих use-cases добавить гейты:
- `CreateProductUseCase` → `enforcePlanLimit('products', sellerId)` перед save
- `CreateOrderUseCase` (внутренний, через checkout) → `enforcePlanLimit('orders_this_month', sellerId)` — counter в Redis
- `EnableApiAccessUseCase` (новый, если будет) → only if `features.includes('api')`

При превышении: throw `DomainException(PLAN_LIMIT_EXCEEDED, 'Достигнут лимит тарифа: <details>', 402)`.

---

## 9. Edge Cases

| Случай | Поведение |
|---|---|
| Seller в TRIAL → upgrade | PENDING payment, при confirm → ACTIVE, trial обнуляется |
| TRIAL → CANCELLED → передумал | новый trial? **НЕТ** (защита от abuse), сразу UPGRADE flow |
| ACTIVE → cancel mid-period | `cancelledAt = now`, доступ остаётся до `currentPeriodEnd`, после — без перехода в PAST_DUE, сразу SUSPENDED |
| EXPIRED → upgrade (новый tier) | новый ACTIVE period, без trial |
| Частичная оплата | PENDING → не confirm, admin запрашивает доплату или refund manually |
| Currency mismatch | Phase 1 — только UZS, проверка в DTO |
| Discount + tier change | discount применяется к новой цене (не пересчитывается) |
| Beta cohort grandfathering | при seed скрипте — создаём Subscription с `discountReason='BETA'`, `discountPercent=50`, `discountEndsAt=null` (вечно) |

---

## 10. Audit Log Actions (INV-A01)

- `SUBSCRIPTION_TRIAL_STARTED`
- `SUBSCRIPTION_UPGRADED` (payload: oldTier, newTier)
- `SUBSCRIPTION_PAYMENT_CONFIRMED` (payload: amountUzs, method, periodStart, periodEnd)
- `SUBSCRIPTION_TRIAL_EXTENDED` (payload: days, reason)
- `SUBSCRIPTION_COMPED` (payload: months, reason)
- `SUBSCRIPTION_CANCELLED` (payload: reason, byUserId, byRole)
- `SUBSCRIPTION_AUTO_EXPIRED` (cron) (payload: prevStatus, newStatus)
- `SUBSCRIPTION_AUTO_SUSPENDED` (cron)
- `SUBSCRIPTION_AUTO_CHURNED` (cron)
- `STORE_SUBSCRIPTION_SUSPEND` (когда `isPublic=false` из-за suspended subscription)

---

## 11. Error Codes (добавить в `05_error_taxonomy.md`)

```ts
SUBSCRIPTION_NOT_FOUND       // 404
SUBSCRIPTION_ALREADY_ACTIVE  // 409
PLAN_LIMIT_EXCEEDED          // 402 (специально — связан с подпиской)
TRIAL_ALREADY_USED           // 409 (повторный triak после CANCEL)
INVALID_PLAN_TRANSITION      // 422 (например downgrade на TRIAL)
SUBSCRIPTION_SUSPENDED       // 403 (попытка действия которое требует ACTIVE)
PAYMENT_NOT_FOUND            // 404
PAYMENT_ALREADY_CONFIRMED    // 409
INVALID_DISCOUNT_PERCENT     // 422
```

---

## 12. Phase 2 Readiness

- `SubscriptionPaymentMethod` enum уже включает CLICK/PAYME → не миграция, добавится handler
- `externalId` поле в payment → готово для gateway webhook reference
- `autoRenew` флаг → в Phase 1 всегда `false`, Phase 2 включается
- Hybrid комиссия → отдельная сущность `OrderCommission` (вне scope сейчас, но не блокирует)

---

## 13. Файлы для создания/изменения

### Schema + миграция
- `packages/db/prisma/schema.prisma` (+150 строк: 4 enums + 2 models + 2 relations)
- `packages/db/prisma/migrations/20260601_subscription_module/migration.sql` (auto-gen через `pnpm db:migrate:dev`)

### Backend (`apps/api/src/modules/subscriptions/`)
- `subscriptions.module.ts`
- `subscriptions.controller.ts` (seller)
- `dto/upgrade-subscription.dto.ts`
- `repositories/subscriptions.repository.ts`
- `repositories/subscription-payments.repository.ts`
- `services/plan-config.ts`
- `services/plan-limit-guard.service.ts`
- `use-cases/*.use-case.ts` (12 файлов, см. §5)
- `processors/subscription-expiry.processor.ts`
- `events/subscription-status-changed.event.ts`

### Backend admin
- `apps/api/src/modules/admin/admin-subscriptions.controller.ts`
- `apps/api/src/modules/admin/dto/extend-trial.dto.ts`
- `apps/api/src/modules/admin/dto/mark-paid.dto.ts`
- `apps/api/src/modules/admin/dto/comp-subscription.dto.ts`
- `apps/api/src/modules/admin/use-cases/*` (extend-trial, mark-paid, comp)

### Types
- `packages/types/src/api/subscriptions.ts`
- `packages/types/src/enums.ts` (+ 4 enum экспорта)

### Docs
- `docs/V1.1/02_state_machines.md` — добавить Subscription FSM
- `docs/V1.1/05_error_taxonomy.md` — добавить новые коды
- `docs/V1.1/06_feature_flags.md` — `SUBSCRIPTIONS_ENABLED`
- `docs/contracts/subscriptions.md` — REST contract для frontends
- `docs/adr/ADR-010_subscription_module.md` — этот документ переместить + sign

---

## 14. Definition of Done

- [ ] Migration applied на dev/staging, schema валиден
- [ ] `pnpm db:generate` создаёт типизированный client
- [ ] Все use-cases имеют unit-тесты (jest, минимум happy path + 1 error)
- [ ] Cron job отрабатывает на staging (или ручной триггер через admin endpoint)
- [ ] `tsc --noEmit` чистый
- [ ] Admin UI имеет минимум: список subscriptions + кнопка "mark paid"
- [ ] Audit log entries появляются для всех transitions
- [ ] web-seller (Азим) уважает `status === SUSPENDED` (read-only mode) — отдельный task для Азима
- [ ] ADR-010 запушен, ссылается на этот документ

---

## 15. Estimate

| Этап | Дней (1 dev) |
|---|---|
| Schema + migration | 0.5 |
| Module skeleton + DTO/Repos | 0.5 |
| 12 use-cases | 2 |
| Controllers (seller + admin) | 0.5 |
| Cron processor + integration | 0.5 |
| Plan limit hooks в existing use-cases | 0.5 |
| Tests | 1 |
| Docs + ADR-010 | 0.5 |
| Admin UI minimum | 1 |
| **ИТОГО** | **7 дней** |

Риски:
- Подсчёт orders/month для Старт-лимита — нужен либо counter в Redis, либо ежедневный COUNT (медленно при >10K заказов/мес). Решение: материализованный счётчик в `subscription.ordersThisMonth` + reset cron в 00:00.
- Beta-cohort grandfathering — отдельный одноразовый seed-скрипт (не миграция).

---

## Open Questions для sign-off

1. **Annual billing — отдельно?** В §5 указаны annualUzs (−20%). Считаем `currentPeriodEnd = +365d` вместо +30d? Или это лишняя сложность для Phase 1?
2. **Reactivation после CHURNED** — позволяем reset с нуля, или blacklist?
3. **GRACE 7 дней** — ОК, или меняем? (Stripe default = 3 дня, мы поставили 7 как в business v2 §7)
4. **Beta cohort** — кого включать? Список из текущих ~50 активных sellers?
