# Tasks — Полатр

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/mobile-buyer`, `apps/mobile-seller`

---

## 🔴 Критические

- [ ] **[API-001]** render.yaml → Railway конфиг
  - Создать `apps/api/railway.toml` (Dockerfile builder, watchPatterns)
  - Удалить `render.yaml` из корня
  - Файлы: `apps/api/railway.toml`, `render.yaml`
  - Статус: ✅ Сделано, ожидает пуша

---

## 🟡 Важные

- [ ] **[API-002]** CI/CD — GitHub Actions для backend
  - `.github/workflows/ci-backend.yml`
  - Триггер: push/PR в main по путям `apps/api/**`, `packages/**`
  - Шаги: install → prisma generate → tsc → lint → build → test
  - Статус: ✅ Сделано, ожидает пуша

- [ ] **[API-003]** Socket.IO Redis Adapter
  - `@socket.io/redis-adapter` уже в `package.json`
  - Подключить в `apps/api/src/main.ts` (инфраструктура есть, adapter не подключён)
  - Файлы: `apps/api/src/main.ts`

---

## 🟢 Обычные

- [ ] **[API-004]** Seller Analytics Endpoint
  - `GET /api/v1/analytics/seller/summary`
  - Вернуть: `{ views, topProduct, conversionRate }`
  - AnalyticsModule уже готов, нужен только seller-facing эндпоинт
  - Файлы: `apps/api/src/modules/analytics/`
  - Добавить в `docs/contracts/web-seller.md`

---

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo
