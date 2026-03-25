# Done — Полатр

---

## 2026-03-25

### ✅ [API-001] render.yaml → Railway конфиг
- **Важность:** 🔴 Критическая
- **Файлы:** `apps/api/railway.toml` (создан), `render.yaml` (удалён)
- **Что сделано:** Создан `apps/api/railway.toml` с Dockerfile builder, healthcheck на `/api/v1/health`, watchPatterns для `apps/api/**` и `packages/**`. Удалён `render.yaml`. Обновлён `docs/tasks/backend.md`.

### ✅ [API-002] CI/CD — GitHub Actions для backend
- **Важность:** 🟡 Важная
- **Файлы:** `.github/workflows/ci-backend.yml`
- **Что сделано:** Настроен CI pipeline — запускается только при изменениях в `apps/api/**`, `packages/db/**`, `packages/types/**`. Шаги: pnpm install → prisma generate → tsc --noEmit → lint → build → test. Сервисы: PostgreSQL 16 + Redis 7.

### ✅ [API-003] Socket.IO Redis Adapter
- **Важность:** 🟡 Важная
- **Файлы:** `apps/api/src/socket/redis-io.adapter.ts`, `apps/api/src/main.ts`
- **Что сделано:** Уже было полностью реализовано — `RedisIoAdapter` подключён в `main.ts`, использует `@socket.io/redis-adapter`. Задача закрыта как выполненная.

### ✅ [API-004] Seller Analytics Endpoint
- **Важность:** 🟢 Обычная
- **Файлы:** `apps/api/src/modules/analytics/repositories/analytics.repository.ts`, `apps/api/src/modules/analytics/use-cases/get-seller-summary.use-case.ts`, `apps/api/src/modules/analytics/analytics.controller.ts`, `apps/api/src/modules/analytics/analytics.module.ts`, `docs/contracts/web-seller.md`
- **Что сделано:** Добавлен `GET /api/v1/analytics/seller/summary` для SELLER роли. Возвращает `{ views, topProduct, conversionRate }` за последние 30 дней. Top product определяется через `$queryRaw` по jsonb полю `event_payload`. Контракт обновлён.
