# Launch Readiness Audit — savdo-builder

**Дата:** 2026-05-20
**Auditor:** Senior Platform Engineer / Release Manager (Claude, read-only review)
**Базовые источники:** `analiz/{tasks,done,logs}.md`, `docs/V1.1/*`, `docs/adr/*`,
`docs/runbooks/railway-recovery.md`, исходники `apps/api`, `packages/db`,
`apps/web-buyer`, `apps/admin`, конфиги Railway / Docker / CI.

> Аудит подготовлен перед публичным запуском MVP (B2C buyer-витрина + B2B
> seller-CRM + admin-панель + TMA в Telegram). Платежи Click/Payme заморожены
> до открытия бизнес-счёта (ADR-003) — модель cash-on-delivery + manual transfer.

---

## TL;DR

| Метрика | Значение |
|---------|----------|
| **Общий score** | **6.6 / 10** |
| **Verdict** | **Conditional Go** — 5 launch-блокеров + ~12 high-priority должны быть закрыты до публичного объявления |
| **ETA до публичного запуска** | **12–18 рабочих дней** (один backend + один frontend, как есть) |
| **Минимальный «soft-launch» (closed beta, до 50 продавцов)** | **5–7 рабочих дней** после закрытия топ-5 блокеров |

**Топ-5 launch-блокеров (по убыванию):**

1. **PROD-API verification** — после инцидента `DEVOPS-RAILWAY-MULTI-DOWN-2026-05-18`
   `INFRA-API-PROD-DOWN-001` помечен «восстановлено», но `VERIFY-CHECKOUT-CONFIRM-500-001`
   до сих пор не подтверждён фронтом → реальная работоспособность корзинного
   checkout на проде не верифицирована end-to-end.
2. **Backups / Restore drill** — `docs/V1.1/08_operations_model.md` декларирует
   daily PG dumps + monthly restore drill; ни автоматических job'ов, ни runbook
   восстановления БД, ни последнего успешного restore-теста в репо не зафиксировано.
3. **Frontend smoke / e2e отсутствуют** — `API-FRONTEND-TESTS-001` открыт.
   web-buyer / web-seller / TMA: **0** тестов (admin: 4 smoke). Любая регрессия
   ловится только на проде.
4. **Реквизиты юр.лица в `/offer` — placeholder.** Публичная оферта обязана
   содержать ИНН / ОКПО / юр.адрес оператора платформы (требование УЗ
   законодательства о публичных офертах) — сейчас «будут размещены после
   регистрационных процедур». Без этого запуск под прод-юзеров юридически рискован.
5. **Алертинг = 0.** Нет внешнего uptime-ping'а (Betterstack/UptimeRobot/
   Railway Notifications). Инцидент 18.05 заметили постфактум от Азима; в норме
   при downtime команда узнаёт от клиентов.

---

## Контекст и недавние инциденты

- **DEVOPS-RAILWAY-MULTI-DOWN-2026-05-18 🔴** — все 3 Railway-сервиса (savdo-api,
  telegram-app, savdo-builder_ADMIN) одновременно offline. Root cause API:
  `redis.service.ts` без `retryStrategy` → `ETIMEDOUT` спам → bootstrap-crash →
  `restartPolicyMaxRetries=3` исчерпан → деплой Removed. Hardening (`909de8b`)
  применён: ioredis resilience + BullMQ resilient connection + `restartPolicyMaxRetries`
  3→10 + healthcheck `/api/v1/health/live` (liveness без БД/Redis) +
  `docs/runbooks/railway-recovery.md` + CI `deploy-config-check.yml`.
- **API-CHECKOUT-CONFIRM-500-001** — 14.05 buyer не мог оформить заказ; defensive
  fix (`aec25e5`) + ErrorReporter (`faaa36c`) задеплоены, **но end-to-end
  проверка фронтом ещё не сделана** (`VERIFY-CHECKOUT-CONFIRM-500-001` в task-list).
- **SEC-AUDIT 16.05.2026** — 5 находок (1🔴+4🟠), 4 из 5 закрыты;
  `SEC-AUDIT-04` (глобальный default-deny JwtAuthGuard) — оставлено как
  hardening, активной дыры нет.
- **WEB-QA-BUGFIX-2026-05-15** — ~20 🔴 + ~30 🟡 в web-buyer/web-seller, все
  🔴 закрыты, 🟢-часть закрыта 19.05 (`WEB-QA-GREEN-2026-05-15`).

---

# Аудит по 14 измерениям

## 1. Security — Score **8 / 10**

### Сделано
- JWT: AccessToken 15m + RefreshToken 30d, session-based revocation
  (`jwt.strategy.ts validate()` делает DB-lookup сессии — Logout убивает токен).
  Безусловная проверка sessionId (`SEC-AUDIT-07` закрыт).
- MFA обязателен для админов в проде (`SEC-AUDIT-01`, `SEC-ADMIN-ACCESS-MODEL`
  стадии A→D активированы 16.05). otplib v13.4.0, mandatory MFA через mfaPending JWT.
- RBAC двухуровневый: `Roles('ADMIN'|'SELLER'|'BUYER')` + AdminPermissionGuard
  с матрицей `admin-permissions.ts` (super_admin / admin / moderator / support
  / finance / read_only). 23 destructive admin endpoints под `@AdminPermission`.
- CORS allow-list 4 прод-домена + ALLOWED_ORIGINS env, паттерны `*.savdo.uz`,
  `telegram.org`. Wildcard `*.up.railway.app` убран (`SEC-AUDIT-02`, `8ead898`).
- Rate-limiting: глобальный 120 req/min, локальные `@Throttle` на cart, wishlist,
  orders, media/upload, seller/products. `trust proxy: 1` (`SEC-AUDIT-03`).
- Stock race / oversell — atomic UPDATE через `$queryRaw WHERE qty>=` (`API-STOCK-RACE-OVERSELL-001`).
- Idempotency-Key (Stripe-style, SHA256+Redis 24h, fail-closed при Redis-down).
- Helmet + CSP в next.config web-buyer/web-seller (script-src 'self'+unsafe,
  frame-ancestors 'none', form-action 'self', HSTS).
- PII masking в логах (`shared/pii.ts`, +тесты).
- OTP brute-force per-phone 5/15мин; Telegram-only OTP (Eskiz / SMS запрещены).
- Bull Board защищён admin JWT + HttpOnly cookie.
- Telegram HTML escape (`telegram-html.ts`) на 12+ user-input точках.
- `SQL injection audit` 06.05 — 0 unsafe queries (только tagged $queryRaw).
- WebSocket auth: SELLER без storeId не может join'нуться в чужие seller-room
  (DB lookup) — `API-WS-AUDIT-001`.

### Что отсутствует / гэпы
- `SEC-AUDIT-04` — глобальный default-deny `JwtAuthGuard` не включён (28
  контроллеров проверены вручную, активной дыры нет, но любой новый endpoint
  без `@UseGuards` будет публичным — нет fail-safe).
- Нет secret-scan history (есть workflow `.github/workflows/secret-scan.yml`,
  но baseline / результаты не зафиксированы в репо). Рекомендуется trufflehog
  / gitleaks с baseline.
- Нет CSP report-uri (нарушения CSP не собираются).
- No web-app-firewall layer (Railway не предоставляет — придётся Cloudflare
  proxy + WAF rules перед публичным запуском, если ожидается атака).

### Blockers vs. nice-to-have
- **Nice-to-have:** global default-deny guard, CSP reporting.
- **Не блокер** — текущая поверхность защищена явно, недавний OWASP-аудит
  закрыт.

### Следующие шаги
- `apps/api/src/app.module.ts` — добавить `APP_GUARD: JwtAuthGuard` + `@Public()`
  декоратор для storefront/health/webhook. Отложено в `SEC-AUDIT-04`.
- `.github/workflows/secret-scan.yml` — убедиться что workflow реально гоняется
  на PR (проверить runs за неделю).

---

## 2. Data integrity — Score **7 / 10**

### Сделано
- 9 ключевых инвариантов в `docs/V1.1/01_domain_invariants.md` (INV-S01..S05,
  P01..P05, C01..C04, O01..O04, CH01..CH04, A01..A02) — каталог + ссылки в коде.
- Prisma schema стабильна: 29 migrations с 2026-04 (audit + db_audit_indexes
  06.05, search_pg_trgm_indexes 12.05, cart_abandonment 12.05, wishlist_notify
  13.05, store_verification_and_rating 12.05, admin_user_access_flags 16.05).
- DB-level constraints: `stockQuantity >= 0` CHECK, `UNIQUE(product_id, sku)`,
  `stores.seller_id UNIQUE` (INV-S01), `order_status_history` append-only.
- Audit log по INV-A01: admin action всегда пишет `audit_logs` (approve/reject/
  suspend/block/refund/impersonate).
- Order items snapshot (INV-C04): `product_title_snapshot`, `unit_price_snapshot`,
  `primary_image_url_snapshot`, `variant_label_snapshot` — immutable.
- Stock decrement atomic on order create / release on cancel (INV-O04,
  `API-STOCK-RACE-OVERSELL-001`, `API-INV-O04-STOCK-RELEASE-001`).
- DB-audit 06.05 нашёл и закрыл schema drift (MFA fields + OrderRefund были в
  DB но не в schema.prisma).
- `feedback_prod_data_safety.md` правила: ADD nullable OK, DROP/RENAME запрещены,
  Expand→Migrate→Contract для опасных.

### Что отсутствует
- **Backup policy не реализована.** Декларирована (`08_operations_model.md`),
  но в репо нет cron-job pg_dump, нет restore-runbook, нет последнего drill.
  Railway Postgres делает managed snapshots, но retention / RPO / RTO
  не зафиксированы команде. **Это блокер.**
- Нет `prisma migrate diff --from-deployed --to-schema` в CI (schema drift
  может незаметно вернуться).
- Reviews aggregate (`refreshStoreAggregate`) — есть, но нет periodic-job который
  пересчитывает avgRating для всех stores (только on-write).
- Cart abandonment / wishlist notify cron'ы есть, но нет dashboard видимости
  «сколько nudge'ей реально ушло» (только в Railway-логи).

### Blockers vs. nice-to-have
- **🔴 Blocker:** backup policy + restore drill (см. отдельный пункт в Risk register).
- Nice-to-have: schema-drift CI guard.

### Следующие шаги
- Создать `docs/runbooks/postgres-backup-restore.md` (как Railway-snapshot
  работает, retention, restore-процедура, smoke-prov dump).
- `.github/workflows/db-drift-check.yml` — `prisma migrate diff` против
  deployed schema на каждый PR в `packages/db/**`.
- Один реальный restore-drill в Railway staging до запуска.

---

## 3. Infra resilience — Score **7 / 10**

### Сделано (после инцидента 18.05)
- `apps/api/railway.toml` — `restartPolicyMaxRetries=10` (было 3), `healthcheckPath=/api/v1/health/live`
  (liveness без БД/Redis), `healthcheckTimeout=300`.
- `redis.service.ts` — `retryStrategy` (200ms→10s cap), `connectTimeout: 10s`,
  `maxRetriesPerRequest: 2`, `enableOfflineQueue: false`, `enableReadyCheck: true`.
- `queues.module.ts` — те же resilient опции для BullMQ.
- `main.ts` — `connectToRedis()` в try/catch, API стартует single-instance
  без Redis-adapter если он недоступен.
- `socket/redis-io.adapter.ts` — node-redis с `connectTimeout` + `reconnectStrategy`.
- `docs/runbooks/railway-recovery.md` создан (диагностика A/B/C/D, чек-лист
  восстановления, ветки → сервисы карта).
- CI `.github/workflows/deploy-config-check.yml` — падает если `apps/<app>/railway.toml`
  отсутствует или потерял `builder=DOCKERFILE`.
- 5 Dockerfile (api, admin, tma, web-buyer, web-seller) — multi-stage.

### Что отсутствует
- **Алертинг = 0.** Railway Notifications / Betterstack uptime check /
  внешний healthcheck-пинг не подключены. Падение деплоя замечается реактивно.
- **TMA Root Directory не зафиксировано в Railway** — `DEVOPS-RAILWAY-DEPLOY-RESILIENCE-001`
  п.4 открыт. Сейчас на ветке `tma` есть И корневой `railway.toml`, И
  `apps/tma/railway.toml` (дубль). Любой неаккуратный merge снова сломает деплой.
- **`watchPatterns` несогласован с Dockerfile** (`apps/tma/railway.toml` watch'ит
  `packages/types/**` / `packages/ui/**`, но TMA от них не зависит) — лишние
  пересборки. п.6 open.
- Нет load-test'ов / capacity planning. Сколько RPS выдержит savdo-api на текущем
  Railway-тарифе — неизвестно.
- Нет blue-green / canary deploy: каждый merge в branch → instant prod (Railway
  rolling-deploy, но без feature-flag fallback).
- CODEOWNERS не настроен на `apps/*/railway.toml` (п.5 hardening — нужен GitHub-handle
  Полата).

### Blockers vs. nice-to-have
- **🟠 Должно быть до запуска:** базовый uptime-ping (UptimeRobot бесплатный
  пинг каждые 5 мин на `/api/v1/health/live` + Telegram-alert при downtime).
- **Не блокер:** TMA Root Directory fix (один клик в Railway UI, но желательно
  до объявления запуска).

### Следующие шаги
- UptimeRobot.com → 5 чеков (savdo-api / web-buyer / web-seller / admin / TMA),
  алерт в Telegram-чат команды. 30 минут работы, бесплатно.
- Railway dashboard → `telegram-app` → Settings → Root Directory = `apps/tma`
  (п.4 DEVOPS-RAILWAY-DEPLOY-RESILIENCE-001).

---

## 4. Observability — Score **6 / 10**

### Сделано
- `API-PINO-LOGGING-001` — `StructuredLogger` (JSON stdout в production, цветной
  ConsoleLogger в dev), `LOG_LEVEL` env. Подключено в main.ts через
  `NestFactory.create({ logger: ... })`.
- `API-SENTRY-001` — `ErrorReporter` lightweight (без `@sentry/node`). Auto-capture
  `uncaughtException` + `unhandledRejection`, manual `captureException(err, ctx)`.
  PII-scrub (password/secret/token/authorization → REDACTED). Tags: release =
  `RAILWAY_GIT_COMMIT_SHA[:7]`, environment = NODE_ENV. Включён в `GlobalExceptionFilter`
  для 5xx.
- `/api/v1/health` (DB+Redis ping, degraded если Redis down) + `/api/v1/health/live`
  (liveness без зависимостей).
- Audit log в БД для всех admin-действий.
- Bull Board UI на `/api/v1/admin/queues` (admin JWT) — видимость BullMQ
  состояний (telegram-notifications, in-app-notifications, otp).

### Что отсутствует
- **Real Sentry / error aggregator не подключён.** ErrorReporter пишет в stderr,
  агрегация → Railway log search (медленно, без group-by trace, без алертов на
  spike).
- **Метрики (counters/histograms) отсутствуют.** Нет Prometheus / OpenTelemetry,
  нет dashboard'а с p50/p95 latency, RPS, error-rate, queue lag.
- **Tracing отсутствует** — нет correlation-id propagation между API ↔ queue ↔ TMA.
  Дебаг чужого запроса = grep по логам.
- **Структурированные business-events** (order.created, seller.approved) пишутся
  в `analytics_events` в БД, но read-side нет (`SELLER_INSIGHTS_ENABLED=false`).
- В аудите 14.05 (`WEB-AUDIT-SYNC-IDEOLOGY-001`) явно отмечена analytics-пробел:
  `storefront_viewed`, `product_viewed`, `add_to_cart`, `checkout_started`,
  `order_created` — обязательны по `07_seller_onboarding_funnel.md`, фактический
  fire-rate не подтверждён.

### Blockers vs. nice-to-have
- **🟠 Должно быть до запуска:** хотя бы external uptime + Sentry free-tier
  для backend (5 минут setup, существенно ускоряет debug в проде).
- Метрики/tracing — postMVP.

### Следующие шаги
- `apps/api/src/shared/error-reporter.ts` — добавить опциональный `@sentry/node`
  под env-flag `SENTRY_DSN`. Reporter уже API-совместим (комментарий внутри файла).
- Конфигурация `SENTRY_DSN` в Railway Variables для api / admin / web-buyer /
  web-seller / tma.

---

## 5. Performance — Score **7.5 / 10**

### Сделано
- `pg_trgm` GIN-индексы на products.title/description + stores.name/slug/description
  (`20260512170000_search_pg_trgm_indexes`) — ILIKE из `searchPublic` 100-1000×
  быстрее.
- Composite indexes (`20260504120000_composite_indexes_perf`) +
  `db_audit_indexes` (`media_files.bucket`, `chat_threads.status`) +
  `cart_abandonment_tracking` composite, `wishlist notifiedAt`.
- N+1 закрыто в hot paths: checkout (`API-N1-CHECKOUT-001`, `findManyByIds`
  Map-pattern, 2N→2 IN-SELECT), products feed уже использует include.
- TMA fetch-слой: AbortController + apiSWR + prefetch (`reference_perf_patterns.md`).
- Web-buyer / web-seller — Next.js 16 standalone output, `transpilePackages`,
  `next/image` с remotePatterns.
- Idempotency cache (Redis 24h) — снижает retry-storms.
- Cart bulk-merge (`POST /cart/bulk-merge`) — batch fetch без N+1, единый
  endpoint для TMA→backend sync.

### Что отсутствует
- **Bundle-size budgets не зафиксированы.** Нет CI-проверки что web-buyer LCP < 2.5s
  на 3G (декларировано в `apps/web-buyer/CLAUDE.md`).
- **Нет load-tests** — неизвестен реальный потолок API. Один pod, Railway
  shared resources.
- Cache-Control headers для storefront feeds (storefront/featured, categories/tree)
  — не проверены; SSR Next.js может кэшировать, но API нет.
- Tanstack Query staleTime / cacheTime defaults — не аудированы.

### Blockers vs. nice-to-have
- Nice-to-have. Текущая база — норм для первых 100 продавцов.

### Следующие шаги
- Запустить `k6 / artillery` базовый сценарий (50 RPS на storefront + 5 RPS на
  checkout) перед запуском — убедиться что не падает.
- `apps/web-buyer/next.config.ts` — добавить `Cache-Control: public, s-maxage=60`
  для storefront API routes.

---

## 6. Tests — Score **5 / 10**

### Сделано
- **apps/api:** 58 `.spec.ts` файлов — JEST unit-тесты на use-cases (checkout
  61/61, cart 57/57, wishlist 17/17, idempotency, отдельные tests на security
  cases). E2E: `apps/api/test/new-endpoints.e2e-spec.ts`.
- **apps/admin:** 4 smoke тестa (Vitest + Testing Library): dashboard-layout,
  i18n, login-page, page-header.
- CI `.github/workflows/ci-backend.yml` — typecheck + lint + build + test на
  каждый PR (Postgres + Redis services).

### Что отсутствует
- **apps/web-buyer:** 0 тестов.
- **apps/web-seller:** 0 тестов.
- **apps/tma:** 0 тестов.
- **0 e2e/integration smoke** для критических user-flows (signup → store →
  product → cart → checkout → order). E2E API-тесты есть для нескольких новых
  endpoints, но нет Playwright/Cypress.
- Frontend regression ловится только глазами на Railway.
- `API-FRONTEND-TESTS-001` — открытый ticket «хотя бы smoke».

### Blockers vs. nice-to-have
- **🟠 Должно быть:** Playwright smoke на critical-path: открыть `/`, открыть
  `/[slug]`, добавить в корзину, нажать `/checkout` (без OTP-confirm). 3-4 теста
  закрывают 80% регрессии.

### Следующие шаги
- `apps/web-buyer/playwright/smoke.spec.ts` — 3 теста (home / store / cart).
- Cron в CI: запуск smoke против Railway prod URL раз в час.

---

## 7. Dependency hygiene — Score **6 / 10**

### Сделано
- pnpm overrides в корневом `package.json` — патчат критические транзитивные
  CVE: `path-to-regexp >=0.1.13`, `multer >=2.1.1`, `axios >=1.15.0`,
  `vite >=6.4.2`, `postcss >=8.5.10`, `follow-redirects >=1.16.0`, `lodash >=4.18.0`,
  `handlebars >=4.7.9`, `picomatch >=2.3.2`, `fast-xml-builder`, `fast-xml-parser`.
- Stack современный: NestJS 10, Next.js 16, React 19.2.4, Prisma 5, Node 20+,
  pnpm 9, TypeScript 5.4+.
- `otplib v12 → v13` upgrade сделан 08.05 (`API-OTPLIB-V13-UPGRADE-001`).
- Secret-scan workflow в CI.

### Что отсутствует
- **`pnpm audit` не запускается в CI.** В корневом package.json overrides
  списком — это патч, а не контроль. Регулярного скана нет.
- `npm audit` / Dependabot не настроены — нет автоматических PR на обновления.
- `dependency-auditor` skill доступен, но в последний раз не запускался —
  baseline уязвимостей не зафиксирован.
- Нет SBOM / lock-file integrity check вне CI.

### Blockers vs. nice-to-have
- Nice-to-have. Стек свежий, явных CVE не известно.

### Следующие шаги
- `.github/workflows/dependency-audit.yml` — `pnpm audit --prod --json` weekly cron.
- GitHub Dependabot для PR-bump'ов раз в неделю.

---

## 8. Accessibility (a11y) — Score **6.5 / 10**

### Сделано
- `TMA-DESIGN-FG-TOKENS-001` — все ~470 точек buyer/seller TMA на `--tg-text-*` /
  `--tg-surface*` токенах, light theme работает.
- `TMA-DESIGN-HIT-AREA-001` — qty buttons 40×40 px (>= 44 при text-base).
- `TMA-A11Y-ROLE-TABINDEX-001` — `clickableA11y(handler)` helper применён к
  ChatPage thread rows, ProductCard, WishlistPage, ProductPage gallery.
- `ADMIN-A11Y-MODAL-001` — DashboardLayout `<aside aria-label>` + `<nav aria-label>` +
  `<main id="main">`, theme-toggle `aria-pressed`, all modal на DialogShell
  (role=dialog, aria-modal, focus-trap, Esc close).
- `ADMIN-A11Y-TABS-OTP-001` — `tabs.tsx` primitive с roving-tabindex, OTP
  `<fieldset>+<legend>` + `inputMode=numeric` + `autoComplete=one-time-code`.
- `DESIGN-A11Y-ARIA-LABELS-001` — aria-label/aria-current/aria-hidden на icon
  buttons во всех 4 апах.
- ConfirmModal в TMA + web-* (ESC/Enter/danger flag, focus-trap).

### Что отсутствует
- **WCAG AA contrast audit не сделан** для всех страниц web-buyer/web-seller —
  только spot fixes (light-theme contrast killers закрыты 08.05).
- Нет automated Axe / Lighthouse a11y CI-job.
- Keyboard nav не покрыт полностью — некоторые product gallery / image-uploader
  компоненты могут быть mouse-only.
- Screen reader testing не проводилось.
- `lang="ru"` стоит, но `<html lang>` не переключается при выборе UZ-локали в
  web-buyer (на TMA — переключается, проверено).

### Blockers vs. nice-to-have
- Nice-to-have для MVP B2C-стартапа в УЗ. Не блокер.

### Следующие шаги
- `/a11y-audit` skill пройти по 5 ключевым страницам каждой апы.
- Lighthouse CI на Railway preview deployments.

---

## 9. Internationalization — Score **8 / 10**

### Сделано
- TMA: zero-deps React Context (`apps/tma/src/lib/i18n/{ru,uz}.ts`),
  auto-detect via `tg.initDataUnsafe.user.language_code`, переключатель в Settings,
  `<html lang>` обновляется. Все 10 buyer + 5 seller TMA-страниц.
- web-buyer: i18n-инфра + переключатель RU/UZ в `/profile`, 5 волн извлечения
  строк, 508 ключей ru/uz (HEAD `aac61e8` web-buyer).
- web-seller: i18n-инфра + переключатель RU/UZ в `/settings`, 3 волны,
  533 ключа ru/uz (HEAD `eb31728` web-seller).
- admin: i18n-инфра (DashboardLayout + LoginPage), `666b88b`.
- API Telegram notifications: locale = User.languageCode резолвится для всех
  producer use-cases (`0e18129`).
- Skill `uzbek-translator` — `.claude/skills/uzbek-translator/SKILL.md` (алфавит,
  e-commerce глоссарий 60+ терминов).
- Машинная вычитка узбекских переводов (Claude) — opечатки правлены, ʻ (U+02BB)
  vs ʼ (U+02BC) разведены, формальный legal-tone в /offer и /refund OK.

### Что отсутствует
- **24 admin pages внутри** не переведены (инкрементально, по мере касания).
- Ручная вычитка узбекских переводов Азимом (носителем) — `WEB-UZ-TRANSLATION-REVIEW-001`
  открыт, 3 пункта (терминология, кросс-app PENDING/тема, ручная проверка
  переключателя на Railway).
- `<html lang>` web-buyer/web-seller не переключается при смене локали (только
  TMA умеет).
- Нет fallback strategy для отсутствующих ключей (в TMA — fallback на ru).

### Blockers vs. nice-to-have
- Nice-to-have: native speaker review.

### Следующие шаги
- 1 час Азим — прогнать узбекский buyer-flow + seller-flow на staging URL.

---

## 10. Legal / Compliance — Score **5 / 10**

### Сделано
- 4 публичные страницы: `/terms`, `/privacy`, `/offer`, `/refund` (web-buyer
  `apps/web-buyer/src/app/{terms,privacy,offer,refund}/page.tsx`).
- Тексты на RU + UZ (Wave 4 i18n помечена `// REVIEW`).
- LegalPage компонент shared, footer checkout линкует на /offer и /privacy.
- `lang=ru`, schema.org/Organization JSON-LD, robots.txt, sitemap.xml,
  manifest.ts.
- Refund flow в /refund: 14 дней, ст. 2 лет гарантия, контакт `support@savdo.uz`.
- Privacy упоминает Telegram OTP, нет SMS/Eskiz.

### Что отсутствует
- **🔴 Реквизиты юр.лица в /offer — placeholder.** Цитата с line 73:
  «Реквизиты юридического лица, оператора платформы Savdo, будут размещены
  после завершения регистрационных процедур». В УЗ публичная оферта без
  ИНН/ОКЭД/юр.адреса оператора имеет сомнительный статус договора.
  **Это блокер запуска под прод.**
- `support@savdo.uz` и `legal@savdo.uz` — почтовые ящики не подтверждены
  (не видно DNS/Mailgun-конфига в репо).
- Нет cookie banner / GDPR-style consent (для УЗ необязательно, но Telegram WebApp
  на EU IP может попасть под GDPR territorial scope).
- Закон Республики Узбекистан № ЗРУ-547 «О персональных данных» — есть в /privacy
  декларативно, но процедуры удаления данных (`/profile` → «удалить аккаунт»)
  в коде не реализованы.

### Blockers vs. nice-to-have
- **🔴 Blocker:** заполнить реквизиты в /offer до публичного запуска.
- **🟠 Должно быть:** работающие support@ и legal@ почтовые ящики.

### Следующие шаги
- После регистрации ИП/ООО — заменить placeholder в `apps/web-buyer/src/app/offer/page.tsx:71-75`.
- Настроить email-forwarding на team-Telegram (savdo.uz MX → Cloudflare Email
  Routing → ...).

---

## 11. Marketing / SEO — Score **7 / 10**

### Сделано
- `MARKETING-SEO-INFRA-001` ✅ 11.05.2026:
  - `<html lang>` = ru.
  - `sitemap.ts` (home + 4 legal).
  - `robots.ts` (allow / disallow privates).
  - `manifest.ts` (Savdo PWA).
  - JSON-LD Organization sitewide.
  - JSON-LD Product schema на product layout (UZS pricing, schema.org/Offer).
- `MARKETING-HOMEPAGE-DISCOVERY-001` ✅ 13.05 — discovery page (HomeHero,
  chips, top stores, featured, recent, quick links).
- `WEB-BUYER-CATALOG-001` ✅ — `/stores`, `/products` каталоги.
- OG/Twitter meta tags в `layout.tsx`.
- `WEB-SECURITY-HEADERS-001` — глобальные security headers (включая HSTS).
- `project_lead_gen_channels.md` — план лидгена 100 каналов под UZ.

### Что отсутствует
- Sitemap не включает product/store страницы — только статика. Динамический
  sitemap по published stores отсутствует.
- Нет 404 / 500 кастомных страниц с retention CTA.
- Google Search Console / Yandex Webmaster verification не подтверждено в репо.
- Lighthouse SEO score не зафиксирован.
- `metadataBase` — `process.env.NEXT_PUBLIC_BUYER_URL || 'https://savdo.uz'`.
  Если `savdo.uz` не куплен — production URL по факту Railway-домен, и все
  canonical-URL неверные.

### Blockers vs. nice-to-have
- **🟠 Должно быть до запуска:** домен `savdo.uz` куплен и привязан к Railway,
  `NEXT_PUBLIC_BUYER_URL` корректен.

### Следующие шаги
- `apps/web-buyer/src/app/sitemap.ts` — расширить: динамически добавить
  опубликованные stores (`GET /storefront/stores`) и их продукты.
- Custom 404 page (`apps/web-buyer/src/app/not-found.tsx`).

---

## 12. Payments / Monetization — Score **5 / 10**

### Сделано
- **ADR-003** — осознанное решение: онлайн-платежи откладываются. Cash on
  Delivery + manual transfer.
- `PAYMENT_ONLINE_ENABLED=false` (feature flag).
- web-buyer checkout: `card` и `online` payment-method `disabled: true` +
  `badge: "Скоро"` (`WEB-BUYER-CARD-PAYMENT-DISABLE-001` 14.05).
- `API-CHECKOUT-PAYMENT-METHOD-001` ✅ 15.05 — `PaymentMethod = 'cash'|'card'|'online'`
  в request-types, `resolvePaymentMethod()` маппит на Prisma-enum, `degrade COD`
  если `PAYMENT_ONLINE_ENABLED=false`.
- `MARKETING-MANUAL-SELLER-ACTIVATION-001` ✅ — admin может «активировать»
  продавца на рынке без подписки (`/admin/users/:id/activate-seller-on-market`).
- Webhook ручки для Payme/Click готовы по схеме (PAY-002/PAY-003), но
  заморожены до бизнес-счёта.

### Что отсутствует
- **MARKETING-PAYMENT-CLICK-PAYME-001 🔴 OPEN** — реальная интеграция Click /
  Payme. Цитата tasks.md: «75% UZ e-com через Click/Payme. Cash-only = провал
  conversion.»
- Refund flow есть в admin, но без реальных платёжных webhook'ов.
- Monetization seller-side (subscription) — заморожена (PAY-001..005).

### Blockers vs. nice-to-have
- **Не блокер для технического запуска**, но **🟠 серьёзный риск для GMV**.
  Решение бизнес-уровня (зависит от ИП/ООО регистрации).

### Следующие шаги
- Открыть бизнес-счёт → подключить Click тестовый кабинет → активировать
  `PAYMENT_ONLINE_ENABLED=true`. Эта работа уже шкафлена в PAY-002, PAY-003,
  PAY-004 и не нужна для soft-launch.

---

## 13. Support / Customer service — Score **5.5 / 10**

### Сделано
- Buyer ↔ Seller chat (real-time, Socket.IO, edit/delete по ADR-007).
- Telegram bot @savdo_builderBOT — auth, deep-links, notifications.
- `analytics-events` + `audit_logs` — admin может проследить заказ.
- Cart abandonment nudge (после 4h) + wishlist price-drop / back-in-stock (cron'ы).
- `support@savdo.uz` упоминается в /refund.
- `8 operations_model.md` SLA: P1 30мин, P2 2ч, P3 24ч.
- Admin импеrsonation (`/admin/auth/impersonate/:userId`) — support может
  «зайти» как buyer/seller для дебага.

### Что отсутствует
- **Канал поддержки клиентов не подключён** — нет TG-чата поддержки (`@savdo_support`?),
  нет FAQ-страницы на web-buyer.
- `support@savdo.uz` mailbox не подтверждён.
- В TMA `Settings` нет «Связаться с поддержкой» CTA.
- В web-buyer `/profile` нет блока поддержки.
- Help-center / FAQ полностью отсутствует (страница `/help`).
- SLA-таймеры в admin для moderation queue есть, но для support-кейсов — нет
  (форма жалоб ещё не реализована, см. `08_operations_model.md`).

### Blockers vs. nice-to-have
- **🟠 Должно быть до запуска:** один TG-чат поддержки + ссылка на него в
  buyer footer / TMA settings / web-seller settings.

### Следующие шаги
- Создать `@savdo_support` Telegram-чат (manned by Полат/Азим первые недели).
- Добавить ссылку в footer web-buyer, web-seller, admin login + TMA settings.
- `apps/web-buyer/src/app/help/page.tsx` — статический FAQ из 8-10 вопросов
  (как сделать заказ, как стать продавцом, что делать если не пришёл товар).

---

## 14. Onboarding UX — Score **7 / 10**

### Сделано
- `WEB-SELLER-ONBOARDING-INTERCEPT-001` ✅ 13.05 — `/become-seller` explainer +
  onboarding 4→3 шага (-Step3 товар) + dashboard empty-state «Добавьте товар» +
  auth guards в seller-хуках (401-spam fix).
- `MARKETING-HOMEPAGE-DISCOVERY-001` ✅ — homepage discovery (chips, top stores,
  featured, recent) вместо slug-формы.
- `TMA-BECOME-SELLER-CTA-001` ✅ — deep-link `?start=become_seller` → bot
  парсит startParam → start seller registration.
- `WEB-SELLER-PRODUCT-PARITY-001` ✅ — multi-photo + attributes + filters +
  variants matrix + stock editor в web-seller (паритет с TMA).
- `TMA-CHECKOUT-SUCCESS-PAGE-001` ✅ — ✓ icon + orderNumber + total + 2 CTA.
- `TMA-PHONE-MASK-001` ✅ — `+998 XX XXX XX XX` маска.
- `TMA-ADDRESS-AUTOCOMPLETE-001` ✅ — Yandex Suggest API, debounce 300ms.
- Empty-states покрыты в большинстве listing страниц (orders, wishlist,
  notifications, chats).
- Error UI в большинстве страниц (`WB-B05/B06/B11/B12/B13` закрыты Волной 2).

### Что отсутствует
- **Buyer first-experience** не fancy: нет «гостевой просмотр → пуш OTP при
  checkout». Гостевая корзина есть (`session-token`), но юзер не понимает
  когда ему попросят OTP.
- **Seller onboarding success rate** не измерен (нет funnel-metrics в
  Sentry/PostHog).
- В web-buyer нет туториала «как заказать первый раз» (Telegram'а ещё не
  знают новые посетители из VK/Instagram).
- `TMA-LIGHT-THEME-MIGRATION-001` — ~40 точек surface/border остаются (тонкие
  glass/backdrop эффекты).

### Blockers vs. nice-to-have
- Nice-to-have. Core flow покрыт.

### Следующие шаги
- Подключить PostHog / Mixpanel для funnel `storefront_viewed → product_viewed →
  add_to_cart → checkout_started → order_created` (уже есть события на стороне
  API, нужна агрегация).

---

# Сводка скоров

| # | Измерение | Score | Verdict |
|---|-----------|-------|---------|
| 1 | Security | 8 | OK |
| 2 | Data integrity | 7 | OK (минус backups) |
| 3 | Infra resilience | 7 | OK после 18.05 hardening |
| 4 | Observability | 6 | Тонко |
| 5 | Performance | 7.5 | OK для 100 sellers |
| 6 | Tests | 5 | Тонко |
| 7 | Dependency hygiene | 6 | OK |
| 8 | Accessibility | 6.5 | OK |
| 9 | i18n | 8 | OK |
| 10 | Legal | 5 | **Blocker (offer)** |
| 11 | SEO / Marketing | 7 | OK после domain |
| 12 | Payments | 5 | По плану (frozen) |
| 13 | Support | 5.5 | Тонко |
| 14 | Onboarding UX | 7 | OK |

**Aggregate (weighted average, обычное среднее):** **6.6 / 10**.

---

# Verdict — **Conditional Go**

**Можно запускать «soft-launch» (closed beta, до 50 продавцов)** после
закрытия Top-5 блокеров (5–7 дней).
**Публичный запуск (объявление, лидген 100 каналов)** — после критического пути ниже (~12–18 дней).

---

# Critical path to launch

Упорядочено по зависимостям. ВН — внешнее (бизнес/инфра), КОД — кодовая работа.

| # | Задача | Owner | Тип | Days |
|---|--------|-------|-----|------|
| 1 | **VERIFY-CHECKOUT-CONFIRM-500-001** — реально проверить корзинный checkout на проде (delivery+pickup). Без этого риск что мы запускаемся на сломанном critical-path. | Азим | КОД (verify) | 0.5 |
| 2 | **PROD-DOMAIN-001** — купить `savdo.uz`, привязать к Railway (CNAME apex), обновить `NEXT_PUBLIC_BUYER_URL`, `SAVDO_PROD_ORIGINS` в `main.ts`, обновить deep-link в Telegram bot. | Полат + бизнес | ВН | 1–3 |
| 3 | **LEGAL-OFFER-REQUISITES-001** — зарегистрировать юр.лицо (ИП/ООО) → заполнить `apps/web-buyer/src/app/offer/page.tsx:71-75` ИНН/ОКЭД/юр.адрес/расчётный счёт. | Бизнес | ВН | 3–7 (внешняя процедура) |
| 4 | **INFRA-BACKUP-RUNBOOK-001** — `docs/runbooks/postgres-backup-restore.md` (Railway managed snapshot retention, restore procedure, RPO=24ч RTO=2ч). Один реальный restore-drill на staging. | Полат | КОД+ВН | 1 |
| 5 | **INFRA-UPTIME-ALERTS-001** — UptimeRobot или Betterstack для 5 endpoint'ов, Telegram-нотификации в team-чат. | Полат | ВН (no-code) | 0.5 |
| 6 | **SUPPORT-CHANNEL-001** — `@savdo_support` Telegram-чат, ссылка во всех 4 фронтах (footer + TMA settings + admin login). | Полат + Азим | КОД | 0.5 |
| 7 | **SEC-AUDIT-04 hardening** (nice-to-have) — глобальный default-deny JwtAuthGuard + `@Public()`. | Полат | КОД | 1 |
| 8 | **TMA-ROOT-DIRECTORY-001** — Railway dashboard: `telegram-app` Root Directory = `apps/tma`, удалить корневой railway.toml с ветки tma. | Полат | ВН | 0.25 |
| 9 | **FRONTEND-SMOKE-PLAYWRIGHT-001** — 3-4 теста (`/`, `/[slug]`, `/cart`) на web-buyer + 1 на TMA + 1 на admin login. CI cron raз в час против Railway prod. | Азим + Полат | КОД | 2 |
| 10 | **SENTRY-DSN-001** — Sentry free-tier подключение через `SENTRY_DSN` env, замена `ErrorReporter.captureException` на `Sentry.captureException`. | Полат | КОД | 0.5 |
| 11 | **FAQ-001** — `apps/web-buyer/src/app/help/page.tsx` 8-10 Q&A. | Азим | КОД | 1 |
| 12 | **UZ-NATIVE-REVIEW-001** — Азим (носитель) проходит buyer+seller flow на UZ на staging URL после `INFRA-API-PROD-DOWN-001`. | Азим | review | 0.5 |
| 13 | **MARKETING-PAYMENT-CLICK-PAYME-001** (если есть бизнес-счёт): подключить Click тестовый → активировать flag. | Полат + бизнес | КОД+ВН | 5–10 (можно постMVP) |

**Сумма для public launch:** ≈ 12–18 рабочих дней (один backend + один
frontend параллельно). С учётом что пп.3 — внешняя процедура (3–7 дней
календарных вне нашей зависимости), реальный effort команды — ~9–11 дней.

---

# Risk register — Top 10

| # | Риск | Prob | Impact | Mitigation |
|---|------|------|--------|------------|
| R1 | **Снова падение Railway сервиса** (Redis-glitch, build-fail, удалённый railway.toml) — после 18.05 partial-mitigated, но TMA Root Directory ещё не зафиксирован | Med | High | Закрыть `DEVOPS-RAILWAY-DEPLOY-RESILIENCE-001` п.4 (Root Directory), п.5 (CODEOWNERS), п.8 (Railway notifications). + UptimeRobot. |
| R2 | **Потеря prod БД без backup** — Railway снапшот retention не зафиксирован, restore drill не делался | Low | Critical | Backup runbook + один real restore drill в staging до запуска. |
| R3 | **`/offer` без реквизитов = юр.недействительный договор** — buyer может оспорить сделку, продавец вправе отказаться от обязательств | High (после первой претензии) | High | Заполнить line 71-75 после регистрации ИП/ООО. |
| R4 | **Cash-only = низкая конверсия** — 75% UZ e-com через Click/Payme; Telegram-аудитория особенно (молодёжь без cash). | High | High (для GMV) | Не критично для технического запуска. Plan-B: PAY-002/003 после счёта. |
| R5 | **Domain savdo.uz не куплен / не на CNAME** — все canonical/OG ведут на Railway-домен → low SEO, странные share-cards в TG. | High | Med | Купить домен + Railway custom domain до объявления. |
| R6 | **0 frontend smoke tests** — критические регрессии ловятся пользователями. После prod-инцидента типа `WB-B01` (preview != confirm) можем не заметить. | High | Med | 3-4 Playwright smoke + hourly cron. |
| R7 | **Отсутствие алертинга** — downtime замечается реактивно (1+ час задержка). | Med | High | UptimeRobot 5 минут setup. |
| R8 | **No support channel** — пользователь жалуется в Telegram-канал @savdo_builderBOT или просто уходит. | High | Med | `@savdo_support` чат + footer link. |
| R9 | **Sentry-DSN не подключён** — каждый 500 в проде требует grep по Railway-логам; debug 1 issue = 30+ минут. | Med | Med | 5 минут setup, free tier 5k events/мес. |
| R10 | **Узбекский перевод не вычитан носителем** — могут быть стилистически странные строки (например `Ishga olish` для «Взять в обработку»). | Med | Low | 1 час Азим. |

---

# ETA до запуска

**Soft launch (closed beta, до 50 продавцов из лидген-каналов):**
- Critical path пп. 1–10 = **5–7 рабочих дней** (Полат+Азим параллельно).
- Можно объявлять реальным sellers, начинать сбор feedback.
- Pre-condition: пп.3 (юр.лицо) **не обязателен** для closed beta — можно
  стартовать с placeholder на offer + договориться с beta-sellers что договор
  будет в течение 2 недель.

**Public launch (объявление, посты, лидген 100 каналов):**
- Все пп. 1–12 = **12–18 рабочих дней** (включая 3–7 календарных дней на
  регистрацию ИП/ООО, которые не блокируют разработку).
- Без пп.3 (реквизиты в offer) публичный запуск НЕ рекомендуется.

**Full launch (с платежами Click/Payme):**
- + 5–10 дней работы на PAY-002/PAY-003 + integration testing.
- Прогнозируемо +1 неделя после public launch при наличии бизнес-счёта.

---

# Заметки от auditor'а

1. **Команда явно растёт в зрелости** — за последние 2 недели закрыты SEC-AUDIT
   (5 находок), QA-аудит web-* (~20+ багов), checkout pickup/delivery alignment,
   Railway resilience hardening. Это хороший индикатор готовности.
2. **Самый сильный аспект** — Security + Data integrity. JWT/RBAC/MFA/Rate-limit/
   CORS/CSP/PII всё на уровне выше среднего для MVP.
3. **Самые слабые** — Tests (5/10), Legal (5/10), Support (5.5/10). Все три
   закрываются за дни, не недели.
4. **Самый коварный** — Backup. Команда полагается на Railway managed snapshot
   без проверки. Один реальный restore drill закроет вопрос на 90%.
5. **Conditional Go** означает: **не запускать публично до закрытия Top-5
   блокеров**, но можно начинать closed beta уже сейчас с 5–10 ручно-подобранными
   продавцами.

---

**Файл подготовлен:** `c:\Users\USER\Desktop\debug\savdo-builder\docs\readiness\launch-readiness-2026-05-20.md`
**Все ссылки в отчёте — абсолютные пути от корня репо.**
