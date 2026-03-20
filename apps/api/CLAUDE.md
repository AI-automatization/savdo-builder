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
