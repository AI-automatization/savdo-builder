# Admin Tasks — Полат

Домен: `apps/admin`
Стек: Vite + React SPA + TypeScript

---

## 📋 Таски от admin к backend

> Все эндпоинты уже реализованы. Проверка:

| Эндпоинт | Статус | Ключ ответа |
|----------|--------|-------------|
| `GET /api/v1/admin/sellers` | ✅ Готов | `{ sellers, total }` |
| `GET /api/v1/admin/sellers/:id` | ✅ Готов | seller + user + store |
| `GET /api/v1/admin/stores` | ✅ Готов | `{ stores, total }` |
| `GET /api/v1/admin/stores/:id` | ✅ Готов | store + seller + contacts |
| `GET /api/v1/admin/users` | ✅ Готов | `{ users, total }` |
| `GET /api/v1/admin/users/:id` | ✅ Готов | user + seller + buyer |
| `POST /api/v1/admin/users/:id/suspend` | ✅ Готов | требует `{ reason }` |
| `POST /api/v1/admin/users/:id/unsuspend` | ✅ Готов | требует `{ reason }` |
| `POST /api/v1/admin/stores/:id/suspend` | ✅ Готов | требует `{ reason }` |
| `POST /api/v1/admin/stores/:id/unsuspend` | ✅ Готов | требует `{ reason }` |
| `GET /api/v1/admin/moderation/queue` | ✅ Готов | `{ data, total }` |
| `GET /api/v1/admin/moderation/:id` | ✅ Готов | case + actions |
| `POST /api/v1/admin/moderation/:id/action` | ✅ Готов | APPROVE/REJECT/ESCALATE |
| `PATCH /api/v1/admin/moderation/:id/assign` | ✅ Готов | назначить на себя |
| `GET /api/v1/admin/audit-log` | ✅ Готов | `{ logs, total }` |
| `GET /api/v1/admin/analytics/events` | ✅ Готов | `{ data, total }` |

**Нет ни одного блокирующего запроса к backend.** Весь Phase B — frontend работа.

---

## Phase B — Frontend (текущий спринт)

- [x] **[ADM-B01]** Роутинг: `/sellers/:id`, `/stores/:id` → App.tsx
- [x] **[ADM-B02]** `SellerDetailPage` — детали продавца + suspend/unsuspend user
- [x] **[ADM-B03]** `StoreDetailPage` — детали магазина + suspend/unsuspend store
- [x] **[ADM-B04]** `SellersPage` — ряд кликабельный → navigate `/sellers/:id`
- [x] **[ADM-B05]** `StoresPage` — кнопка "Открыть" → navigate `/stores/:id`
- [ ] **[ADM-B06]** `UsersPage` — список пользователей, фильтр по role/status
- [ ] **[ADM-B07]** Moderation detail — клик на кейс → `/moderation/:id` с assign + action

---

## Phase C — Расширение (следующий спринт)

- [ ] **[ADM-C01]** SLA-таймер на pending review cards (moderation queue)
- [ ] **[ADM-C02]** Seller detail — история moderation actions
- [ ] **[ADM-C03]** Analytics events page → `GET /api/v1/admin/analytics/events`
- [ ] **[ADM-C04]** Orders overview (нужен новый backend endpoint)
