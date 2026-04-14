# Logs — локальные тесты и баги

Формат записи:
```
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

---

## 2026-04-14 [ADM-ENV-001] apps/admin/.env.example — неверное имя переменной

- **Статус:** 🟡 Предупреждение (домен Полата, не правлю)
- **Что случилось:** `apps/admin/.env.example` содержит `NEXT_PUBLIC_API_URL=...`, но admin — это Vite SPA, в коде читается `VITE_API_URL`. Также используется `VITE_BUYER_URL`, которого нет в примере. При чистом деплое из примера — API-запросы валятся.
- **Что сделано:** Не правил (домен Полата). Нужно заменить `NEXT_PUBLIC_API_URL` на `VITE_API_URL` и добавить `VITE_BUYER_URL`.

---

## 2026-04-12 [TMA-010] Бот: "Магазин не найден" при привязке канала

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Продавец у которого есть Seller-запись (создана через web OTP) но нет Store — при попытке привязать канал получал ошибку "⚠️ Магазин не найден". Состояние `awaiting_channel` выставлялось без проверки существования Store.
- **Что сделано:** `telegram-demo.handler.ts` — `handleLinkChannel` теперь проверяет наличие Store. Если магазина нет → запрашивает название и вызывает `handleCreateStoreName` для создания Store. Добавлено состояние `seller_create_store_name` в webhook.

## 2026-04-12 [TMA-011] TMA дашборд крашился из-за несуществующего /seller/stats

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `DashboardPage.tsx` вызывал `GET /seller/stats` — endpoint не существует → 404 → `Promise.all` отклонялся → экран ошибки.
- **Что сделано:** Убран вызов `/seller/stats`. Статистика берётся из `meta.total` существующих endpoints. `Promise.all` заменён на `Promise.allSettled`.

## 2026-04-12 [TMA-012] ADMIN не мог открыть кабинет продавца в TMA

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** `SellerGuard` проверял только `role === 'SELLER'`, ADMIN перенаправлялся на `/buyer`. `HomePage` также не отправлял ADMIN на `/seller`.
- **Что сделано:** `App.tsx` и `HomePage.tsx` — ADMIN добавлен в условие наравне с SELLER.

## 2026-04-12 [TMA-013] JS 404 после деплоя (старый кеш браузера)

- **Статус:** 🔴 Баг → ✅ Исправлено
- **Что случилось:** Telegram webview кешировал `index.html` → после деплоя он ссылался на старые Vite-чанки с другим hash → 404.
- **Что сделано:** `nginx.conf` — для `index.html` добавлены `Cache-Control: no-cache, no-store, must-revalidate`.

## 2026-04-12 [WEB-013] NEXT_PUBLIC_BUYER_URL отсутствовал в .env.example web-seller

- **Статус:** 🟡 Предупреждение → ✅ Исправлено
- **Что случилось:** `dashboard/page.tsx` использует `NEXT_PUBLIC_BUYER_URL`, переменная не была в .env.example → Railway-конфиг без неё, ссылки вели на `savdo.uz`.
- **Что сделано:** Добавлена переменная в `apps/web-seller/.env.example`.

## 2026-04-12 [WEB-014] Локальный тип StorefrontStore в web-buyer устарел

- **Статус:** 🟡 Предупреждение → ✅ Исправлено
- **Что случилось:** `storefront.api.ts` определял локальный `StorefrontStore`. Полат добавил его в `packages/types`, но веб-байер продолжал использовать дубль.
- **Что сделано:** `storefront.api.ts` — удалён локальный тип, импорт из `types`.

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
