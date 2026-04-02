# Backend — Завершённые задачи

| Дата | Задача | Примечание |
|------|--------|------------|
| 2026-03-21 | Monorepo структура | pnpm workspaces + Turborepo |
| 2026-03-21 | Prisma schema (V1.1) | Все таблицы + enums из V1.1 state machines |
| 2026-03-21 | Config modules | app, db, redis, jwt, storage, telegram, features |
| 2026-03-21 | Error codes constants | 50+ кодов из docs/V1.1/05_error_taxonomy.md |
| 2026-03-21 | Analytics event constants | Все события из docs/V1.1/07_seller_onboarding_funnel.md |
| 2026-03-21 | packages/types scaffold | Enums + пустые type файлы по доменам |
| 2026-03-21 | DatabaseModule | PrismaService (global) + TransactionManager |
| 2026-03-21 | Common layer | DomainException, GlobalExceptionFilter, CurrentUser decorator, RolesGuard |
| 2026-03-21 | AuthModule | OTP request/verify, JWT access/refresh, session rotate, logout |
| 2026-03-21 | CategoriesModule | GlobalCategory (public) + StoreCategory (seller CRUD), max 20 limit |
| 2026-03-21 | ProductsModule | Product CRUD + status machine, variants, inventory movements, storefront public routes |
| 2026-03-21 | MediaModule | R2 presigned upload, confirm flow, delete |
| 2026-03-21 | CartModule | Add/remove/update items, one-store constraint, guest+auth carts, merge flow |
| 2026-03-21 | CheckoutModule | Preview + confirm flow, atomic order creation + stock deduction |
| 2026-03-21 | OrdersModule | Lifecycle, status transitions, buyer+seller views, history |
| 2026-03-21 | TelegramModule | Seller notifications: new order, store approved/rejected, verification status |
| 2026-03-21 | NotificationsModule | Delivery log center, channel preferences, exported NotificationService |
| 2026-03-21 | ChatModule | Product+order threads, REST polling, read receipts, cursor pagination |
| 2026-03-21 | AdminModule | User/seller/store management, suspend/unsuspend, AuditLog (INV-A01, INV-A02) |
| 2026-03-21 | ModerationModule | Seller review queue, approve/reject/escalate, AuditLog (INV-A01, INV-A02) |
| 2026-03-21 | AnalyticsModule | Append-only event ingestion, client+server tracking, exported AnalyticsService |
| 2026-03-23 | render.yaml | Render.com deploy config: API service + PostgreSQL + Redis |
| 2026-03-23 | Seed script | 10 GlobalCategories (RU/UZ) + test ADMIN user (dev/test only), idempotent upserts |
| 2026-03-23 | ENV validation | Joi schema in apps/api/src/config/env.validation.ts, wired into ConfigModule.forRoot |
| 2026-03-23 | Socket.IO Redis adapter | Горизонтальное масштабирование чата через Redis pub/sub |
| 2026-03-23 | BullMQ queues | Telegram + in-app notifications через очереди с retry |
| 2026-03-30 | OTP через Telegram — замена Eskiz | RedisService (global), TelegramWebhookController (POST /telegram/webhook), otp.service.ts полностью переписан. Eskiz удалён везде. Бот: @savdo_builderBOT |
| 2026-03-30 | Docker + локальная Railway-среда | docker-compose.yml (PostgreSQL 16 + Redis 7 + API), .env.docker, Makefile (make up/down/logs/reset/typecheck) |
| 2026-03-30 | TypeScript typecheck | tsc --noEmit EXIT 0 — все типы чистые. Скрипт добавлен в root package.json |
| 2026-03-31 | Dockerfile multi-stage — ГОТОВО | .dockerignore добавлен (node_modules хоста не копируются). prisma в dependencies пакета db. generate и migrate:deploy через `pnpm --filter db exec prisma`. API запускается, health: ok |
| 2026-03-30 | Конфиги обновлены | TELEGRAM_BOT_TOKEN=required, TELEGRAM_WEBHOOK_SECRET, ESKIZ_* удалены, error-codes: TELEGRAM_NOT_LINKED, CLAUDE.md: правило 0 Eskiz запрещён |
| 2026-03-31 | Railway деплой web-buyer | savdo-builder сервис — Dockerfile закоммичен, railway.toml настроен, Variables добавлены, деплой успешен |
| 2026-03-31 | Railway деплой web-seller | web-seller сервис — Dockerfile закоммичен, railway.toml настроен, Variables добавлены, деплой успешен |
| 2026-04-01 | `app.listen(port, '0.0.0.0')` — критический фикс | Railway healthcheck не мог достучаться до API |
| 2026-04-01 | `start.sh` — prisma migrate deploy перед запуском | Гарантирует что миграции применены до старта |
| 2026-04-01 | `healthcheckTimeout` → 300 сек | Было мало для Railway cold start |
| 2026-04-01 | CORS — добавлены все 4 домена в `ALLOWED_ORIGINS` | buyer, admin, web-buyer (new), web-seller |
| 2026-04-01 | Seed: admin user + 10 категорий | `+998910081910`, role=ADMIN, запись в `admin_users` |
| 2026-04-01 | API задеплоен и работает | `https://savdo-api-production.up.railway.app` |
| 2026-04-01 | Telegram Webhook авто-регистрация | `onApplicationBootstrap` в `TelegramBotService` — при старте в prod вызывает `setWebhook` |
| 2026-04-01 | R2 Storage guard — нет краша без конфига | `isConfigured()` + 503 в `RequestUploadUseCase` когда `STORAGE_ENDPOINT` пустой |
