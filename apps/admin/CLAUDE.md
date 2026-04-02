# apps/admin — Admin Panel Rules

**Owner:** Полат
**Agent:** `web-developer`, `ui-builder`

> ⚠️ Owner изменён с 01.04.2026. Яхьо больше не работает с этим доменом.
> Все задачи и изменения в `apps/admin` — только через Полата.

---

## Stack

Vite + React SPA (НЕ Next.js) + TypeScript + Tailwind
Дизайн-система: **Liquid Authority** (тёмная тема, navy + indigo)
Деплой: Railway → `https://savdo-builderadmin-production.up.railway.app`

## Audience

Один superadmin (команда Savdo). Управление продавцами, магазинами, заказами.

## Auth

OTP через Telegram (@savdo_builderBOT):
- Код: **4 цифры**
- Таймер: **5 минут (300 сек)**
- `purpose: 'login'` обязателен в обоих запросах (request-otp и verify-otp)
- Нужно: `role=ADMIN` в таблице `users` + запись в `admin_users`

## API

Переменная: `VITE_API_URL` (задаётся через Railway Variables при деплое)
Клиент: `src/lib/api.ts` — нативный fetch, НЕ axios
Hook: `src/lib/hooks.ts` — `useFetch<T>(path, deps)`

## Страницы → Endpoints

| Страница | Endpoint | Статус |
|----------|----------|--------|
| `/dashboard` | `GET /api/v1/admin/sellers`, `GET /api/v1/admin/stores`, `GET /api/v1/admin/moderation/queue` | ✅ |
| `/sellers` | `GET /api/v1/admin/sellers` | ✅ |
| `/stores` | `GET /api/v1/admin/stores` | ✅ |
| `/moderation` | `GET /api/v1/admin/moderation/queue` + `POST /api/v1/admin/moderation/:id/action` | ✅ |
| `/audit-logs` | `GET /api/v1/admin/audit-log?page=&limit=20` | ✅ |
| `/orders` | — | ❌ Нет endpoint, будет в следующем спринте |

## Rules

- Dense UI: таблицы, фильтры, быстрые действия
- Destructive actions (suspend, block, reject) — всегда confirmation modal
- Rejection/suspension — comment field обязателен (INV-A02)
- Status badge цвета по `docs/V1.1/02_state_machines.md`
- Все admin endpoints: `/api/v1/admin/*`
- Типы: только из `packages/types`
- Перед UI задачей → читать `docs/design/liquid-authority.md`
- При нахождении багов → писать в `analiz/logs.md`
