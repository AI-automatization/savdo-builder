# Logs — локальные тесты и баги

Формат записи:
```
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

---

## 2026-04-08 [WEB-030] web-buyer 503 — неправильные пути standalone в монорепо

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Next.js standalone с `outputFileTracingRoot: monorepoRoot` сохраняет полный путь монорепо. server.js находится по пути `standalone/apps/web-buyer/server.js`, а не в корне. Dockerfile указывал `CMD node server.js` — файл не найден, контейнер не стартовал → 503.
- **Что сделано:** `apps/web-buyer/Dockerfile` — исправлены CMD, пути static и public. `railway.toml` — исправлен startCommand.

## 2026-04-08 [WEB-031] web-seller — хардкод PORT=3001 блокирует Railway

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `EXPOSE 3001` + `ENV PORT=3001` в Dockerfile. Railway управляет PORT динамически — хардкод блокировал routing.
- **Что сделано:** `apps/web-seller/Dockerfile` — удалены EXPOSE и ENV PORT.

## 2026-04-08 [API-020] GET /storefront/stores возвращает массив вместо {data:[]}

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** TWA-страница (`twa/page.tsx`) ожидает `response.data`, но endpoint возвращал голый массив.
- **Что сделано:** `products.controller.ts` — ответ обёрнут в `{ data: stores }`.

---

## 2026-03-25 [API-001] Railway деплой

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Railway вернул ошибку `config file apps/api/railway.toml does not exist` — файл был создан локально, но не запушен в GitHub.
- **Что сделано:** Запушить `apps/api/railway.toml` и `.github/workflows/ci-backend.yml` в main.

---

## 2026-03-25 [API-005] Prisma + Alpine OpenSSL

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Railway деплой упал на `prisma migrate deploy` с ошибкой `Could not parse schema engine response` и `Prisma failed to detect the libssl/openssl version`. Причина: `node:20-alpine` использует musl libc, OpenSSL не установлен по умолчанию.
- **Что сделано:**
  - `apps/api/Dockerfile`: добавлен `RUN apk add --no-cache openssl`
  - `packages/db/prisma/schema.prisma`: добавлен `binaryTargets = ["native", "linux-musl-openssl-3.0.x"]`
