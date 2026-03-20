# 16_team_build_plan.md

## 1. Команда

| Участник | Зона ответственности |
|---|---|
| **[Ты]** | Backend API + Mobile (buyer app + seller app) |
| **Азим** | Web buyer + Web seller + Project Management |
| **Яхйо** | Admin panel |

---

## 2. Почему scope реалистичен

С тремя разработчиками проект выполним при следующих условиях:

- Mobile разрабатывается **после** веб-клиентов (один человек — и backend, и mobile)
- Backend даёт API-контракты до того, как Азим начинает frontend
- Яхйо может начинать admin panel параллельно после появления базовых backend endpoints
- MVP не включает параллельный запуск всех 6 приложений — это поэтапно

---

## 3. Фазы разработки

### Фаза 1 — Backend Core (Недели 1–6)
**Ответственный: [Ты]**

Цель: готовый API, на котором остальные могут строить

Порядок модулей:
1. `auth` — OTP, сессии, refresh tokens
2. `users` / `sellers` / `buyers` — identity layer
3. `stores` — создание, настройки, публикация
4. `categories` — global + store-level
5. `products` + `variants` — CRUD, stock, images
6. `cart` — one-seller constraint, guest session
7. `checkout` — validation, order creation
8. `orders` — lifecycle, status transitions
9. `chat` — threads, messages, unread
10. `notifications` — routing service, queue processors
11. `media` — upload, attach, signed URLs
12. `moderation` / `admin` endpoints

Deliverable: Postman/OpenAPI collection с задокументированными endpoint-ами для Азима и Яхйо

---

### Фаза 2 — Web + Admin (Недели 4–10, параллельно с окончанием backend)

#### Азим — Seller Web (приоритет 1)
Seller web блокирует весь онбординг продавцов. Начинать с него.

Порядок:
1. auth (login, OTP verify)
2. onboarding (seller profile, store setup, docs upload)
3. store settings
4. products list + create/edit (включая variants)
5. orders list + detail + actions
6. chats
7. web push

#### Азим — Buyer Web (приоритет 2, после seller web core)
1. storefront page (по slug)
2. product detail
3. cart
4. checkout
5. order detail
6. chat (product inquiry + order)
7. web push

#### Яхйо — Admin Panel (параллельно с Фазой 2)
Начинать сразу как появятся seller и store endpoints.

Порядок:
1. auth
2. dashboard overview
3. sellers list + detail + actions (approve/reject)
4. stores list + detail + actions
5. moderation queue
6. products list + hide/restore
7. orders list + detail
8. chats read-only
9. audit logs
10. notification logs

---

### Фаза 3 — Mobile (Недели 9–16)
**Ответственный: [Ты]**

Начинать только после стабильного backend.

Порядок:
1. **Buyer app** (первый, т.к. buyer-side simpler)
   - auth, storefront, product, cart, checkout, orders, chat, push
2. **Seller app** (второй)
   - auth, onboarding status, orders, chat, basic products, push

---

## 4. Зависимости между командой

```
[Ты: Backend] ──────────────────────────────────────────►
                │
                ├─ Week 2: auth + seller endpoints ──► Яхйо: Admin auth
                ├─ Week 3: store + products ──────────► Азим: Seller web start
                ├─ Week 5: cart + checkout ───────────► Азим: Buyer web
                └─ Week 9: stable API ────────────────► [Ты: Mobile start]
```

**Критическое правило:** backend должен поставлять stubs/mock responses там, где реализация ещё не готова, чтобы Азим и Яхйо не ждали.

---

## 5. API Contract Agreement

До начала frontend разработки (конец Недели 2–3):

- Сформировать OpenAPI spec или Postman collection для ключевых endpoint-ов
- Согласовать request/response shapes для: auth, storefront, products, cart, orders, chat
- Заморозить контракт — изменения через явное согласование

Инструменты:
- Postman workspace (shared)
- или Swagger UI от NestJS (`@nestjs/swagger`)

---

## 6. Shared Code (Monorepo)

Азим и [Ты] должны договориться о shared packages до старта:

```
/packages/types       — общие TypeScript типы (User, Order, Product и тд)
/packages/api-client  — типизированный HTTP клиент
/packages/utils       — shared utilities
```

Это критично чтобы не дублировать типы между backend, web и mobile.

---

## 7. Definition of Done для V0.1 MVP

Продукт готов к первому запуску когда:

**Backend:**
- [ ] Все core API endpoints работают
- [ ] Auth flow (OTP) через Eskiz
- [ ] Создание заказа транзакционно
- [ ] Нотификации работают (push + Telegram)
- [ ] Media upload работает

**Seller Web (Азим):**
- [ ] Онбординг до public store
- [ ] Создание товара с вариантами
- [ ] Обработка заказа (confirm/cancel)
- [ ] Чат с покупателем
- [ ] Web push работает

**Buyer Web (Азим):**
- [ ] Открыть магазин по ссылке из Telegram
- [ ] Выбрать товар, вариант, добавить в корзину
- [ ] Оформить заказ
- [ ] Получить статус заказа

**Admin (Яхйо):**
- [ ] Просмотр и approve/reject seller
- [ ] Просмотр и approve store
- [ ] Скрыть продукт
- [ ] Просмотр заказов и чатов

**Mobile:** В V0.1 MVP — опционально. Выпускается после стабилизации web.

---

## 8. Success Metrics (из 00_overview.md)

- 30 активных продавцов
- 100 опубликованных товаров
- 20 опубликованных магазинов
- 10 завершённых заказов
- 40% retention продавцов (7 дней)

Эти метрики достижимы **без мобильного приложения** на первом этапе.

---

## 9. Риски команды

| Риск | Вероятность | Митигация |
|---|---|---|
| Backend задерживается, frontend ждёт | Высокая | Mock API stubs с первой недели |
| [Ты] перегружен backend + mobile | Высокая | Mobile строго в Фазе 3, не раньше |
| Scope creep в seller web | Средняя | Жёсткий V0.1 scope, фичи в backlog |
| Несогласованные типы между apps | Средняя | Shared /packages/types с первого дня |
| Eskiz/SMS интеграция сложнее чем ожидалось | Низкая | Dev mode с console OTP, интеграция в Неделю 1 |
