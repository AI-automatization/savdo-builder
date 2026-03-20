# Backend Tasks — Абубакир

Домен: `apps/api`, `packages/db`, `packages/types`
Агент: `backend-developer`, `schema-designer`

---

## Phase A — Core Foundation

### В работе
_пусто_

### Очередь
- [ ] DatabaseModule (PrismaService + transaction manager)
- [ ] AuthModule — OTP flow, JWT access/refresh, sessions
- [ ] UsersModule — базовая identity
- [ ] SellersModule — profile, verification state
- [ ] StoresModule — CRUD, publish flow, slug generation
- [ ] CategoriesModule — global + store categories
- [ ] ProductsModule — CRUD, variants, stock
- [ ] MediaModule — upload intent, R2 integration, signed URLs
- [ ] CartModule — add/remove/update, one-store constraint
- [ ] CheckoutModule — preview, confirm, cart-to-order
- [ ] OrdersModule — lifecycle, status transitions, history
- [ ] Telegram integration — seller notifications

### Заблокировано
_пусто_

---

## Phase B — Pilot Readiness

- [ ] ChatModule — product + order threads, text messages
- [ ] NotificationsModule — in-app notification center
- [ ] ModerationModule — seller review queue
- [ ] AdminModule — approve/reject/suspend endpoints
- [ ] AnalyticsModule — event ingestion

---

## Правила

- Каждая задача = один модуль или одна крупная фича
- После завершения → перенести в docs/done/backend.md
- Если задача блокирует web или admin — указать явно
