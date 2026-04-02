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

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo

---

# Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`

> Все критические страницы Phase B готовы. Осталось ждать Полата по WEB-022 для тестирования.

## 🟡 На следующую сессию (после WEB-022 от Полата)

### 🟡 [WEB-026] Socket.IO клиент — seller real-time заказы
- **Домен:** `apps/web-seller`
- **Кто взял:** Азим (после WEB-015 от Полата)
- **Детали:** Заменить polling в `useSellerOrders` на Socket.IO. Подключиться к room `seller:{storeId}`. Слушать `order:new` → добавить в список + toast уведомление. Слушать `order:status_changed` → обновить через `queryClient.setQueryData`.
- **Файлы:** `apps/web-seller/src/hooks/use-orders.ts`, новый `apps/web-seller/src/lib/socket.ts`

### 🟡 [WEB-027] Socket.IO клиент — chat real-time
- **Домен:** `apps/web-seller`, `apps/web-buyer`
- **Кто взял:** Азим (после WEB-015 от Полата)
- **Детали:** Заменить polling (10s) в `useMessages` на Socket.IO для обоих приложений.
- **Файлы:** `apps/web-seller/src/hooks/use-chat.ts`, `apps/web-buyer/src/hooks/use-chat.ts`

### 🟢 [WEB-028] Seller analytics страница
- **Домен:** `apps/web-seller`
- **Кто взял:** Азим
- **Детали:** Страница `/analytics` уже есть endpoint `GET /api/v1/analytics/seller/summary` (сделан Полатом). Отобразить: views, topProduct, conversionRate за последние 30 дней. Карточки + простой chart (или просто числа).
- **Файлы:** `apps/web-seller/src/app/(dashboard)/analytics/page.tsx` (новый)
