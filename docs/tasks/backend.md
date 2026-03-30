# Backend Tasks — Полатр

Домен: `apps/api`, `packages/db`, `packages/types`
Агент: `backend-developer`, `schema-designer`

---

## Phase A — Core Foundation

### В работе
_пусто_

### Очередь
- [x] DatabaseModule (PrismaService + transaction manager)
- [x] AuthModule — OTP flow, JWT access/refresh, sessions
- [x] UsersModule — базовая identity
- [x] SellersModule — profile, verification state
- [x] StoresModule — CRUD, publish flow, slug generation
- [x] CategoriesModule — global + store categories
- [x] ProductsModule — CRUD, variants, stock
- [x] MediaModule — upload intent, R2 integration, signed URLs
- [x] CartModule — add/remove/update, one-store constraint
- [x] CheckoutModule — preview, confirm, cart-to-order
- [x] OrdersModule — lifecycle, status transitions, history
- [x] Telegram integration — seller notifications

### Заблокировано
_пусто_

---

## Phase B — Pilot Readiness

- [x] ChatModule — product + order threads, text messages
- [x] NotificationsModule — in-app notification center
- [x] ModerationModule — seller review queue
- [x] AdminModule — approve/reject/suspend endpoints
- [x] AnalyticsModule — event ingestion

---

## Phase C — Deploy & Production Ready

- [x] railway.toml — деплой конфиг Railway (apps/api/railway.toml, Dockerfile builder)
- [x] Seed script — глобальные категории + тестовые данные
- [x] ENV validation — падать при старте если не хватает переменных
- [x] BullMQ queues — Telegram/notifications через очереди
- [x] Socket.IO Redis adapter — горизонтальное масштабирование чата

---

---

## Phase D — API Endpoints (Sprint)

### 🔴 Priority 1 — Auth
- [x] POST /api/v1/auth/otp/send — алиас для request-otp (auth.controller.ts)
- [x] POST /api/v1/auth/otp/verify — алиас для verify-otp (auth.controller.ts)

### 🔴 Priority 2 — Storefront (публичные)
- [x] GET /api/v1/stores/:slug — данные магазина (products.controller.ts)
- [x] GET /api/v1/stores/:slug/products — список товаров с фильтрами (products.controller.ts)
- [x] GET /api/v1/stores/:slug/products/:id — детали товара (products.controller.ts)
- [x] GET /api/v1/storefront/stores/:slug — публичный endpoint (products.controller.ts)

### 🟡 Priority 3 — Orders
- [x] POST /api/v1/orders — создать заказ (orders-create.controller.ts в checkout модуле)
- [x] GET /api/v1/orders/:id — статус заказа buyer (orders.controller.ts)
- [x] GET /api/v1/seller/orders — уже было ✅
- [x] PATCH /api/v1/seller/orders/:id/status — уже было ✅

### 🟢 Priority 4 — Seller Dashboard
- [x] GET /api/v1/seller/store — уже было ✅
- [x] PUT /api/v1/seller/store — добавлен алиас PATCH (stores.controller.ts)
- [x] GET /api/v1/seller/products — уже было ✅
- [x] POST /api/v1/seller/products — уже было ✅
- [x] GET /api/v1/seller/metrics — алиас analytics/seller/summary (analytics.controller.ts)

---

## Правила

- Каждая задача = один модуль или одна крупная фича
- После завершения → перенести в docs/done/backend.md
- Если задача блокирует web или admin — указать явно
