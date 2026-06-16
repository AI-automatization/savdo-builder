# §7 Billing & Enforcement Machine — Spec v1

> **Дата:** 2026-05-31 · **Обновлено:** 2026-06-17 (синхронизация тарифов с финальным решением) ·
> **Автор:** Claude (по заданию Азима) · **Статус:** 🟢 Решения закрыты, готово к реализации (§12)
> **Реализует:** `business-model-v2-2026-05-31.md` §7 + §15 (финальные решения 14.06.2026).
> **Тарифы/цены:** см. `pricing-rationale-v2-2026-06-04.md` — это источник правды по
> названиям тарифов и ценам (Free/Pro 149k/Studio 399k), эта спека больше не дублирует цифры
> отдельно, только механику энфорсмента.
> **Почему сейчас:** это **блокер платного public launch** — без него нельзя брать деньги на масштабе.
> **Зоны:** backend (entity + cron + admin) — **Полат**; suspended-states во фронтах — **Азим**.
> Спека = контракт между ними, чтобы пилить параллельно после approve.
> ⚠️ **BILLING-TIER-ENUM-SYNC-001:** tier-enum переименован в этой спеке (см. §2) со
> STARTER/PRO/BUSINESS на **FREE/PRO/STUDIO** — при реализации `packages/types`/`packages/db`
> брать имена отсюда, не из старой версии этого файла.

---

## 1. Что уже есть в коде (заземление, не выдумка)

- `Seller` (`packages/db/schema.prisma:331`): `verificationStatus`, `isBlocked` — **billing отсутствует**.
- `Store` (`:373`): видимость уже гейтится через `status: StoreStatus` (DRAFT/ACTIVE/…) + `isPublic` + `publishedAt`.
- **Ручная активация уже реализована:** `ActivateSellerOnMarketUseCase` (admin создаёт seller+store+approve,
  единый audit-log по INV-A01). Это и есть текущая «manual activation» из pricing-doc.
- Конвенции: state machines — `docs/V1.1/02_state_machines.md`; error-коды — `05_error_taxonomy.md`;
  audit на каждое admin-действие — INV-A01; INV-S01 (1 seller = 1 store).

**Вывод по дизайну:** не вводим новый механизм видимости — `suspended`-подписка **перекрывает
`isPublic`** на read-слое storefront. Минимум новых концепций.

---

## 2. Модель данных — `Subscription` (proposal Полату)

1:1 с `Seller` (т.к. INV-S01: seller = store = одна подписка). Value metric = per store.

```prisma
model Subscription {
  id               String             @id @default(uuid())
  sellerId         String             @unique            // INV-S01: одна подписка на продавца
  tier             SubscriptionTier   @default(FREE)      // FREE | PRO | STUDIO
  status           SubscriptionStatus @default(TRIAL)    // см. §3
  trialEndsAt      DateTime?                             // конец 14-дн триала
  currentPeriodEnd DateTime?                             // «оплачено до» (paidUntil)
  graceEndsAt      DateTime?                             // дедлайн past_due → suspended
  // Phase 1 — ручная оплата: админ фиксирует факт
  lastPaymentAt    DateTime?
  lastPaymentNote  String?                               // «Payme перевод», «наличные» и т.п.
  // Phase 2 — авто-биллинг (заполняется при Click/Payme)
  externalProvider String?                               // 'click' | 'payme' | null
  externalSubId    String?
  cancelAtPeriodEnd Boolean           @default(false)
  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  seller Seller @relation(fields: [sellerId], references: [id])

  @@index([status])
  @@index([currentPeriodEnd])
  @@map("subscriptions")
}

enum SubscriptionTier   { FREE  PRO  STUDIO }
enum SubscriptionStatus { TRIAL  ACTIVE  PAST_DUE  SUSPENDED  CHURNED }
```

> `packages/db` + `packages/types` — зона Полата. Это **предложение** к ревью, не правка его кода.

---

## 3. State machine подписки

```
            create seller
                 │
                 ▼
            ┌─────────┐  trialEndsAt прошёл, не оплатил
            │  TRIAL  │ ───────────────────────────────┐
            └────┬────┘                                 │
        оплатил  │                                      ▼
                 ▼                              ┌──────────────┐
            ┌─────────┐  currentPeriodEnd       │  PAST_DUE    │
            │ ACTIVE  │ ─────────────────────►  │ (grace 7 дн) │
            └─────────┘  прошёл, не продлил     └──────┬───────┘
                 ▲                                     │ graceEndsAt прошёл
        оплатил  │  оплатил (в любой момент)           ▼
                 │                              ┌──────────────┐
                 └──────────────────────────────┤  SUSPENDED   │
                                                └──────┬───────┘
                                          90 дней без оплаты
                                                       ▼
                                                ┌──────────────┐
                                                │   CHURNED    │ → данные удаляются по политике
                                                └──────────────┘
```

| Из | В | Триггер | Кто двигает |
|----|----|---------|-------------|
| (new) | TRIAL | создан seller/store | use-case при онбординге |
| TRIAL | ACTIVE | оплата зафиксирована | admin (Phase 1) / webhook (Phase 2) |
| TRIAL | PAST_DUE | `trialEndsAt < now`, не оплатил | **cron** |
| ACTIVE | PAST_DUE | `currentPeriodEnd < now`, не продлил | **cron** |
| PAST_DUE | ACTIVE | оплата | admin / webhook |
| PAST_DUE | SUSPENDED | `graceEndsAt < now` | **cron** |
| SUSPENDED | ACTIVE | оплата | admin / webhook |
| SUSPENDED | CHURNED | 90 дней без оплаты | **cron** |

**Инвариант видимости (главное):** storefront публично виден ⟺
`Store.status = ACTIVE` И `Store.isPublic = true` И `subscription.status ∈ {TRIAL, ACTIVE, PAST_DUE}`.
То есть **SUSPENDED/CHURNED → storefront скрыт**, даже если `Store.isPublic = true`.

---

## 4. Что капим жёстко, а что мягко (важный дизайн-выбор)

Жёстко капить **заказы нельзя** — блокировать покупателя из-за тарифа продавца = плохой UX +
теряем продавцу деньги + вина падает на нас. Поэтому:

| Лимит | Тип | Поведение при превышении |
|-------|-----|--------------------------|
| **Заказов/мес** (Free ≤50 / Pro,Studio ∞) | 🟡 **SOFT → блок через 3 дня** | при превышении — баннер-предупреждение продавцу; если за 3 дня не оплатил/не апгрейднул — **новые заказы блокируются** (`SUBSCRIPTION_ORDER_LIMIT`). Уже принятые заказы не трогаем. **Покупатель не теряет уже оформленный заказ.** Решение §12.4. |
| **Магазинов** (Free=1 / Pro=1 / Studio≤3) | 🔴 **HARD** | попытка создать 2-й магазин на Free/Pro → ошибка `SUBSCRIPTION_STORE_LIMIT`, кнопка «апгрейд до Studio». Multi-store — roadmap-фича, см. INV-S01. |
| **Свой домен / без бейджа maxsavdo / AI-фото+описания / полная аналитика / промокоды** | 🔴 **HARD** | доступно от **PRO** и выше (gate в UI + бэке). На Free — поддомен + бейдж. |
| **Команда / приоритетная поддержка / экспорт** | 🔴 **HARD** | только **STUDIO**. |
| **Неоплата** (`SUSPENDED`) | 🔴 **HARD** | storefront скрыт, dashboard read-only (см. §6). |

> Это снимает дыру «как энфорсить заказы не наказывая покупателя»: enforcement на стороне
> продавца (фичи + видимость), а не покупателя.

---

## 5. Backend-компоненты (зона Полата)

1. **`Subscription` entity + migration** (`packages/db`) — §2.
2. **`packages/types`** — `SubscriptionTier`, `SubscriptionStatus`, `SubscriptionDto` (для фронта).
3. **`SubscriptionRepository`** — CRUD + `findExpiringBefore(date)`.
4. **Cron-job** (`apps/api`, BullMQ repeatable): ежедневно
   - `TRIAL` с `trialEndsAt < now` → `PAST_DUE` (+ `graceEndsAt = now + 7d`);
   - `ACTIVE` с `currentPeriodEnd < now` → `PAST_DUE` (+ grace);
   - `PAST_DUE` с `graceEndsAt < now` → `SUSPENDED`;
   - `SUSPENDED` старше 90 дней → `CHURNED`.
   Каждое изменение → audit-log (INV-A01) + (опц.) TG-нотификация продавцу.
5. **Admin endpoints** (`apps/api` + admin UI):
   - `PATCH /admin/sellers/:id/subscription` — выставить `tier`, продлить `currentPeriodEnd`,
     зафиксировать `lastPaymentNote`. Пишет audit (`subscription.payment_recorded`).
   - переход в ACTIVE из любого статуса при оплате.
6. **Storefront read-gate** — везде, где отдаётся публичный storefront, добавить условие из §3
   (скрыть при SUSPENDED/CHURNED). Отдавать 404/«недоступен», а не пустую витрину.
7. **Store-create guard** — при создании 2-го магазина проверять `tier` (Free/Pro → `SUBSCRIPTION_STORE_LIMIT`,
   Studio ≤3). Roadmap-зависимость: пока действует INV-S01 (1 seller = 1 store), guard всегда блокирует
   2-й магазин независимо от tier — multi-store включается отдельной фичей при снятии INV-S01 для Studio.
8. **Order-counter + soft-limit enforcement** — `ordersThisPeriod` per store. При превышении (Free >50):
   баннер сразу, **блокировка создания новых заказов через 3 дня** если не оплатил (§12.4) → новый
   error-код `SUBSCRIPTION_ORDER_LIMIT`.

---

## 6. Frontend-поведение (зона Азима)

### web-seller (dashboard)
| Статус подписки | Что показываем |
|---|---|
| `TRIAL` | мягкий баннер «Пробный период: осталось N дней. Выберите тариф» + ссылка на pricing. |
| `ACTIVE` | ничего (или тихий бейдж тарифа в настройках). |
| `PAST_DUE` | жёлтый баннер «Оплатите до DD.MM — иначе магазин скроется» (grace-countdown). Всё работает. |
| `SUSPENDED` | dashboard **read-only**: красный баннер «Магазин скрыт за неоплату. Оплатите для восстановления». Кнопки создания/редактирования disabled. Данные видны. |
| лимит заказов (Free >50/мес) | баннер «Вы на пике тарифа — апгрейд, чтобы расти», с 3-дневным countdown до блокировки новых заказов. |
| лимит заказов, блокировка (день 4+) | модалка при попытке создать заказ: «Лимит Free достигнут — апгрейд до Pro для безлимита». |
| 2-й магазин (Free/Pro) | модалка «Несколько магазинов — только на Studio». |

### web-buyer (storefront)
| Статус | Что видит покупатель |
|---|---|
| `TRIAL/ACTIVE/PAST_DUE` | нормальный storefront. |
| `SUSPENDED/CHURNED` | страница «Магазин временно недоступен» (не пустая витрина, не 500). Опц. — кнопка «написать продавцу». |

### Что фронту нужно от бэка — **контракт** (§10).

---

## 7. Phase 1 — ручная оплата (что работает на запуске)

1. Продавец платит: перевод на Payme/Click-карту фаундера / расчётный счёт / наличные.
2. Админ в панели: `PATCH /admin/sellers/:id/subscription` → tier + `currentPeriodEnd = +1 месяц`
   + `lastPaymentNote`. Статус → `ACTIVE`. Audit пишется.
3. Cron сам уводит в `PAST_DUE`/`SUSPENDED`, если не продлили.

Переиспользуем существующий admin-паттерн (как `ActivateSellerOnMarketUseCase`): orchestration +
единый audit. Минимум нового UI.

---

## 8. Phase 2 — авто-биллинг (forward-compat, не сейчас)

Когда Click/Payme подключены: webhook платёжки → `externalProvider/externalSubId`, авто-перевод
в `ACTIVE` при оплате, авто `cancelAtPeriodEnd`. Cron и state-machine **не меняются** — меняется
только источник перехода в ACTIVE (webhook вместо admin). Модель §2 уже это закладывает.

---

## 9. Audit, ошибки, observability

- Каждый переход статуса (cron и admin) → `audit_log` (INV-A01): `subscription.status_changed`,
  `subscription.payment_recorded`. Actor = admin или `system` (для cron).
- Новые error-коды в `docs/V1.1/05_error_taxonomy.md`:
  `SUBSCRIPTION_PRODUCT_LIMIT`, `SUBSCRIPTION_FEATURE_LOCKED`, `STORE_SUSPENDED`.
- Cron-падения → `ErrorReporter` (Sentry).

---

## 10. Контракт backend → frontend (то, ради чего спека)

Фронту в `GET /seller/me` (или отдельный `GET /seller/subscription`) добавить блок:

```ts
interface SubscriptionDto {
  tier: 'FREE' | 'PRO' | 'STUDIO';
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CHURNED';
  trialEndsAt: string | null;       // ISO
  currentPeriodEnd: string | null;  // ISO
  graceEndsAt: string | null;       // ISO — для countdown в PAST_DUE
  orderLimitWarningAt: string | null; // ISO — старт 3-дневного countdown до блокировки заказов (Free, §12.4)
  limits: {
    maxStores: number;              // Free=1, Pro=1, Studio=3
    maxOrdersPerMonth: number | null; // 50 для Free, null = ∞ для Pro/Studio
    customBranding: boolean;        // false на Free, true от Pro
  };
  usage: {
    stores: number;
    ordersThisPeriod: number;
  };
}
```

Для web-buyer storefront: бэк сам отдаёт 404/«недоступен» при SUSPENDED/CHURNED (фронту отдельный
флаг не нужен — он просто рендерит «магазин недоступен» по статусу ответа).

**Граница зон:** Полат отдаёт `SubscriptionDto` + гейтит storefront; Азим рисует баннеры/disabled/
заглушку по этому DTO. Никто не лезет в чужую зону.

---

## 11. Последовательность сборки (рекомендация)

1. **Полат:** `Subscription` entity + migration + `SubscriptionDto` в `packages/types` (разблокирует Азима).
2. **Полат:** cron + admin endpoint (ручная оплата) + storefront read-gate + product-cap guard.
3. **Азим (параллельно после шага 1):** баннеры trial/past_due + suspended read-only в web-seller;
   «магазин недоступен» в web-buyer.
4. Совместно: e2e-проверка переходов (оплатил→active, не оплатил→suspended→storefront скрыт).

---

## 12. ✅ Решения закрыты — 14.06.2026 (Азим)

1. ✅ **Триал: 30 дней** для новых пользователей.
2. ✅ **Grace: 7 дней** в `PAST_DUE` → потом SUSPENDED.
3. ✅ **Хранение churned-данных: 90 дней** → потом удаление. Продавец может восстановить в течение 3 месяцев.
4. ✅ **Soft order-limit:** 3 дня показываем баннер-предупреждение → потом блокируем новые заказы. Покупателей не блокируем сразу.
5. ✅ **Cron-нотификации TG-бот:** в **v1** («осталось 3 дня триала», «просрочена оплата»).
6. ✅ **Beta-когорта:** `tier=PRO, currentPeriodEnd=2026-09-01, lastPaymentNote='beta_grandfather'`.

---

*Связано: `business-model-v2-2026-05-31.md` §7, `docs/V1.1/02_state_machines.md`,
`docs/V1.1/01_domain_invariants.md` (INV-S01, INV-A01), `05_error_taxonomy.md`,
`ActivateSellerOnMarketUseCase` (существующий manual-activation паттерн).*
