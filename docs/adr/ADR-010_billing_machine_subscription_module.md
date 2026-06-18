# ADR-010 — Billing Machine: модуль подписок

**Дата:** 2026-06-01
**Статус:** Accepted
**Зона:** `apps/api/src/billing`, `packages/db` (новые таблицы `subscriptions`, `subscription_events`), `apps/admin` (manual payment ops). Web/mobile — только чтение лимитов.

## Контекст

`docs/business/business-model-v2.md` §7 требует подписочную модель с явной FSM
жизненного цикла подписки (trial → active → past_due → suspended → cancelled →
expired). Это разворачивает [[ADR-003]] (`no_payments_mvp`): онлайн-платежи и
монетизация откладывались, но к public launch нельзя выпускать продукт без
рабочей подписки — иначе либо все sellers бесплатно (нет revenue), либо ручной
учёт по 100+ продавцам (операционный ад).

Сигналы и спеки, на которых строится решение:
- `docs/specs/billing-machine-spec-v1.md` — FSM подписки, переходы, cron-джобы.
- `docs/design/subscription-module-design-2026-06-01.md` — структура модуля,
  таблицы, API контракты, PlanLimitGuard.
- `docs/business/business-model-v2.md` §7 — 3 тарифа (STARTER/PRO/BUSINESS),
  лимиты (товары, заказы/мес, storage, custom domain), цены в UZS.

Текущее состояние: монетизации нет, всем sellers всё доступно. >30 sellers в
проде — ручной учёт уже болезненный.

## Решение

**Внедряем модуль подписок (`billing`) до public launch.**

### 1. Tiers — TS-константы, не таблица `plans`

3 тарифа (STARTER / PRO / BUSINESS) описаны как `readonly` объект в
`apps/api/src/billing/constants/plans.ts` + типизированы в `packages/types`.

**Почему не DB-таблица `plans`:** тарифы меняются раз в квартал/реже, версия
лимитов всегда должна совпадать с кодом гардов. Хранение в БД даёт ложную
гибкость (через админку «поправить лимит» = race с PlanLimitGuard в проде) и
требует синка миграций для каждого изменения цены.

### 2. Модель данных

- `Subscription` 1:1 `Seller` (FK unique). Не allow multiple — один seller =
  одна активная подписка (соответствует INV-S01 «один seller = один store»).
- `SubscriptionEvent` — append-only лог переходов FSM (для audit и debug).
- Таблица **`subscription_payments`** (ручные подтверждения Phase 1, webhooks
  Phase 2) — отдельно от `Subscription`, чтобы история платежей не страдала
  при отменах/возобновлениях.

### 3. FSM — 6 статусов

`TRIALING → ACTIVE → PAST_DUE → SUSPENDED → CANCELLED → EXPIRED`

Переходы строго по таблице в `billing-machine-spec-v1` §3. Любой переход —
через `BillingService.transition()` с записью в `SubscriptionEvent`. Прямой
`UPDATE subscriptions SET status = ...` запрещён (нарушение = откат PR,
аналогично INV-O04 для stock).

### 4. Оплата: 2 фазы

- **Phase 1 (launch, ~Q3 2026):** ручная оплата. Seller переводит на
  юр.счёт/карту, admin в `apps/admin` подтверждает payment → подписка
  активируется. Достаточно для первых 100–300 sellers, не блокирует launch
  отсутствием бизнес-счёта для Click/Payme.
- **Phase 2 (после получения юр.лица + договоров с провайдерами):** Click +
  Payme webhooks → автоматическая активация. Дизайн уже учитывает webhook flow
  (`subscription_payments.provider`, `provider_payment_id`).

### 5. Энфорсмент лимитов

- **`PlanLimitGuard`** (NestJS guard) — **hard gates** на create-операциях,
  где превышение ломает бизнес-логику или биллинг:
  - `products.create` (limit: товары)
  - `staff.invite` (limit: соактивы)
  - `customDomain.attach` (limit: только BUSINESS)
- **Soft warnings** для `ordersLimit` — НЕ блокируем приём заказов при
  превышении лимита заказов/месяц. Вместо этого:
  - баннер в seller-dashboard,
  - уведомление в TG-бот seller,
  - email/звонок от поддержки при 120%+.

  **Почему soft:** заблокировать orders = заблокировать buyers, которые ни
  при чём. Это убийство конверсии и репутации платформы. Лимит на orders —
  сигнал для upsell, не enforcement.

## Альтернативы

1. **Stripe (или Click/Payme webhooks) с самого старта.**
   *Отклонено:* для Click/Payme нужен юр.договор и расчётный счёт, на момент
   принятия ADR — нет. Stripe в UZ не работает legit. Блокирует launch.
2. **No subscriptions, всё бесплатно до Q4.**
   *Отклонено:* business-model-v2 требует revenue stream; бесплатный режим
   создаёт когорту sellers, которых потом придётся «отучать» — миграция в
   подписку через год тяжелее, чем сразу.
3. **DB-driven `plans` таблица + админка для редактирования тарифов.**
   *Отклонено:* переусложнение для 3 редко меняющихся тарифов. Несинхрон
   между лимитом в БД и логикой гарда = реальный риск (production seller
   создаёт N+1 товар, гард не видит обновлённый лимит до перезапуска).
4. **Hard limits на orders.**
   *Отклонено:* см. §5 выше — бьёт по buyers, режет GMV.

## Последствия

### Плюсы
- Закрывает «operational hell» при >30 sellers — ручной учёт через таблицы
  заменяется на FSM + admin UI.
- Чёткая FSM 6 статусов = предсказуемое поведение, проще debug
  (`SubscriptionEvent` лог).
- Готово к Phase 2: переход с manual на webhook — добавление одного
  `PaymentProviderAdapter`, без переписывания core.
- Tiers в TS = атомарное изменение цен/лимитов через PR, no DB migration.

### Минусы
- **Cron complexity.** Новые джобы: `expireTrials`, `markPastDue`,
  `suspendOverdue`, `expireCancelled`. Каждая — потенциальный источник
  silent failures (см. [[feedback_prod_data_safety]] — миграции/джобы в
  проде требуют осторожности). Mitigation: BullMQ + Sentry alerts на failed
  jobs, runbook в `docs/runbooks/billing-cron.md`.
- **Plan limit gates — production-risky.** Существующие sellers могут уже
  превышать лимиты PRO/BUSINESS. Перед enable — миграция-аудит:
  для каждого seller посчитать текущее использование, проставить grandfather
  flag (`subscription.grandfathered_until`) если >= лимита тарифа, к
  которому привязали.
- **Manual ops Phase 1.** Admin потратит ~5 мин/seller на подтверждение
  оплаты. При 100 sellers/мес = ~8ч/мес. Acceptable до Phase 2.
- **Откат ADR-003.** Документация и онбординг должны явно отмечать: «MVP без
  платежей было до v1.1, теперь подписки обязательны». Старые ссылки на
  ADR-003 — проверить и пометить.

### Что изменится в коде
- Новый модуль: `apps/api/src/billing/` (controller, service, guard, jobs).
- Новые таблицы: `subscriptions`, `subscription_events`,
  `subscription_payments` (миграция Полата, expand-only, см.
  [[feedback_prod_data_safety]]).
- `packages/types`: `SubscriptionStatus`, `PlanTier`, `PlanLimits`,
  `Subscription` DTO.
- `apps/admin`: страница `/billing` — список подписок, manual confirm,
  переходы статусов.
- `apps/web-seller`: баннер «trial ends in N days», страница `/billing`
  (read-only Phase 1: показать тариф, лимиты, инструкцию по оплате).
- Сoцok-проверка `PlanLimitGuard` подключена в product/staff/domain
  модулях.

## Связано

- [[ADR-001]] — modular monolith (billing — новый модуль внутри того же монолита).
- [[ADR-002]] — one store per seller (поэтому `Subscription` 1:1 `Seller`).
- [[ADR-003]] — `no_payments_mvp`: эта ADR частично разворачивает её для
  подписок (но не для платежей покупателей за заказы — там по-прежнему COD +
  manual transfer до Phase 2).
- `docs/specs/billing-machine-spec-v1.md` — FSM, переходы, cron.
- `docs/design/subscription-module-design-2026-06-01.md` — модуль, API, DB.
- `docs/business/business-model-v2.md` §7 — тарифы, лимиты, цены.
- `docs/V1.1/02_state_machines.md` — добавить FSM подписки сюда после merge.
