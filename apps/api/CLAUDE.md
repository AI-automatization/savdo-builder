# apps/api — Backend Rules

**Owner:** Абубакир
**Agent:** `backend-developer`, `schema-designer`

## Stack

NestJS + TypeScript + Prisma + PostgreSQL + Redis + BullMQ + Socket.IO

## Architecture (non-negotiable)

- **Thin controllers** — только parse/validate/respond, никакой логики
- **Use case services** — CreateOrderService, ApproveSellerService и т.д.
- **Repository layer** — весь DB access только через repositories
- **Transactions** — order create, stock deduction, seller approve — atomic
- **Side effects via queues** — notifications, Telegram, analytics через BullMQ

## Module build order (Phase A)

```
database → auth → users/sellers/stores → categories → products → media → cart → checkout → orders → telegram → chat → notifications → moderation/admin → analytics
```

## Key references

- Architecture: `docs/V0.1/03_backend_design.md`
- Schema: `docs/V0.1/04_database_postgresql.md`
- Invariants: `docs/V1.1/01_domain_invariants.md`
- State machines: `docs/V1.1/02_state_machines.md`
- Error codes: `docs/V1.1/05_error_taxonomy.md`
- Feature flags: `docs/V1.1/06_feature_flags.md`

## Coding standards

- Event names — past tense: `order.created`, `seller.approved`
- DTO names — by action: `CreateProductDto`, `ConfirmCheckoutDto`
- No `console.log` — use NestJS `Logger`
- No direct `prisma` calls outside repositories
- All routes under `/api/v1/`

## Observability — Sentry (API-SENTRY-001)

`ErrorReporter` (apps/api/src/shared/error-reporter.ts) — единый фасад для
телеметрии ошибок. Работает в двух режимах:

- **stderr-only** (default, dev): структурированный JSON в stderr, Railway
  log aggregation, alerting через Railway.
- **Sentry-enabled** (prod): дополнительно отправка в Sentry SaaS — source maps,
  releases, perf traces, alerting UI. Активируется заданием `SENTRY_DSN`.

### Как включить Sentry в проде

1. Получить DSN из Sentry: Project → Settings → Client Keys (DSN).
2. Добавить в Railway env переменные API-сервиса:
   - `SENTRY_DSN=https://<key>@<org>.ingest.sentry.io/<project>`
   - (опц.) `SENTRY_TRACES_SAMPLE_RATE=0.1`
   - (опц.) `SENTRY_PROFILES_SAMPLE_RATE=0.1`
3. Railway → Redeploy сервиса api.
4. Проверить лог bootstrap: должен появиться `Sentry enabled (env=production, release=<sha>, …)`.
5. Спровоцировать ошибку (например, `GET /api/v1/__nonexistent__` для 404 — это
   `breadcrumb`, не event; для реального теста — вызвать endpoint с broken state)
   и проверить, что event появился в Sentry UI.

### PII-скраббинг

Sentry `beforeSend` хук вырезает:
- Заголовки: `authorization`, `cookie`, `x-telegram-bot-api-secret-token`,
  любые `*token*` / `*secret*`.
- Поля body/query/extra: `password`, `code` (OTP), `secret`, `token`,
  `refreshToken`, `authorization`, `apiKey` → `[REDACTED]`.
- Телефоны (`phone`, `*phone`): маскируются через `maskPhone()` (+998 *** ** XX).

### Использование в коде

```ts
import { ErrorReporter } from '../../shared/error-reporter';

try {
  await doSomething();
} catch (err) {
  ErrorReporter.captureException(err, {
    userId: ctx.userId,
    op: 'createOrder',
    orderId,
  });
  throw err;
}

// Не-exception инциденты:
ErrorReporter.captureMessage('Suspicious cart manipulation', 'warning', { userId });

// После auth middleware (опционально):
ErrorReporter.setUser(req.user.sub);
```

`GlobalExceptionFilter` уже зеркалит 5xx exceptions автоматически — ручной
`captureException` нужен только когда вы ловите/глотаете exception и хотите его
залогировать.
