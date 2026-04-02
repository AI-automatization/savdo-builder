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

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo

---

# Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`

> Все критические страницы Phase B готовы. Осталось ждать Полата по WEB-022 для тестирования.

## 🟡 В работе / На следующую сессию

### 🔴 [WEB-027] Socket.IO клиент — chat real-time (ЗАБЛОКИРОВАН)
- **Домен:** `apps/web-seller`, `apps/web-buyer`
- **Кто взял:** Азим (ждёт Полата)
- **Блокер:** Полат должен добавить chat gateway в API (аналогично `apps/api/src/socket/orders.gateway.ts`) — emit `chat:message` при новом сообщении в thread.
- **Детали:** После chat gateway — заменить `refetchInterval: 10_000` в `useMessages` на Socket.IO для обоих приложений.
- **Файлы:** `apps/web-seller/src/hooks/use-chat.ts`, `apps/web-buyer/src/hooks/use-chat.ts`

~~[WEB-028] — ✅ Готово~~
