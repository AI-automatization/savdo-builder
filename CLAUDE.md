# Savdo — Claude Rules

E-commerce store builder для Telegram-продавцов Узбекистана.

## Команда и зоны ответственности
| Разработчик | Домен | Нельзя трогать |
|------------|-------|----------------|
| Полатр | `apps/api`, `packages/db`, `packages/types`, `apps/mobile-buyer`, `apps/mobile-seller` | `apps/web-*`, `apps/admin` |
| Азим | `apps/web-buyer`, `apps/web-seller` | `apps/api`, `packages/db`, `apps/admin`, `apps/mobile-*` |
| Яхьо | `apps/admin` | `apps/api`, `packages/db`, `apps/web-*`, `apps/mobile-*` |

**packages/db** — только Полатр. Остальные сообщают о проблемах, не правят.
**packages/types** — Полатр пишет, остальные только читают.
**packages/ui** — все могут добавлять компоненты.
**apps/mobile-*** — заморожены до Phase 3.

## Документация

| Что | Где |
|-----|-----|
| Архитектурный фундамент | `docs/V0.1/` |
| Инварианты, state machines, scope | `docs/V1.1/` |
| Архитектурные решения | `docs/adr/` |
| Задачи в работе | `docs/tasks/[domain].md` |
| Завершённые задачи | `docs/done/[domain].md` |
| API контракты (нужные endpoints) | `docs/contracts/` |

**Перед любой задачей** — прочитать релевантный файл из docs/V1.1/.

## Агенты

Кастомные агенты: `.claude/agents/`. Использовать агент соответствующий задаче.
Не смешивать роли: backend-developer не трогает web, ui-builder не трогает API.

## Технологический стек
- **Backend:** NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ + Socket.IO
- **Web:** Next.js 16 (App Router) + Tailwind + DaisyUI v5 + TanStack Query
- **Mobile:** Expo / React Native (Phase 3)
- **Storage:** Cloudflare R2 (S3-compatible)
- **OTP:** Eskiz.uz → Playmobile fallback
- **Notifications:** Telegram Bot (seller) + in-app
- **Deploy:** Railway

## Ключевые правила (нарушать нельзя)

1. **Один seller = один store** в MVP (INV-S01)
2. **Корзина = один store** (INV-C01)
3. **Состав заказа immutable** после создания (INV-C03)
4. **Stock списывается** при создании заказа, восстанавливается при отмене (INV-O04)
5. **Переходы статусов** — только по таблицам в docs/V1.1/02_state_machines.md
6. **Все ошибки** — через коды из docs/V1.1/05_error_taxonomy.md
7. **Admin action** всегда пишет audit_log (INV-A01)
8. **Rejection** требует comment (INV-A02)
9. **Next.js 16** — params всегда Promise, обязательно await

## Монорепо команды
```bash
pnpm dev:api          # запустить backend
pnpm db:migrate:dev   # создать migration
pnpm db:generate      # сгенерировать Prisma client
pnpm db:studio        # Prisma Studio
pnpm build            # собрать всё через Turborepo
cd apps/web-buyer && pnpm dev   # запустить buyer web
```

## Feature Flags

Полный список: `docs/V1.1/06_feature_flags.md` и `.env.example`.
В dev: `DEV_OTP_ENABLED=true`, `STORE_APPROVAL_REQUIRED=false`.
