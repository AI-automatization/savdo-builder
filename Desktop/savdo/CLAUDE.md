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
