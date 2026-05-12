# Спринт: TMA Quality + Platform Hardening (04-09 мая 2026)

**Автор:** Полат
**Длительность:** 5 рабочих дней (Mon-Fri)
**Цель:** убрать пользовательские блокеры в TMA (чат, фото, формы, селекты), закрыть UX-долг по дизайн-аудиту, проверить безопасность (SQL/sockets), подготовить in-app уведомления.

> Источник задач: реальные жалобы Полата 03.05.2026 + `[DESIGN-AUDIT-TMA-001]` + `[PERF-TMA-API-001]` + `[BUG-CHAT-LOAD-001]` в `analiz/logs.md`.

---

## 📊 Backlog по приоритету

### 🔴 P0 — релиз-блокеры (платформа неюзабельна без этого)

| ID | Задача | Домен | Estimate | Зависит | Кто |
|----|--------|-------|----------|---------|-----|
| ✅ `TMA-CHAT-403-READ-001` | 403 на `/chat/threads/:id/messages` для dual-role юзера — dual-profile check в `getMessages` | apps/api/chat | S | — | **СДЕЛАНО** (`2b2bca7`) |
| `TMA-CHAT-403-WRITE-001` | Тот же dual-role на write-paths: `sendMessage`, `editMessage`, `deleteMessage`, `markAsRead`, `deleteThread` | apps/api/chat | M | TMA-CHAT-403-READ-001 | Полат |
| `TMA-PHOTO-UPLOAD-DIAG-001` | «Фото не грузит» — собрать конкретный лог запроса (URL + status + body), найти корень. Возможные причины: STORAGE_PUBLIC_URL не выставлен, multipart упал, R2 ключ протух, /media/upload guard | apps/tma + apps/api/media | S (диагноз) → M (фикс) | console-логи | Полат + Полат |

### 🟠 P1 — серьёзные UX-проблемы (юзер не может пользоваться нормально)

| ID | Задача | Домен | Estimate | Зависит | Кто |
|----|--------|-------|----------|---------|-----|
| `TMA-SELECT-CUSTOM-001` | Native `<select>` → кастомный `Select` (popover, поиск, keyboard nav). Портировать из `apps/web-seller/src/components/select.tsx` в `apps/tma/src/components/ui/Select.tsx`. Применить в AddProductPage / EditProductPage / SettingsPage везде где `<select>` | apps/tma | M | — | Полат |
| `TMA-CROPPER-UX-001` | (1) Большая видимая кнопка «✕ Отменить» с контрастом, не серый текст. (2) `zIndex: 9999` (сейчас 200, BottomNav может перекрывать). (3) Кнопка «➕ Добавить ещё фото» в AddProductPage / EditProductPage — пользователь должен иметь чёткий CTA после кропа | apps/tma/components/ui/ImageCropper.tsx + AddProductPage / EditProductPage | M | — | Полат |
| `TMA-DYNAMIC-VARIANT-FILTERS-001` | Размеры/опции товара динамически из `CategoryFilter` по выбранной категории. Сейчас хардкод-toggle «Товар с размерами» с фикс S/M/L/XL. Нужно: после выбора `globalCategoryId` → `GET /storefront/categories/:slug/filters` → отрендерить fields (для одежды — Размер SELECT с options, для ноута — RAM, бренд, экран). Сохранять в `Product.attributes` + `ProductOptionGroup` | apps/tma + apps/api | XL (8h+) | TMA-SELECT-CUSTOM-001 | Полат |
| `TMA-DESIGN-P0P1-001` | Закрыть P0+P1 из `[DESIGN-AUDIT-TMA-001]`: BottomNav inactive label контраст 0.28 → 0.50. Hit-area 26-32px → 44+ для add-to-cart, back, ✕. `aria-hidden="true"` на decorative emoji. `role/tabIndex/onKeyDown` на `<div onClick>` | apps/tma | M | — | Полат |
| `TMA-RESPONSIVE-DESKTOP-001` | На desktop sidebar = ~240px, контент сужен в правый рельс. ImageCropper и BottomSheet'ы должны перекрывать ВЕСЬ экран (включая sidebar). Сейчас z-index конфликт между AppShell layout и fixed-modal'ами. Грид — flex или grid? Проверить в реальном Telegram desktop | apps/tma/components/layout + ImageCropper + CategoryModal | M | — | Полат |

### 🟡 P2 — security и качество кода (не блокеры, но риск)

| ID | Задача | Домен | Estimate | Зависит | Кто |
|----|--------|-------|----------|---------|-----|
| `API-SQL-INJECTION-AUDIT-001` | grep `$queryRaw` / `$executeRaw` / `Prisma.raw` во всём apps/api. Каждое usage проверить: prepared parameters? user input через DTO? | apps/api | M | — | Полат / параллельная сессия |
| `API-WS-AUDIT-001` | WebSocket gateways: chat, orders. Проверить: handshake JWT verify (уже есть после `7cdb4c6`), `join-seller-room` storeId verify, `join-buyer-room` buyerId match, rate-limit на emit, нет утечки thread'ов между rooms | apps/api/socket + chat + orders | M | — | Полат |
| `API-RATE-LIMIT-AUDIT-001` | Все public endpoints (без JwtAuthGuard) должны иметь `@Throttle()`. Найти где забыли | apps/api | S | — | Полат |
| `TMA-SELLER-PERF-PASS-001` | AbortController + prefetch на остальных seller-страницах (DashboardPage, ProductsPage, OrdersPage seller, EditProductPage, AddProductPage, ChatPage seller). Buyer уже сделан в `d69cbfb` | apps/tma/pages/seller | M | — | параллельная сессия (см. `parallel-session-prompts.md` шаблон №1) |

### 🟢 P3 — фичи (планировать после P0-P1)

| ID | Задача | Домен | Estimate | Зависит | Кто |
|----|--------|-------|----------|---------|-----|
| `NOTIF-IN-APP-001` | In-app уведомления в TMA. Backend: новая `Notification` модель (id, userId, type, title, body, link, isRead, createdAt) + `notification.created` event → BullMQ → socket emit. Frontend: badge на BottomNav иконке «👤 настройки», список в SettingsPage, toast при socket-emit. Уже есть `/notifications/inbox` для seller — расширить на buyer + добавить socket | apps/api + apps/tma | XL (8h+) | TMA-CHAT-403-WRITE-001 | Полат |
| `WEB-DESIGN-AUDIT-001` | Дизайн-аудит web-buyer + web-seller по тем же 5 критериям что для TMA (см. `parallel-session-prompts.md` шаблон №3) | apps/web-* | M | — | параллельная сессия |
| `DB-AUDIT-001` | Composite-индексы (Product feed sort by new), pg_trgm GIN на title, FK relations review | packages/db | M | — | параллельная сессия (шаблон №4) |

---

## 📅 День-в-день план

### День 1 (понедельник 04.05) — закрытие чат-домена

**Утро (3h):**
- `TMA-CHAT-403-WRITE-001` — порт dual-role check на send/edit/delete. Идентичный паттерн как в `getMessages`: новый input `{buyerProfileId?, sellerProfileId?}`, проверка `isBuyer || isSeller`. 5 use-case'ов: send / edit / delete (message) / delete (thread) / markAsRead.
- Тесты: создать тред где user = buyer на одном устройстве, открыть как seller на другом — должен видеть и писать.

**После обеда (3h):**
- `TMA-PHOTO-UPLOAD-DIAG-001` (диагноз) — Полат присылает console-лог с конкретным URL и кодом ошибки. Я смотрю код media.controller.ts, проверяю STORAGE_PUBLIC_URL на Railway, проверяю /media/upload guard, проверяю Telegram channel admin status.

**Конец дня:** push api → main → tma + api ветки. Коммит `TMA-CHAT-403-WRITE-001`.

### День 2 (вторник 05.05) — TMA UX

**Утро (3h):**
- `TMA-SELECT-CUSTOM-001` — порт `apps/web-seller/src/components/select.tsx` в `apps/tma/src/components/ui/Select.tsx`. Адаптировать стили под TMA-токены. Применить в AddProductPage seller (Бренд, Тип товара, Категория). EditProductPage. SettingsPage если есть native select.

**После обеда (3h):**
- `TMA-CROPPER-UX-001` — большая «✕ Отменить» сверху красным/серым с border. zIndex 9999. В AddProductPage добавить state `images: File[]` (массив!) и кнопку «➕ Добавить ещё фото» которая открывает file input → cropper → push в массив.

**Конец дня:** push tma. Visual smoke в Telegram desktop.

### День 3 (среда 06.05) — динамические опции

**Весь день (8h):**
- `TMA-DYNAMIC-VARIANT-FILTERS-001`:
  1. Backend (1h): убедиться `/storefront/categories/:slug/filters` отдаёт `{key, nameRu, fieldType, options, unit, isRequired}`. Если нет — добавить.
  2. Frontend AddProductPage (4h):
     - После выбора категории → fetch filters
     - Удалить хардкод-toggle «Товар с размерами»
     - Динамический рендер: SELECT (custom dropdown), MULTI_SELECT (chips), NUMBER (input + unit), BOOLEAN (toggle), TEXT (input), COLOR (color swatches)
     - При SELECT/MULTI_SELECT с >1 значением → автоматически создавать `ProductOptionGroup` + `ProductVariant` matrix (как в web-seller)
  3. EditProductPage (2h): загрузить existing attributes + variants → отрендерить такую же форму pre-filled.
  4. Smoke-test (1h): создать товар «футболка» → выбрать «Одежда → Футболки» → должны появиться поля «Размер», «Бренд», «Цвет». Создать → витрина показывает варианты.

**Конец дня:** push tma + api если бэк правился.

### День 4 (четверг 07.05) — design polish + responsive

**Утро (4h):**
- `TMA-DESIGN-P0P1-001` — все P0+P1 точки из дизайн-аудита.
- `TMA-RESPONSIVE-DESKTOP-001` — modals/cropper перекрывают весь экран. Sidebar collapse на desktop меньше чем 1280px чтобы контент дышал.

**После обеда (4h):**
- `TMA-SELLER-PERF-PASS-001` — делегировать параллельной сессии через шаблон №1 в `parallel-session-prompts.md`. Я могу следить за PR и review'ить.

**Конец дня:** push tma.

### День 5 (пятница 08.05) — security audits + buffer

**Утро (4h):**
- `API-SQL-INJECTION-AUDIT-001` — параллельная сессия (шаблон №5).
- `API-WS-AUDIT-001` — параллельная сессия.
- `API-RATE-LIMIT-AUDIT-001` — Полат сам или параллельная.

**После обеда (4h):**
- Buffer на доделки + smoke-test всего MVP в Telegram реально:
  1. Зарегистрироваться → buyer
  2. Зайти в магазин → выбрать товар → корзина → checkout
  3. Зарегистрироваться вторым аккаунтом → seller → создать товар (новая форма!) → опубликовать
  4. Купить с buyer → подтвердить заказ с seller → доставить
  5. Чат buyer ↔ seller (фото, edit, delete, reply)
  6. Возврат через admin (новая фича из параллельной сессии)
  7. Все toast'ы и haptic'и работают
- Запись итогов спринта в `analiz/sprint-summary-08-05-2026.md`.

### Резерв 6-й день (суббота 09.05)
- `NOTIF-IN-APP-001` если есть силы. Backlog для следующего спринта если нет.

---

## 🎯 Definition of Done на каждую задачу

1. ✅ TypeScript компилируется (`npx tsc --noEmit`).
2. ✅ Vite/Nest build проходит без ошибок.
3. ✅ Запись в `analiz/done.md` с ID + commit hash + файлы.
4. ✅ Коммит запушен в `main` + замержен в нужную deploy-ветку (api/tma/admin/web-buyer/web-seller).
5. ✅ Если bug fix — короткая запись в `analiz/logs.md` + ADR через `obsidian-note.ps1` если решение нетривиальное.
6. ✅ Visual smoke-test в реальном Telegram (для UX-задач).

---

## 🚦 Дисциплина параллельных сессий

Параллельная сессия Claude **продолжает** работать над admin (Super Admin RBAC + MFA + Refunds + Impersonation). Перед стартом каждой задачи Полат делает:

```bash
cd c:/Users/USER/Desktop/debug/savdo-builder
git fetch origin
git status
```

Если есть `M`/`??` файлы из admin/ — это параллельная сессия, не трогать. `git add` только по конкретным именам моих файлов.

Шаблоны промтов для запуска параллельных тасков — `D:/Obsidian Vault/AI_CONTEXT/parallel-session-prompts.md`.

---

## 📌 Что НЕ в спринте (на потом)

- `WEB-DESIGN-AUDIT-001` — Азим / параллельная сессия.
- `DB-AUDIT-001` — параллельная сессия после спринта.
- Оптимизация bundle TMA (сейчас 228KB index — нормально).
- pg_trgm для search — пока не критично (товаров мало).
- Mobile-buyer / mobile-seller (Phase 3, заморожено).
- Payme/Click интеграция (Phase 4, заморожено до бизнес-счёта).

---

## 🔢 Цифры спринта

- **Задач P0:** 3 (1 ✅, 2 в работе)
- **Задач P1:** 5
- **Задач P2:** 4
- **Задач P3:** 3
- **Estimate итого:** ~32 рабочих часа = 4 дня full-time + buffer
- **Делегировано параллельной сессии:** 4 задачи (`TMA-SELLER-PERF-PASS-001`, `API-SQL-INJECTION-AUDIT-001`, `API-WS-AUDIT-001`, `WEB-DESIGN-AUDIT-001`)
