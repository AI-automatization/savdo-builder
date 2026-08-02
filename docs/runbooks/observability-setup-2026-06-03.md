# Observability Setup — Sentry + UptimeRobot

> Дата: 03.06.2026. Для Полата. Готовый плейбук на 15 минут активации.
>
> **Контекст:** код уже готов — `apps/api/src/shared/error-reporter.ts`
> (API-SENTRY-001) автоматически подхватит `SENTRY_DSN` env и начнёт слать
> events. Скраббинг PII, beforeSend, release-тег через `RAILWAY_GIT_COMMIT_SHA`,
> graceful flush на SIGTERM — всё уже встроено. Нужно лишь задать env var.
>
> Также есть health endpoints:
> - `GET /api/v1/health` — глубокий (DB ping + Redis ping, 503 если DB down,
>   200 + `degraded:true` если только Redis down)
> - `GET /api/v1/health/live` — лёгкий (только процесс жив, для UptimeRobot/Railway probe)

---

## A. Sentry — 5 минут

### A1. Создать проект

1. Открыть https://sentry.io → Sign in (Google или GitHub удобнее всего).
2. **Create Project** → Platform: **Node.js**, Framework: **NestJS** (если есть)
   или просто Node.js (в нашем коде Express adapter — оба варианта работают).
3. Project name: `savdo-api` (или `maxsavdo-api` под новый бренд).
4. Alert frequency: «**Alert me on every new issue**» (для старта; настроим
   тоньше позже в A4).
5. На последнем шаге получишь DSN вида
   `https://<key>@o<orgId>.ingest.sentry.io/<projectId>` — сохрани, понадобится в A2.

### A2. Добавить env vars в Railway (savdo-api service)

1. Railway dashboard → `savdo-builder` project → сервис `savdo-api` → **Variables**.
2. Добавить:

   | Variable | Value |
   |---|---|
   | `SENTRY_DSN` | `https://<key>@o<orgId>.ingest.sentry.io/<projectId>` |
   | `SENTRY_TRACES_SAMPLE_RATE` | `0.1` (10% performance traces) |
   | `SENTRY_PROFILES_SAMPLE_RATE` | `0.1` (10% CPU profiling) |

   `RAILWAY_GIT_COMMIT_SHA` Railway уже выставляет автоматически — `ErrorReporter`
   берёт первые 7 символов и шлёт в Sentry как `release` тег (см.
   `error-reporter.ts:69`).

3. Save → Railway сделает автоматический redeploy.
4. В Deploy Logs ищи строку:
   ```
   [ErrorReporter] Sentry enabled (env=production, release=<sha7>, traces=0.1, profiles=0.1)
   ```
   Если видишь `SENTRY_DSN not set — using stderr-only reporting` — env var не
   подцепился, проверь правописание.

### A3. Smoke test

1. После redeploy подожди ~30 сек пока pod встанет.
2. Проверь health:
   ```bash
   curl https://savdo-api-production.up.railway.app/api/v1/health
   ```
   Должно быть `{"status":"ok","db":"up","redis":"up"}`.
3. Sentry **не** ловит 404 как event (только breadcrumb) — чтобы проверить
   end-to-end, нужно спровоцировать **5xx или uncaught exception**. Варианты:
   - В Sentry UI → Project → **Issues** → если за прошлые часы был crash в логах
     Railway, он должен подняться (мы зеркалим всё через `captureException`
     в `GlobalExceptionFilter`).
   - Либо вручную из admin-панели вызвать любой endpoint который роняет 500
     (например `/api/v1/admin/dev/throw` если такой есть; иначе — подождать
     первого реального инцидента, free-tier не тарифицирует тест-event-ы).
4. В Sentry UI → **Issues** → должен появиться event с release=`<sha7>`,
   environment=`production`, scrubbed request (без `Authorization`, `cookie`,
   `password`, `code` (OTP), телефоны замаскированы).

### A4. Alerts

1. Sentry → **Alerts** → **Create Alert Rule**.
2. Рекомендуемые правила для savdo-api:
   - **High-volume errors:** «Number of events in an issue is more than `5` in
     `1 hour`» → action Email + (опц.) Slack/Discord webhook.
   - **New issue in production:** «When a new issue is created» + filter
     `environment:production` `level:error` → action Email (рассылать только
     prod, чтобы dev-noise не утомлял).
   - **Performance regression** (если включишь APM позже): «Transaction
     duration p95 > 2s в `/api/v1/checkout`».
3. Action contact: email Полата (+ опц. Telegram-канал команды через webhook).

### A5. Source maps (опционально, +5 минут)

API собирается через `tsc` в Docker — source maps уже есть в build. Чтобы
Sentry резолвил stack traces в TS-исходники:

1. `npm i -D @sentry/cli` в `apps/api`.
2. В `apps/api/Dockerfile` после `npm run build` добавить:
   ```
   ARG SENTRY_AUTH_TOKEN
   ARG SENTRY_ORG
   ARG SENTRY_PROJECT
   RUN if [ -n "$SENTRY_AUTH_TOKEN" ]; then \
         npx sentry-cli sourcemaps inject ./dist && \
         npx sentry-cli sourcemaps upload --release="$RAILWAY_GIT_COMMIT_SHA" ./dist; \
       fi
   ```
3. В Railway добавить build args `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`,
   `SENTRY_PROJECT` (берутся в Sentry → Settings → Auth Tokens, scope
   `project:releases`).

Можно отложить — без source maps stack traces читаются в виде
`dist/file.js:123` (всё равно полезно).

---

## B. UptimeRobot — 5 минут

### B1. Создать аккаунт + мониторы

1. https://uptimerobot.com → Sign up (Free plan: **50 monitors, 5-min interval**).
2. Dashboard → **+ Add New Monitor** для каждого сервиса:

   | Monitor name | Type | URL | Interval |
   |---|---|---|---|
   | `savdo-api prod /live` | HTTP(s) | `https://savdo-api-production.up.railway.app/api/v1/health/live` | 5 min |
   | `savdo-api prod /health` | HTTP(s) | `https://savdo-api-production.up.railway.app/api/v1/health` | 5 min |
   | `admin prod` | HTTP(s) | `https://adminsb.up.railway.app/` | 5 min |
   | `tma prod` | HTTP(s) | `https://telegram-app-production-7e95.up.railway.app/` | 5 min |
   | `web-buyer prod` | HTTP(s) | `https://savdo-builder-by-production.up.railway.app/` | 5 min |
   | `web-seller prod` | HTTP(s) | `https://savdo-builder-sl-production.up.railway.app/` | 5 min |

   **Почему два монитора у API:**
   - `/live` — liveness, всегда 200 если процесс жив. UptimeRobot тревожит =
     pod упал.
   - `/health` — deep check (DB+Redis). Возвращает 503 при DB down. UptimeRobot
     тревожит = DB/connection issue (даже если pod жив).

3. Для каждого монитора → **Advanced settings**:
   - **HTTP Method:** GET
   - **Expected Status Code:** 200 (для `/live`, `/health`, фронтов)
   - **Keyword monitoring (опц.):** для `/health` ввести keyword `"status":"ok"`
     → алерт если ответ = `degraded`. Только в платной версии.
   - **Timeout:** 30 сек

### B2. Alert Contacts

1. Dashboard → **My Settings** → **Alert Contacts** → **Add Alert Contact**:
   - Email Полата (primary) — `martishka178@gmail.com`.
   - Email Азима (secondary, для фронтов) — уточнить адрес.
   - (Опц.) Telegram Bot integration: UptimeRobot шлёт через готовый @uptimerobot-приёмник,
     либо настроить свой webhook в команду-чат.
2. Для каждого монитора → **Edit** → **Alert Contacts To Notify** → выбрать
   нужные контакты + поставить «Notify when **Down**» и «Notify when **Up** again».

### B3. Status Page (бонус, 2 минуты)

1. Dashboard → **Status Pages** → **Add New Status Page**.
2. Name: `Savdo Status`. Custom URL: `savdo-status.uptimerobot.com` (бесплатно).
3. Добавить все 6 мониторов сверху → Save.
4. Ссылку можно отдать sellers/buyers («проверьте статус, если что-то не работает»).

---

## C. Что в коде уже готово (НЕ трогать)

- **`apps/api/src/shared/error-reporter.ts`** — singleton, ловит
  `uncaughtException` + `unhandledRejection`, отдельно `captureException()` API.
- **PII-скраббинг включён двумя слоями:**
  1. `scrubPII()` в context (password/secret/token/apikey/authorization/code/refreshtoken
     → `[REDACTED]`; поля `phone`/`*Phone` → `maskPhone()`).
  2. `beforeSend()` в Sentry — повторно зачищает request.headers (Authorization,
     Cookie, x-telegram-bot-api-secret-token), request.data, query_string, extra.
- **GlobalExceptionFilter** автоматически зеркалит все 5xx в
  `ErrorReporter.captureException`.
- **Graceful shutdown** (`main.ts:265-276`): на SIGTERM/SIGINT — `Sentry.flush(2000)`
  перед `app.close()`. Railway grace period = 30 сек → 2-сек flush впишется.
- **Bootstrap failure capture** (`main.ts:288-297`): даже если NestFactory
  упадёт, ошибка уйдёт в Sentry до `process.exit(1)`.
- **Profiling integration** — `@sentry/profiling-node` загружается через
  `require()` в try/catch: на ARM/Windows билде native binary может не
  собраться, и это **не валит** bootstrap (см. `error-reporter.ts:86-97`).

---

## D. Что добавить ПОСЛЕ Sentry (если бюджет позволит)

| Сервис | Зачем | Цена |
|---|---|---|
| **Better Stack (LogTail)** | Централизованный logs aggregator, search по JSON-логам Railway stderr | $30/mo |
| **Sentry frontend** (apps/admin, web-buyer, web-seller, tma) | Ловить React render-errors, network failures у buyer/seller | в рамках того же Sentry проекта или sub-projects |
| **Grafana Cloud Free** | Метрики p95 latency, error rate, throughput по endpoint | Free до 10k series |
| **Datadog Synthetic** | Более продвинутый чем UptimeRobot (multi-step user flows) | $15/host |

Приоритет: **Sentry frontend** > Better Stack > остальное. Без frontend Sentry
checkout 500 при зелёном /health не словит никто (см. analiz/tasks.md
SMOKE-PLAYWRIGHT part C — пометка «вернуться после первого прод-инцидента»).

---

## E. Daily check routine

После настройки — 3 минуты с утра:

1. **Sentry Dashboard** → Issues за последние 24h → разобраться с топ-3 новых
   issues. Если новых нет — закрыть просмотренные через «Resolve in next
   release».
2. **UptimeRobot Dashboard** → uptime % за 7 дней. Цель: ≥ 99.5% для api,
   ≥ 99% для фронтов. Падения < 5 мин — нормально (Railway redeploy), > 15 мин —
   разбирать root cause (`docs/runbooks/railway-recovery.md`).
3. **Railway Dashboard** → savdo-api → **Logs** → grep по `[ErrorReporter]` или
   `level:error` за ночь. Должно совпадать с Sentry Issues; расхождение =
   bug в зеркалировании.

---

## F. Связанные runbooks

- `docs/runbooks/railway-recovery.md` — что делать когда Railway сервис лёг.
- `docs/runbooks/postgres-backup-restore.md` — восстановление БД (если /health
  даёт 503 db:down).
- `apps/api/CLAUDE.md` §API-SENTRY-001 — внутренняя архитектура `ErrorReporter`.
- `.env.example:96-105` — комментированный шаблон Sentry env vars.
- `analiz/tasks.md` INFRA-UPTIME-ALERTS-001 + SENTRY-DSN-001 — task tracker
  закроются этим плейбуком.
