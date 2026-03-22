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
