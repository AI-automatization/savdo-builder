# apps/admin — Superadmin Panel Rules

**Owner:** Яхьо
**Agent:** `admin-builder`, `ui-builder`

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind + DaisyUI + TanStack Query

## Audience

Один superadmin (команда Savdo). Управление продавцами, магазинами, заказами.

## Rules

- Dense UI: таблицы, фильтры, быстрые действия
- Destructive actions (suspend, block, reject) — всегда confirmation modal
- Rejection/suspension — comment field обязателен (INV-A02)
- Status badge цвета по `docs/V1.1/02_state_machines.md`:
  - PENDING_REVIEW → yellow / APPROVED → green / REJECTED → red / SUSPENDED → orange
- Операционные сценарии: `docs/V1.1/08_operations_model.md`
- Все admin endpoints: `/api/v1/admin/*`
- Типы: только из `packages/types`
- Если endpoint не готов → мок + записать в `docs/contracts/`

## Priority pages

1. `/sellers` + `/sellers/[id]` — review queue с SLA-таймером
2. `/stores` + `/stores/[id]`
3. `/orders`
4. `/products` — hide/restore
