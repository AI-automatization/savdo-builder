# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/admin`, `apps/mobile-buyer`, `apps/mobile-seller`

> ⚠️ Admin panel передана Полату (ранее Яхьо). Яхьо больше не работает над `apps/admin`.

> ADM Phase A (ADM-001..008) — выполнено 01.04.2026, перенесено в `done.md`

---

## ✅ Выполнено (02.04.2026)

- [x] **[WEB-022]** `DEV_OTP_ENABLED=true` на Railway — Азим может тестировать OTP ✅
- [x] **[WEB-001]** Дубль `PaginationMeta` — дубля нет, TS2308 отсутствует ✅
- [x] **[WEB-015]** Socket.IO emit `order:new` / `order:status_changed` ✅
- [x] **[API-007]** Telegram Webhook — авто-регистрация при старте ✅
- [x] **[API-008]** Watch Paths — уже были в `apps/api/railway.toml` ✅
- [x] **[API-009]** R2 Storage — guard для отсутствия конфига ✅

---

---

## 🟡 Admin — Phase B (после стабильного backend admin API)

> Phase A уже сделана (макеты с моками). Phase B — подключение к реальному API.

- [x] **[ADM-008]** Интеграция admin auth (JWT) ✅
- [x] **[ADM-009]** Seller review queue — реальные данные + SLA-таймер ✅
- [x] **[ADM-010]** Store approve/reject/suspend flow + confirmation modal ✅ (сделано ранее)
- [x] **[ADM-011]** Product hide/restore ✅
- [x] **[ADM-012]** Order overview с фильтрами ✅
- [x] **[ADM-013]** Поиск по телефону / order number / slug ✅
- [x] **[ADM-014]** Seller detail страница с историей moderation actions ✅

---

## 🔴 Admin — Phase C (статусы без управления)

> Аудит 02.04.2026: найдены статусы которые отображаются в UI но изменить их через админку нельзя.


---

## 🟡 Dashboard аналитика (чарты)

- [ ] **[ADM-021]** Dashboard charts — продажи и активность
  - **Домен:** `apps/admin`
  - **Детали:** Установить `recharts`. На DashboardPage добавить: 1) LineChart — заказы по дням (последние 30 дней), 2) BarChart — топ-5 магазинов по заказам. Endpoint: `GET /api/v1/admin/analytics/summary` (нужно создать). Данные из `orders` таблицы через Prisma.
  - **Файлы:** `apps/admin/src/pages/DashboardPage.tsx`, новый `apps/api/src/modules/admin/use-cases/get-analytics.use-case.ts`

---

## 🟡 Broadcast — Telegram рассылка из админки

- [ ] **[ADM-019]** Backend: `POST /api/v1/admin/broadcast`
  - **Домен:** `apps/api`
  - **Детали:** Принимает `{ message: string, preview_mode?: boolean }`. Достаёт всех юзеров с `telegram_chat_id != null`. Шлёт через BullMQ очередь (30 msg/sec лимит Telegram). Сохраняет в таблицу `broadcast_logs` (id, message, sent_count, failed_count, created_by, created_at).
  - **Файлы:** новый `apps/api/src/modules/admin/use-cases/broadcast.use-case.ts`, `admin.controller.ts`, миграция `broadcast_logs`

- [ ] **[ADM-020]** Admin UI: страница `/broadcast`
  - **Домен:** `apps/admin`
  - **Детали:** Textarea для сообщения (поддержка HTML: `<b>`, `<i>`, `<a>`), превью как Telegram-пузырь, кнопка "Отправить всем" с confirm-модалкой (показывает кол-во получателей), таблица истории рассылок.
  - **Файлы:** новый `apps/admin/src/pages/BroadcastPage.tsx`, обновить `App.tsx` + `DashboardLayout.tsx` (добавить в nav)

---

## 🧊 ЗАМОРОЖЕНО — Монетизация + Payme/Click (Phase 4)

> ❄️ Фриз до открытия бизнес-счёта в Click и Payme. Не брать в работу.

- [ ] **[PAY-001]** DB schema: таблицы `subscription_plans`, `subscriptions`, `payment_transactions`
  - **Домен:** `packages/db`
  - **Детали:** `subscription_plans` (id, name, price_uzs, duration_days, features jsonb). `subscriptions` (id, seller_id, plan_id, status: ACTIVE/EXPIRED/CANCELLED, starts_at, expires_at). `payment_transactions` (id, seller_id, subscription_id, provider: PAYME|CLICK, amount_uzs, status: PENDING/PAID/FAILED, provider_tx_id, created_at).

- [ ] **[PAY-002]** Backend: Payme webhook + активация подписки
  - **Домен:** `apps/api`
  - **Детали:** `POST /payments/payme` — принимает Payme JSON-RPC (CheckPerformTransaction, CreateTransaction, PerformTransaction, CancelTransaction). При PerformTransaction → активировать подписку → открыть доступ к seller CRM.

- [ ] **[PAY-003]** Backend: Click webhook + активация подписки
  - **Домен:** `apps/api`
  - **Детали:** `POST /payments/click/prepare` + `POST /payments/click/complete`. При complete → активировать подписку.

- [ ] **[PAY-004]** Seller CRM: страница тарифов + кнопка оплаты
  - **Домен:** `apps/web-seller`
  - **Детали:** Страница `/billing` — список планов, текущая подписка, кнопка "Оплатить" → редирект на Payme/Click. После успешной оплаты → редирект обратно с активным доступом.
  - **Заметка:** Азимов домен

- [ ] **[PAY-005]** Admin: управление подписками продавцов
  - **Домен:** `apps/admin`
  - **Детали:** В SellerDetailPage показывать текущий план + историю платежей. Кнопка "Выдать подписку вручную" (для тестов и исключений).

---

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo

---

# Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`

> Все критические страницы Phase B готовы. Осталось ждать Полата по WEB-022 для тестирования.

## ✅ Выполнено (03.04.2026) — Азим

- Auth persistence (F5 не разлогинивает) ✅
- Seller logout — реальный вызов API + очистка кеша ✅
- Dashboard auth guard + редирект на /login ✅
- Onboarding guard (нет магазина → онбординг, есть → dashboard) ✅
- Login redirect если уже залогинен ✅
- Token expiry event → авто-logout в обоих приложениях ✅
- queryClient.clear() при logout ✅
- Analytics → реальный POST /api/v1/analytics/track ✅
- Seller sidebar — реальный phone вместо hardcoded ✅
- Dashboard — views из аналитики вместо ложной revenue ✅
- Buyer SEO meta (generateMetadata per store) ✅
- Buyer root title ("Create Next App" → реальный) ✅
- @ts-ignore × 2 → as React.CSSProperties ✅

~~[WEB-027] — ✅ Chat gateway готов, блокер снят (Полат, 03.04.2026)~~

~~[WEB-028] — ✅ Готово~~

