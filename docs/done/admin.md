# Admin — Завершённые задачи

| Дата | Задача | Примечание |
|------|--------|------------|
| 01.04.2026 | Переписан с Next.js → **Vite + React SPA** | Правильный стек для SPA без SSR |
| 01.04.2026 | Дизайн: Liquid Authority (тёмная тема, navy + indigo) | `docs/design/liquid-authority.md` |
| 01.04.2026 | Базовый layout: sidebar + top bar | `apps/admin/src/layouts/` |
| 01.04.2026 | Login страница `/login` — OTP через Telegram | 4-значный код, таймер 300 сек, `purpose: 'login'` |
| 01.04.2026 | Страница `/dashboard` → реальный API | Счётчики sellers, stores, moderation queue |
| 01.04.2026 | Страница `/sellers` → `GET /api/v1/admin/sellers` | Реальные данные |
| 01.04.2026 | Страница `/stores` → `GET /api/v1/admin/stores` | Реальные данные |
| 01.04.2026 | Страница `/moderation` → `GET /api/v1/admin/moderation/queue` | + `POST .../action` (APPROVE/REJECT/ESCALATE) |
| 01.04.2026 | Страница `/audit-logs` → `GET /api/v1/admin/audit-log` | Пагинация, поиск |
| 01.04.2026 | Страница `/orders` | Пустой экран — нет admin orders endpoint (следующий спринт) |
| 01.04.2026 | `src/lib/api.ts` — нативный fetch клиент | НЕ axios |
| 01.04.2026 | `src/lib/hooks.ts` — `useFetch<T>` hook | — |
| 01.04.2026 | Dockerfile multi-stage (builder + nginx) | `VITE_API_URL` через ARG |
| 01.04.2026 | nginx.conf — `$PORT` через envsubst | Шаблон в `/etc/nginx/templates/` |
| 01.04.2026 | Задеплоен на Railway | `https://savdo-builderadmin-production.up.railway.app` |
| 01.04.2026 | Owner изменён: Яхьо → **Полат** | `apps/admin/CLAUDE.md`, `CLAUDE.md` обновлены |
| 08.04.2026 | [ADM-B06] UsersPage — список пользователей, фильтр role/status/phone | `apps/admin/src/pages/UsersPage.tsx` (уже был готов) |
| 08.04.2026 | [ADM-B07] ModerationDetailPage — `/moderation/:id` с assign + actions + history | `apps/admin/src/pages/ModerationDetailPage.tsx`, роут в `App.tsx`, кнопка "Открыть" в `ModerationPage.tsx` |
| 08.04.2026 | fix(web-buyer): пути standalone для монорепо с outputFileTracingRoot | `apps/web-buyer/Dockerfile`, `apps/web-buyer/railway.toml` — исправлен CMD и пути static/public |
| 08.04.2026 | [ADM-C01] SLA-таймер на moderation cards | `ModerationPage.tsx` — уже был реализован, помечен как выполнен |
| 08.04.2026 | [ADM-C02] Seller detail — история moderation actions | `SellerDetailPage.tsx` — уже был реализован, помечен как выполнен |
| 08.04.2026 | [ADM-C03] Analytics events page | `apps/admin/src/pages/AnalyticsEventsPage.tsx` — новая страница с фильтрами, пагинацией, expand payload |
| 08.04.2026 | [ADM-C04] Orders overview | `OrdersPage.tsx` + `GET /api/v1/admin/orders` — уже были реализованы |
| 08.04.2026 | UserDetailPage — `/users/:id` | `apps/admin/src/pages/UserDetailPage.tsx` — детали пользователя + suspend/unsuspend, ссылка на seller profile |
