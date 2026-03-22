# Backend Tasks — Абубакир

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

- [x] render.yaml — деплой конфиг (API + PostgreSQL + Redis)
- [x] Seed script — глобальные категории + тестовые данные
- [x] ENV validation — падать при старте если не хватает переменных
- [x] BullMQ queues — Telegram/notifications через очереди
- [x] Socket.IO Redis adapter — горизонтальное масштабирование чата

---

## Правила

- Каждая задача = один модуль или одна крупная фича
- После завершения → перенести в docs/done/backend.md
- Если задача блокирует web или admin — указать явно
