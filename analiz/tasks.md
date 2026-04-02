# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/admin`, `apps/mobile-buyer`, `apps/mobile-seller`

> ⚠️ Admin panel передана Полату (ранее Яхьо). Яхьо больше не работает над `apps/admin`.

---

## 🔴 Срочно — блокирует Азима

### 🔴 [WEB-022] DEV_OTP_ENABLED на Railway — локальное тестирование
- **Домен:** `apps/api` (Railway Variables)
- **Кто взял:** Полат
- **Детали:** Азим не может залогиниться локально — OTP уходит в Telegram, а бот не поднят локально. Нужно на Railway → сервис `savdo-api` → Variables установить `DEV_OTP_ENABLED=true`. Тогда OTP-код будет виден в Railway Logs (не в Telegram). После тестирования — вернуть `false`.
- **Файлы:** Railway Dashboard только

### 🔴 [WEB-001] Убрать дубль `PaginationMeta` из `packages/types`
- **Домен:** `packages/types`
- **Кто взял:** Полат
- **Детали:** `PaginationMeta` объявлён в `packages/types/src/common.ts` И в `packages/types/src/api/orders.ts`. Вызывает TS2308 в web-*. Нужно убрать дубль из `common.ts`, оставить в `api/orders.ts`.
- **Файлы:** `packages/types/src/common.ts` — удалить `export interface PaginationMeta`

---

## 🟡 Backend — после стабилизации

### 🟡 [WEB-015] Socket.IO — emit `order:new` и `order:status_changed` для seller
- **Домен:** `apps/api`
- **Кто взял:** Полат
- **Детали:** Seller dashboard будет слушать real-time события. Нужно emit при: (1) новый заказ → `order:new` в room `seller:{storeId}`, (2) смена статуса → `order:status_changed` в ту же room. Payload: `OrderListItem`. На frontend уже готов polling (10s) как placeholder — после этого заменим на socket.
- **Файлы:** `apps/api/src/modules/orders/` (orders.service.ts или orders.gateway.ts)

---

## 🟡 Admin — Phase B (после стабильного backend admin API)

> Phase A уже сделана (макеты с моками). Phase B — подключение к реальному API.

- [ ] **[ADM-008]** Интеграция admin auth (JWT)
- [ ] **[ADM-009]** Seller review queue — реальные данные + SLA-таймер
- [ ] **[ADM-010]** Store approve/reject/suspend flow + confirmation modal
- [ ] **[ADM-011]** Product hide/restore
- [ ] **[ADM-012]** Order overview с фильтрами
- [ ] **[ADM-013]** Поиск по телефону / order number / slug
- [ ] **[ADM-014]** Seller detail страница с историей moderation actions

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
