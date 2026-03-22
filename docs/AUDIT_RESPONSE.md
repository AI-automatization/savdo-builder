# Ответ на аудит — Savdo Builder

Дата: 2026-03-23
Составил: Абубакир (backend)

---

## Контекст

Проанализированы два аудит-документа:
- `savdo_builder_architecture_review.md` — архитектурный аудит (ранняя стадия)
- `project_audit.docx` — расширенный аудит с техническими рекомендациями

Ниже — статус каждой рекомендации по зонам ответственности.

---

## ✅ Сделано — наша зона (backend / packages/db)

### Архитектура и документация

| Рекомендация | Где реализовано |
|---|---|
| Product/Domain Invariants (26 инвариантов) | `docs/V1.1/01_domain_invariants.md` |
| StoreStatus state machine (DRAFT → PENDING_REVIEW → APPROVED и т.д.) | `packages/db/prisma/schema.prisma` (enum) + `docs/V1.1/02_state_machines.md` |
| SellerVerificationStatus state machine | `schema.prisma` + `docs/V1.1/02_state_machines.md` |
| OrderStatus state machine с разрешёнными переходами | `OrdersModule` + state machine docs |
| ADR документы | `docs/adr/` — 6 решений (monolith, one store, no payments, chat scope, R2, inventory) |
| Error taxonomy (50+ кодов) | `apps/api/src/shared/constants/error-codes.ts` |
| Feature flags (12 флагов) | `apps/api/src/config/features.config.ts` |
| Seller onboarding funnel + analytics events | `docs/V1.1/07_seller_onboarding_funnel.md` |
| Operations model | `docs/V1.1/08_operations_model.md` |
| Buyer identity model | `docs/V1.1/03_buyer_identity.md` |
| MVP scope decisions | `docs/V1.1/04_mvp_scope_decisions.md` |

### База данных

| Рекомендация | Где реализовано |
|---|---|
| Индексы (`@@index`) на всех hot-path полях | `schema.prisma` — storeId, orderId, threadId, createdAt и т.д. |
| Unique constraints | `schema.prisma` — phone, slug, sessionId, sku+productId и т.д. |
| Order snapshot (состав заказа immutable) | `OrderItem` хранит snapshots: title, price, sku, variantLabel |
| Soft delete | `deletedAt DateTime?` на User, Product, ProductVariant |
| Media как отдельная сущность | `MediaFile` модель + `MediaModule` |
| `ProductImage` как отдельная сущность (не `String[]`) | `ProductImage` модель с sortOrder, isPrimary |
| `updatedAt` во все сущности | Добавлен везде |
| `referredBy` поле в User (до первого деплоя) | ✅ Добавлено в `schema.prisma`, миграция применена |
| `InAppNotification` модель для inbox | ✅ Добавлено, миграция применена |

### Backend модули (Phase A — Core)

| Модуль | Покрывает |
|---|---|
| DatabaseModule | PrismaService (global) + TransactionManager |
| AuthModule | OTP (Eskiz + console-fallback в dev), JWT access/refresh, session rotate, logout |
| UsersModule | Identity CRUD |
| SellersModule | Profile, verificationStatus, languageCode |
| StoresModule | CRUD, slug generation, publish flow, state machine (INV-S01, INV-S02, INV-S03) |
| CategoriesModule | GlobalCategory (публичный) + StoreCategory (seller CRUD, max 20) |
| ProductsModule | CRUD + status machine, варианты, inventory movements |
| MediaModule | R2 presigned upload, confirm flow, visibility states |
| CartModule | Guest + auth корзины, one-store constraint (INV-C01), merge flow |
| CheckoutModule | Preview + confirm (атомарно: заказ + items + история + списание стока) |
| OrdersModule | Жизненный цикл, state machine buyer/seller, пагинация |
| TelegramModule | Уведомления продавцу: новый заказ, одобрение/отклонение магазина, верификация |

### Backend модули (Phase B — Pilot Readiness)

| Модуль | Покрывает |
|---|---|
| ChatModule | Product+order треды, REST polling, cursor pagination |
| NotificationsModule | In-app inbox (isRead, unreadCount, mark-all-read) + delivery log + настройки каналов |
| ModerationModule | Очередь проверки, APPROVE/REJECT/ESCALATE, AuditLog в транзакции (INV-A01, INV-A02) |
| AdminModule | User/seller/store management, suspend/unsuspend, AuditLog на каждое действие |
| AnalyticsModule | Append-only event ingestion, client (optional JWT) + server (fire-and-forget) |

### Observability и качество

| Рекомендация | Где реализовано |
|---|---|
| Audit log как first-class module | `AuditLog` модель (append-only), пишется на каждое admin действие |
| Structured error responses | `GlobalExceptionFilter` → uniform JSON `{code, message, details}` |
| NestJS Logger везде (без console.log) | Все модули используют `Logger` |
| Health check с проверкой БД | `GET /health` через `@nestjs/terminus` + `PrismaHealthIndicator` |
| OTP fallback в dev | `OtpService` — `DEV_OTP_ENABLED=true` → код в консоль |

### API контракты для команды

| Файл | Для кого |
|---|---|
| `docs/contracts/web-seller.md` | Азим — 36 эндпоинтов для seller web app |
| `docs/contracts/web-buyer.md` | Азим — 25 эндпоинтов для buyer storefront |
| `docs/contracts/admin.md` | Яхьо — все admin/moderation/analytics эндпоинты |

---

## ⚠️ Сделано частично — нужно доделать (наша зона)

### Socket.IO Redis adapter

**Проблема:** при горизонтальном масштабировании (2+ инстанса) сокеты будут на разных серверах и чат сломается.

**Статус:** Socket.IO в проекте есть (`@nestjs/platform-socket.io`), Redis тоже. Adapter не подключён.

**Когда делать:** перед первым horizontal scale-out. Для пилота с одним инстансом не критично.

**Что нужно:**
```bash
pnpm add --filter api @socket.io/redis-adapter
```
Затем в `main.ts`:
```typescript
import { createAdapter } from '@socket.io/redis-adapter';
const pubClient = new Redis(redisUrl);
const subClient = pubClient.duplicate();
app.useWebSocketAdapter(new IoAdapter(app));
// + подключить createAdapter(pubClient, subClient)
```

---

## ❌ Не наша зона — фронтенд (Азим)

| Рекомендация | Почему не наша |
|---|---|
| **Open Graph / og:image, og:title** для витрины | Next.js `generateMetadata()` в `apps/web-buyer`. Продавец шарит ссылку в Telegram — без превью CTR падает. **Критично сделать до пилота.** |
| **Skeleton / loading states** с первого дня | React компоненты в `packages/ui`. `ProductCardSkeleton`, `OrderRowSkeleton`. |
| **Empty state витрины** (магазин без товаров) | UI компонент в `apps/web-buyer`. |
| **Seller onboarding чеклист** на dashboard | UI в `apps/web-seller`. Прогресс-бар: создай магазин → добавь товар → поделись ссылкой. |
| **Страница "Поделиться магазином"** | UI в `apps/web-seller`. Ссылка + кнопка копировать + QR-код для офлайн. |
| **Минимальные поля в форме заказа** | UX решение в `apps/web-buyer`. Только телефон + тип доставки, адрес — прогрессивно. |
| **Mobile-first seller panel** | CSS/responsive в `apps/web-seller`. |
| **Sticky cart / footer CTA** | UI в `apps/web-buyer`. |
| **Telegram Mini App (WebApp SDK)** | Phase 2 — подключение в `apps/web-buyer`. |

---

## ❌ Не наша зона — DevOps / Ops

| Рекомендация | Кто делает |
|---|---|
| **pg_dump бэкапы** каждые 6 часов → R2 отдельный bucket | DevOps / Render.com scheduled jobs |
| **prisma migrate deploy** только после бэкапа в CI/CD | CI/CD pipeline (GitHub Actions) |
| **Тест восстановления** БД раз в неделю | Ops процедура |
| **Alerting** на critical failures | Render.com / Sentry / Uptime Kuma |
| **Seller auto-approve vs manual** операционное решение | Product decision + Ops |
| **Кто одобряет магазины, кто блокирует мошенников** | Operations playbook — описано в `docs/V1.1/08_operations_model.md` |

---

## ❌ Не наша зона — Product / команда

| Рекомендация | Примечание |
|---|---|
| **Азим делает слишком много** (два web app + PM) | Решение на уровне команды: приоритизировать buyer storefront |
| **Кросс-тестирование** (Азим тестирует Admin, Яхьо — Seller) | Договорённость команды |
| **Bus factor** — документировать по ходу | Уже закрыто: CLAUDE.md, ADR, contracts, V1.1 docs |
| **Минимальная аналитика для продавца** (3 цифры: просмотры, топ товар, конверсия) | Backend инфраструктура есть (AnalyticsModule). Нужен seller-facing endpoint + UI |

---

## Итог

**Из аудита:**
- **Критичные backend рекомендации** — все выполнены
- **Схема БД** — усилена (индексы, enums, snapshots, soft delete, referredBy, InAppNotification)
- **Observability** — структурированные ошибки, audit log, health check с Terminus
- **Документация** — полная: инварианты, state machines, ADR, contracts, feature flags

**Главное что осталось сделать до пилота (не наша зона):**
1. Open Graph в `web-buyer` — иначе ссылки в Telegram без превью
2. Seller onboarding чеклист — иначе непонятно что делать после регистрации
3. pg_dump бэкапы — настроить на Render.com
