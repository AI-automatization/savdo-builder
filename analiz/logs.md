# Logs — локальные тесты и баги

Формат записи:
```
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

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
