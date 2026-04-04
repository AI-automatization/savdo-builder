# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/admin`, `apps/mobile-buyer`, `apps/mobile-seller`

> ⚠️ Admin panel передана Полату (ранее Яхьо). Яхьо больше не работает над `apps/admin`.

> ADM Phase A (ADM-001..008) — выполнено 01.04.2026, перенесено в `done.md`

---

## 🔴 Нужно от Полата — блокирует Азима

### 🔴 [API-010] GET /auth/me — эндпоинт не существует
- **Домен:** `apps/api`
- **Блокирует:** оба приложения (web-seller, web-buyer)
- **Проблема:** При перезагрузке страницы `user` берётся из `localStorage` — данные могут быть устаревшими. Нет способа проверить актуальность токена и получить свежие данные пользователя без этого эндпоинта.
- **Что нужно:** `GET /api/v1/auth/me` → возвращает `AuthUser` (id, phone, isPhoneVerified, role). Требует `JwtAuthGuard`. После — Азим добавит вызов при старте приложения в `AuthContext`.
- **Файлы:** `apps/api/src/modules/auth/auth.controller.ts` + use-case

### 🔴 [API-013] Socket: chat:new_message → seller-room
- **Домен:** `apps/api`
- **Блокирует:** `apps/web-seller` — уведомления о новых сообщениях
- **Проблема:** `useSellerSocket` слушает только `order:*` события в seller-room. Чат-уведомления приходят только в конкретный thread-room. Продавец не узнаёт о новых сообщениях если не открыт чат.
- **Что нужно:** При создании нового сообщения в чате — дополнительно emit `chat:new_message` в seller-room (`storeId`). Payload: `{ threadId, buyerName? }`.

### 🔴 [API-014] Socket: order:status_changed → buyer
- **Домен:** `apps/api`
- **Блокирует:** `apps/web-buyer` — realtime обновление статуса заказа
- **Проблема:** Покупатель не получает realtime обновлений когда продавец меняет статус заказа. Нет buyer-room.
- **Что нужно:** При смене статуса заказа — emit `order:status_changed` в buyer-room (по `buyerId`). Тогда Азим добавит hook в buyer app.

### 🔴 [API-012] Buyer phone в деталях заказа продавца
- **Домен:** `apps/api`
- **Блокирует:** `apps/web-seller` — страница деталей заказа
- **Проблема:** `Order` тип содержит только `buyerId: string`. Нет объекта `buyer` с телефоном. Продавец не может связаться с покупателем напрямую.
- **Что нужно:** Добавить в `Order` (seller detail endpoint): `buyer: { phone: string }`. Полат обновляет тип в `packages/types` и endpoint `GET /seller/orders/:id`.

### 🔴 [API-011] Delivery settings — поля не в PATCH /seller/store
- **Домен:** `apps/api`
- **Блокирует:** `apps/web-seller` — страница настроек магазина
- **Проблема:** В БД у `Store` есть `deliveryFeeType` (fixed/manual/none) и `deliveryFeeAmount`, но `update-store.dto.ts` их не принимает → Азим не может добавить UI управления доставкой.
- **Что нужно:** Добавить в `UpdateStoreDto`:
  ```ts
  deliveryFeeType?: 'fixed' | 'manual' | 'none';
  deliveryFeeAmount?: number;
  ```
  И обработать в use-case. После — Азим добавит секцию "Доставка" в `settings/page.tsx`.
- **Файлы:** `apps/api/src/modules/stores/dto/update-store.dto.ts`, use-case обновления магазина

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

- [x] **[ADM-021]** Dashboard charts ✅

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

## 🟡 Следующие задачи — Азим (без блокеров)

## 🔴 Ждём Полата (блокируют Азима)

> API-010 и API-011 в таблице блокеров выше (начало файла)

