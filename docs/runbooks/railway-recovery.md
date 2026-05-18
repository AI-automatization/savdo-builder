# Runbook — восстановление упавшего сервиса на Railway

> DEVOPS-RAILWAY-DEPLOY-RESILIENCE-001. Создан после инцидента
> `DEVOPS-RAILWAY-MULTI-DOWN-2026-05-18` (3 сервиса легли разом).
> Цель — поднять прод за минуты, а не часы.

## Карта: ветка → сервис Railway

| Сервис Railway | Ветка GitHub | Тип | Зависимости |
|----------------|--------------|-----|-------------|
| `savdo-api` | `api` | NestJS (Dockerfile) | Postgres, Redis |
| `savdo-builder_ADMIN` | `admin` | Vite SPA (Dockerfile) | savdo-api |
| `telegram-app` | `tma` | Vite SPA (Dockerfile) | savdo-api |
| `savdo-builder-by` | `web-buyer` | Next.js | savdo-api |
| `savdo-builder-sl` | `web-seller` | Next.js | savdo-api |
| `Postgres`, `Redis` | — | плагины Railway | — |

Деплой триггерится push'ем в соответствующую ветку. `main` → ветки мержатся вручную.

---

## Диагностика — что именно сломалось

Открыть сервис в Railway → вкладка **Deploy Logs** / **Build Logs**.

| Симптом | Причина | → раздел |
|---------|---------|----------|
| `Error: connect ETIMEDOUT` (ioredis) | Redis недоступен | [A](#a-redis-недоступен) |
| `✖ No start command detected` / `railpack` в логах | Railway собирает не через Dockerfile | [B](#b-railpack-вместо-dockerfile) |
| `There is no active deployment` | Деплой снят после серии крашей | [C](#c-нет-активного-деплоя) |
| `No changes to watched files` | Push не затронул `watchPatterns` | [D](#d-no-changes-to-watched-files) |
| Build failed | Ошибка сборки | смотреть Build Logs построчно |

---

## A. Redis недоступен (`ETIMEDOUT`)

1. Открыть сервис **Redis** в проекте → убедиться, что статус `Online`. Если нет — **Restart**.
2. `savdo-api` → **Variables** → проверить `REDIS_URL`. Должен быть reference
   (`${{Redis.REDIS_URL}}`) или internal-хост `redis.railway.internal`, не протухший адрес.
3. После того как Redis `Online` — `savdo-api` → **Redeploy** последнего деплоя.
4. С `API-REDIS-RESILIENCE-001` API больше не крашится из-за Redis на старте —
   поднимается в degraded-режиме. Если всё равно offline — причина не в Redis.

## B. Railpack вместо Dockerfile

Railway проигнорировал `railway.toml` и свалился в авто-детект.

1. Сервис → **Settings → Build**:
   - **Builder** = `Dockerfile`
   - **Dockerfile Path** = `apps/<app>/Dockerfile` (напр. `apps/tma/Dockerfile`)
   - **Root Directory** = пусто (корень репо — Dockerfile монорепный, копирует
     `pnpm-lock.yaml` из корня; Root Directory = `apps/<app>` ломает сборку).
2. Save → **Redeploy**. В Build Logs должно быть `using Dockerfile`, не `railpack`.

## C. Нет активного деплоя

Все деплои `Removed`, ничего не запущено (Railway снял после `restartPolicyMaxRetries`).

1. Сначала устранить корневую причину (раздел A/B) — иначе новый деплой так же упадёт.
2. Сервис → **Deployments** → на последнем зелёном коммите ветки → **⋮ → Redeploy**.
3. Если деплоев в истории нет — кнопка **Deploy** / привязать репозиторий заново
   к нужной ветке (см. карту веток выше).

## D. `No changes to watched files`

Railway пропустил билд: push не затронул пути из `watchPatterns` в `railway.toml`.

- Это не ошибка. Чтобы форсировать — **Redeploy** вручную, либо пустой коммит
  (`git commit --allow-empty`), либо коммит, затрагивающий watched-путь.
- Правка самого `railway.toml` под watchPatterns попадает только со СЛЕДУЮЩЕГО
  деплоя (chicken-and-egg) — первый раз всегда нужен ручной Redeploy.

---

## Чек-лист «всё ли поднялось»

- [ ] `Redis`, `Postgres` — `Online`
- [ ] `savdo-api` — `Active`, в логах `API running...` без `ETIMEDOUT`
- [ ] `savdo-builder_ADMIN` — `Active`, открывается `adminsb.up.railway.app`
- [ ] `telegram-app` — `Active`, билд через Dockerfile
- [ ] web-buyer / web-seller — `Online`
- [ ] `curl https://savdo-api-production.up.railway.app/api/v1/health/live` → 200

## Профилактика

- CI `Deploy Config Guard` (`.github/workflows/deploy-config-check.yml`) падает,
  если `apps/<app>/railway.toml` удалён или потерял `builder = "DOCKERFILE"`.
- `restartPolicyMaxRetries = 10` — Railway не снимает деплой после короткого сбоя.
- `healthcheckPath` API = `/api/v1/health/live` (liveness) — моргание Redis/БД
  не убивает деплой.
