# §7 Billing & Enforcement Machine — Spec v1

> **Дата:** 2026-05-31 · **Автор:** Claude (по заданию Азима) · **Статус:** 🟡 Draft для аудита (Азим + Полат)
> **Реализует:** `business-model-v2-2026-05-31.md` §7 (механизм «отключить неплательщика»).
> **Почему сейчас:** это **блокер платного public launch** — без него нельзя брать деньги на масштабе.
> **Зоны:** backend (entity + cron + admin) — **Полат**; suspended-states во фронтах — **Азим**.
> Спека = контракт между ними, чтобы пилить параллельно после approve.

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
  tier             SubscriptionTier   @default(STARTER)  // STARTER | PRO | BUSINESS
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

enum SubscriptionTier   { STARTER  PRO  BUSINESS }
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
| **Заказов/мес** (100/1000/∞) | 🟡 **SOFT** | продавцу баннер «вы на пике тарифа, апгрейд» + событие на апсейл. **Покупатель НЕ блокируется.** |
| **Товаров** (50/∞/∞) | 🔴 **HARD** | на Старте создание 51-го товара → ошибка `SUBSCRIPTION_PRODUCT_LIMIT`, кнопка «апгрейд». |
| **Кастом-брендинг** | 🔴 **HARD** | фича доступна только PRO/BUSINESS (gate в UI + бэке). |
| **API / white-label** | 🔴 **HARD** | только BUSINESS. |
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
7. **Product-create guard** — на Старте проверять cap товаров → `SUBSCRIPTION_PRODUCT_LIMIT`.
8. **Order-counter** — `ordersThisPeriod` per store (для soft-лимита; считается из Order по периоду).

---

## 6. Frontend-поведение (зона Азима)

### web-seller (dashboard)
| Статус подписки | Что показываем |
|---|---|
| `TRIAL` | мягкий баннер «Пробный период: осталось N дней. Выберите тариф» + ссылка на pricing. |
| `ACTIVE` | ничего (или тихий бейдж тарифа в настройках). |
| `PAST_DUE` | жёлтый баннер «Оплатите до DD.MM — иначе магазин скроется» (grace-countdown). Всё работает. |
| `SUSPENDED` | dashboard **read-only**: красный баннер «Магазин скрыт за неоплату. Оплатите для восстановления». Кнопки создания/редактирования disabled. Данные видны. |
| лимит заказов (soft) | баннер «Вы на пике тарифа — апгрейд, чтобы расти» (не блокирует). |
| лимит товаров (hard) | при попытке 51-го: модалка «Лимит тарифа Старт — апгрейд до Pro». |

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
  tier: 'STARTER' | 'PRO' | 'BUSINESS';
  status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CHURNED';
  trialEndsAt: string | null;       // ISO
  currentPeriodEnd: string | null;  // ISO
  graceEndsAt: string | null;       // ISO — для countdown в PAST_DUE
  limits: {
    maxProducts: number | null;     // null = ∞
    maxOrdersPerMonth: number | null;
    customBranding: boolean;
    apiAccess: boolean;
  };
  usage: {
    products: number;
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

## 12. Открытые вопросы для аудита

1. **Триал — 14 дней?** (бизнес-план §6). Или 7/30?
2. **Grace — 7 дней** в `PAST_DUE` — норм?
3. **Хранение churned-данных — 90 дней** до удаления — ок по политике/legal?
4. **Soft order-limit** — только баннер, или ещё throttle advanced-фич (аналитика)? (моё: только баннер на старте).
5. **Cron-нотификации продавцу** (TG-бот «осталось 3 дня») — в v1 или v2? (моё: v1, дёшево и сильно снижает churn).
6. **Beta-когорта:** как технически grandfather — `tier=PRO, currentPeriodEnd=далеко` или отдельный флаг `isBeta`? (моё: спец-значение `lastPaymentNote='beta_grandfather'` + дальний `currentPeriodEnd`).

---

*Связано: `business-model-v2-2026-05-31.md` §7, `docs/V1.1/02_state_machines.md`,
`docs/V1.1/01_domain_invariants.md` (INV-S01, INV-A01), `05_error_taxonomy.md`,
`ActivateSellerOnMarketUseCase` (существующий manual-activation паттерн).*
