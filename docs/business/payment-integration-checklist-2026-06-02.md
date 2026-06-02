# Payment Integration Checklist — Click + Payme (Phase 2)

> Дата: 02.06.2026 | Автор: Ogerz (для Полата). Phase 2 в business-plan-v1
> заморожен до открытия бизнес-счёта. Этот документ — что нужно собрать,
> зарегистрировать и написать, чтобы разморозить.

---

## 0. Pre-requisites — без этого никуда

| # | Что | Кто делает | Сроки |
|---|-----|-----------|-------|
| 0.1 | Регистрация **ИП или ООО** через my.gov.uz | Один из co-founders | 3-7 дней |
| 0.2 | Получить ИНН юр.лица | Налоговая (после ИП) | мгновенно |
| 0.3 | Открыть **расчётный счёт** в банке (UZS) | Банк (Asaka / Anor / Hamkor — что выберешь) | 1-3 дня |
| 0.4 | КОД ОКЭД (вид деятельности) — `62.01` (разработка ПО) или `47.91` (онлайн-торговля) | Указать при регистрации ИП | сразу |
| 0.5 | Юр. адрес (можно домашний адрес ИП — это нормально) | — | сразу |

**Без 0.1-0.3 ни Click, ни Payme не примут заявку.**

---

## 1. Click.uz интеграция

### 1.1. Регистрация
- [ ] Зайти на https://partner.click.uz/ → "Стать партнёром"
- [ ] Подать заявку:
  - Юр. название
  - ИНН
  - Расчётный счёт
  - Контактное лицо (телефон + email)
  - **Service name**: "maxsavdo — подписка на storefront-сервис" (или похожее)
  - **Тип услуги**: SaaS / подписка
  - **Средний чек**: 99-899k UZS (диапазон твоих тарифов)
  - **Объём в месяц**: оценка (например 500k UZS × 200 sellers = 100M UZS)
- [ ] Дождаться звонка от менеджера Click (1-3 дня)
- [ ] Подписать договор (обычно через ЭЦП — `e-imzo.uz`)
- [ ] Получить **тестовые credentials** для sandbox

### 1.2. Что Click тебе выдаст (СОХРАНИ В 1PASSWORD / BITWARDEN)
- [ ] `merchant_id` — числовой идентификатор магазина
- [ ] `service_id` — числовой идентификатор услуги (если несколько тарифов — один service_id или несколько; уточни у менеджера)
- [ ] `secret_key` — для подписи callback'ов
- [ ] `merchant_user_id` (опционально, для callback)
- [ ] Sandbox URL (обычно `https://my.click.uz/services/pay`)
- [ ] Prod URL

### 1.3. Технические вопросы менеджеру (СПИСОК ВОПРОСОВ)
**Скопируй этот блок в письмо менеджеру:**

```
Добрый день! По интеграции с Click для maxsavdo (SaaS-подписка):

1. Подойдёт ли модель «один service_id на все 3 тарифа, сумма
   передаётся в запросе» — или нужно завести 3 отдельных service_id
   (по одному на STARTER/PRO/BUSINESS)?

2. Поддерживаете ли вы рекуррентные платежи (auto-renew подписки) для
   физлиц-плательщиков? Или нужно каждый месяц пользователю руками
   подтверждать через приложение Click?

3. На каких IP-адресах работают ваши callback-серверы? Хочу
   заwhitelist'ить только их в Railway/Cloudflare WAF.

4. Какой формат подписи актуальный — MD5 или SHA1? Видел оба в разных
   гайдах. Хотелось бы официальный документ.

5. Тестовая среда — `sandbox.click.uz` или есть отдельный
   merchant_id для тестов в production-API?

6. Есть ли SLA на response-time callback? Если мой сервис ответит за
   3-5 секунд (cold start или DB-проблемы) — это OK?

7. Как у вас откатывают платёж при ошибке нашей стороны? Через API
   или менеджер вручную делает refund?

8. Какая у вас комиссия по тарифу для нашего сегмента (SaaS, UZ-
   рынок, средний чек 200-500k UZS)?

9. Документация — это `docs.click.uz` актуальная или есть свежий PDF
   для партнёров?

10. Есть ли тестовый Telegram-бот / Postman-коллекция чтобы
    эмулировать платежи?
```

### 1.4. Что писать в коде (apps/api)
- [ ] `apps/api/src/modules/payments/click/` — новый модуль
- [ ] `click.service.ts` — генерация подписи (MD5), формирование URL для редиректа
- [ ] `click.controller.ts` — 2 endpoint'а:
  - [ ] `POST /api/v1/payment/click/prepare` — Click дёргает чтобы зарезервировать платёж
  - [ ] `POST /api/v1/payment/click/complete` — Click дёргает после оплаты
- [ ] Проверка `sign_string` от Click через MD5 (см. их docs)
- [ ] Idempotency: одно и то же `click_trans_id` не обрабатывать дважды
- [ ] Логи всех call'ов в `audit_log` (INV-A01)
- [ ] При успехе — создать `SubscriptionPayment` со `status=CONFIRMED`,
      обновить `Subscription.status=ACTIVE`, `currentPeriodEnd=+1 месяц`

### 1.5. Railway env vars
```
CLICK_MERCHANT_ID=...
CLICK_SERVICE_ID=...
CLICK_SECRET_KEY=...
CLICK_CALLBACK_BASE_URL=https://savdo-api-production.up.railway.app
CLICK_ENV=sandbox  # потом production
```

---

## 2. Payme интеграция

### 2.1. Регистрация
- [ ] Зайти на https://business.payme.uz/
- [ ] "Подключить бизнес"
- [ ] Заполнить ту же анкету (юр.лицо, ИНН, счёт)
- [ ] Менеджер Payme свяжется (обычно 2-5 дней)
- [ ] Договор через e-imzo

### 2.2. Что выдадут
- [ ] `merchant_id` — UUID или числовой ID
- [ ] `key` (Test Key + Prod Key)
- [ ] Cashbox URL
- [ ] Payme принимает только **JSON-RPC** — не REST

### 2.3. Вопросы менеджеру Payme

```
Добрый день! По интеграции Payme для maxsavdo (SaaS-подписка):

1. У вас Merchant API (JSON-RPC) или Subscription API (для recurring)?
   Что подходит для подписочной модели maxsavdo?

2. Subscription API — поддерживает ли он auto-renew с card-token
   сохранением, или каждый раз пользователь заново вводит карту?

3. У вас в документации описаны 6 методов JSON-RPC (CheckPerformTransaction,
   CreateTransaction, PerformTransaction, CancelTransaction,
   CheckTransaction, GetStatement). Это полный набор для маркетплейса
   или ещё есть методы?

4. IP-адреса ваших серверов которые шлют запросы к нам?

5. Basic-auth (merchant_id + key) — точно стандарт? Есть OAuth-вариант?

6. Тестовая среда — `test.paycom.uz` или отдельный merchant_id?

7. Комиссия для SaaS-сегмента (средний чек 200-500k)?

8. Документация: https://developer.help.paycom.uz/ актуальна?

9. Как обработать частичный возврат (refund) если seller отменил
   подписку в середине месяца?

10. Есть ли webhook на изменение статуса карты пользователя
    (expired, blocked, перевыпуск)?
```

### 2.4. Что писать в коде
- [ ] `apps/api/src/modules/payments/payme/` — новый модуль
- [ ] `payme.controller.ts` — **ОДИН** endpoint `POST /api/v1/payment/payme/jsonrpc`
- [ ] `payme.service.ts` — 6 методов JSON-RPC handler'ов
- [ ] Basic-auth middleware: проверка `Authorization: Basic base64(merchant_id:key)`
- [ ] JSON-RPC 2.0 формат строго: `{jsonrpc, id, method, params}` → `{jsonrpc, id, result}` или `{jsonrpc, id, error: {code, message}}`
- [ ] Особые коды ошибок Payme:
  - `-31050` — ResourceNotFound (нет такого invoice/subscription)
  - `-31051` — UnableToPerformOperation
  - `-31052` — Forbidden
  - `-31099` — InsufficientPrivileges
  - `-32504` — Authorization failed (Basic auth неверный)

### 2.5. Railway env vars
```
PAYME_MERCHANT_ID=...
PAYME_TEST_KEY=...
PAYME_PROD_KEY=...
PAYME_ENV=test  # потом production
```

---

## 3. Backend (apps/api) — общая разработка

### 3.1. Структура модуля
- [ ] `apps/api/src/modules/payments/` (новый модуль)
  - `payments.module.ts`
  - `click/` (подмодуль)
  - `payme/` (подмодуль)
  - `shared/`
    - `payment.service.ts` — общий сервис, маршрутизирует на провайдера
    - `payment-session.entity.ts` — БД таблица

### 3.2. Prisma schema (`packages/db/prisma/schema.prisma`)
Добавить **в дополнение** к существующему `SubscriptionPayment`:

```prisma
model PaymentSession {
  id              String   @id @default(uuid()) @db.Uuid
  subscriptionId  String   @db.Uuid
  subscription    Subscription @relation(fields: [subscriptionId], references: [id])
  provider        PaymentProvider  // CLICK | PAYME | MANUAL
  providerTxId    String?  // click_trans_id / payme transaction id
  amountUzs       Int
  status          PaymentSessionStatus  // PENDING | CONFIRMED | CANCELLED | FAILED
  rawCallback     Json?    // полный callback от провайдера для аудита
  createdAt       DateTime @default(now())
  confirmedAt     DateTime?
  cancelledAt     DateTime?

  @@index([subscriptionId, status])
  @@index([provider, providerTxId])  // для idempotency
}

enum PaymentProvider { MANUAL_TRANSFER CLICK PAYME COMP }
enum PaymentSessionStatus { PENDING CONFIRMED CANCELLED FAILED }
```

### 3.3. Endpoints для frontend (Азиму)
- [ ] `POST /api/v1/seller/subscription/checkout` — body: `{tier, provider}` →
      response: `{redirectUrl}` (Click) или `{sessionId, qrCode}` (Payme)
- [ ] `GET /api/v1/seller/subscription/checkout/:sessionId/status` —
      polling статуса после возврата с платёжной страницы

### 3.4. Use-cases
- [ ] `CreatePaymentSessionUseCase` — создаёт PaymentSession, генерит redirect URL
- [ ] `HandleClickCallbackUseCase` — обработка prepare+complete
- [ ] `HandlePaymeCallbackUseCase` — обработка 6 JSON-RPC методов
- [ ] При успехе → дёргать существующий `MarkPaidUseCase` (BILLING-MACHINE-001)

### 3.5. Тесты
- [ ] Unit тесты на подпись Click (MD5)
- [ ] Unit тесты на Payme JSON-RPC (все 6 методов)
- [ ] Integration тест с моком провайдера (e2e flow)
- [ ] Postman/Insomnia коллекция для ручного тестирования

---

## 4. Frontend (apps/web-seller, Азим)

### 4.1. UI задачи
- [ ] Страница `/billing/upgrade` или модалка в dashboard
- [ ] Кнопки выбора: STARTER / PRO / BUSINESS
- [ ] Toggle: Monthly / Yearly (-20%)
- [ ] Выбор платёжной системы (logo Click + logo Payme)
- [ ] После выбора → POST `/seller/subscription/checkout` → redirect / QR
- [ ] Возврат с платёжной страницы → `/billing/success?session=...` или `/billing/cancel?session=...`
- [ ] Polling статуса на success-странице (`/checkout/:sessionId/status`)

### 4.2. Состояния
- [ ] `TRIAL` — баннер "У вас триал, осталось N дней"
- [ ] `PAST_DUE` — баннер "Оплата просрочена. Оплатите до X" + кнопка
- [ ] `SUSPENDED` — модалка "Магазин приостановлен" + кнопка реактивации
- [ ] `CANCELLED` — банер "Подписка отменена. Активна до X. [Восстановить]"

---

## 5. Security & Monitoring

### 5.1. Защита callback endpoints
- [ ] **Rate limiting** на `/payment/click/*` и `/payment/payme/jsonrpc` —
      больше чем обычные API endpoints, но всё равно лимит (например 100 rps).
- [ ] **IP whitelist** для callback'ов (если Click/Payme дадут IP-список) —
      через Cloudflare WAF или Express middleware.
- [ ] **Signature verification ОБЯЗАТЕЛЬНО** перед обработкой — без подписи
      payload'у НЕ доверять.
- [ ] **Idempotency** через `providerTxId` UNIQUE index → дубль callback не
      создаст 2 платежа.
- [ ] **HTTPS only** (Railway даёт по умолчанию).

### 5.2. Логирование
- [ ] Каждый callback → `audit_log` (INV-A01) + `rawCallback` в `PaymentSession`
- [ ] При signature mismatch → `ErrorReporter.captureMessage('payment.sign_invalid', 'error', {provider, ip})`
- [ ] Sentry alerts: payment failures за час > 5%

### 5.3. Тестирование подписи (опасное место)
- [ ] **Negative test**: подделанная подпись → 403 Forbidden
- [ ] **Replay test**: одинаковый callback дважды → второй пропускается
- [ ] **Old timestamp**: callback с временем > 5 минут назад → 400 (защита от replay)

---

## 6. Финансовая отчётность

### 6.1. Что нужно для бухгалтерии
- [ ] Ежемесячный отчёт по платежам (xlsx из `SubscriptionPayment` + `PaymentSession`)
- [ ] Сверка с банком (поступления на расчётный счёт vs CONFIRMED платежи в БД)
- [ ] Click и Payme делают **выплаты раз в неделю/месяц** на твой счёт — не каждый платёж отдельно. Узнай у менеджера расписание.

### 6.2. Налоги
- [ ] ИП на упрощёнке (4% от выручки) — простой вариант
- [ ] НДС (если оборот > 1 млрд UZS/год) — пока не актуально
- [ ] Каждый поступивший платёж → должен быть отражён в `Чеки.uz` (электронные чеки, обязательно с 2023 года для всех онлайн-продаж UZ)
- [ ] **Интеграция с Чеки.uz** — отдельная задача, потребует ещё одной регистрации

---

## 7. Roadmap (по неделям)

| Неделя | Что | Кто |
|--------|-----|-----|
| 1 | Регистрация ИП + счёт + ОКЭД | Полат или Азим (один из) |
| 1-2 | Параллельно: подача заявок Click + Payme | оба |
| 2-3 | Получение sandbox credentials | ожидание |
| 3 | Backend модуль payments + Click adapter | Полат |
| 3-4 | Payme adapter (JSON-RPC сложнее) | Полат |
| 4 | Prisma migration + миграция данных | Полат |
| 4 | Frontend UI (`/billing/upgrade`) | Азим |
| 5 | E2E тестирование на sandbox | оба |
| 5 | Подписание prod-договоров + smoke test | оба |
| 6 | Запуск Phase 2 на 5-10 sellers (бета) | Полат |

**Итого: ~6 недель** от старта регистрации ИП до запуска Phase 2.

---

## 8. Что НЕ нужно делать прямо сейчас

- ❌ Писать код Click/Payme адаптеров — без sandbox credentials всё равно не протестировать
- ❌ Делать Prisma migration `PaymentSession` — преждевременно, может схема изменится после уточнения у менеджеров (см. вопросы выше)
- ❌ Регистрировать ОКЭД 47.91 если ИП будет только на разработку ПО — налоговая может потребовать переоформление

## 9. Что нужно сделать прямо сейчас (Phase 1 → Phase 2 prep)

- ✅ **Решить кто из co-founders делает ИП на себя** (это решение)
- ✅ Отправить вопросы из §1.3 и §2.3 менеджерам Click и Payme (даже если ИП ещё нет — можно дать ИНН Азима/Полата как физлица; для подачи заявки они требуют ИНН юр.лица)
- ✅ Создать в Bitwarden / 1Password секцию "maxsavdo-payments" для будущих credentials
- ✅ Сохранить этот файл в `docs/business/` — referенс для возврата через 6 недель

---

*Связано: `docs/business/business-model-v2-2026-05-31.md` §5 (тарифы),
`docs/business/billing-machine-spec-v1-2026-05-31.md` (Phase 1 manual payment).*
