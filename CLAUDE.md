# Savdo — Claude Rules

E-commerce store builder для Telegram-продавцов Узбекистана.

---

## 🚨 АГЕНТАМ: ЧИТАТЬ ДО НАЧАЛА ЛЮБОЙ РАБОТЫ

### Три файла — обязательны всегда

| Файл | Назначение | Когда писать |
|------|-----------|--------------|
| `analiz/tasks.md` | Текущие задачи в работе | ПЕРЕД стартом — прочитай. Нашёл новую задачу — добавь. |
| `analiz/done.md` | Завершённые задачи | ПОСЛЕ выполнения — перенеси из tasks в done. |
| `analiz/logs.md` | Баги, инциденты, странности | Обнаружил баг или сбой — сразу пиши. |

### Протокол каждой сессии

```
1. ОТКРЫТЬ   analiz/tasks.md  — что сейчас в работе?
2. ОТКРЫТЬ   analiz/logs.md   — есть ли активные баги по моему домену?
3. ДЕЛАТЬ    задачу
4. НАПИСАТЬ  в analiz/done.md  — что сделано, какие файлы, ID задачи
5. УДАЛИТЬ   задачу из analiz/tasks.md
6. ЕСЛИ БАГ  — добавить в analiz/logs.md, НЕ исправлять сейчас если не твой домен
```

### Формат записи в tasks.md

```markdown
## 🔴 [ID] Название задачи
- **Домен:** apps/api | web-buyer | web-seller | admin
- **Кто взял:** Полат | Азим
- **Детали:** что нужно сделать
- **Файлы:** список файлов
```

### Формат записи в done.md

```markdown
### ✅ [ID] Название задачи
- **Важность:** 🔴 / 🟡 / 🟢
- **Дата:** ДД.ММ.ГГГГ
- **Файлы:** список файлов
- **Что сделано:** описание
```

### Формат записи в logs.md

```markdown
## [ДАТА] [ID] Описание
- **Статус:** 🔴 Баг / 🟡 Предупреждение / ✅ Исправлено
- **Что случилось:** ...
- **Что сделано:** ...
```

> **Зачем это нужно:** Другие агенты и разработчики видят где остановились, что уже сделано,
> какие баги активны. Без этих файлов агенты работают вслепую и дублируют работу друг друга.

---

## Команда и зоны ответственности
| Разработчик | Домен | Нельзя трогать |
|------------|-------|----------------|
| Полат | `apps/api`, `apps/admin`, `packages/db`, `packages/types`, `apps/mobile-buyer`, `apps/mobile-seller` | `apps/web-*` |
| Азим | `apps/web-buyer`, `apps/web-seller` | `apps/api`, `packages/db`, `apps/admin`, `apps/mobile-*` |
| ~~Яхьо~~ | ~~`apps/admin`~~ | — (admin перешёл к Полату, 01.04.2026) |

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
| **Дизайн-система (UI)** | `docs/design/liquid-authority.md` |

**Перед любой задачей** — прочитать релевантный файл из docs/V1.1/.
**Перед любой UI-задачей** — прочитать `docs/design/liquid-authority.md`.

## Агенты

Кастомные агенты: `.claude/agents/`. Использовать агент соответствующий задаче.
Не смешивать роли: backend-developer не трогает web, ui-builder не трогает API.

## Технологический стек
- **Backend:** NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ + Socket.IO
- **Web:** Next.js 16 (App Router) + Tailwind + DaisyUI v5 + TanStack Query
- **Mobile:** Expo / React Native (Phase 3)
- **Storage:** Cloudflare R2 (S3-compatible)
- **OTP:** ТОЛЬКО Telegram Bot (@savdo_builderBOT) — Eskiz.uz и любые SMS ЗАПРЕЩЕНЫ
- **Notifications:** Telegram Bot (seller) + in-app
- **Deploy:** Railway

## Ключевые правила (нарушать нельзя)

0. **❌ ESKIZ.UZ ЗАПРЕЩЁН** — никакого SMS, никакого Eskiz, никакого Playmobile. OTP только через Telegram Bot API (@savdo_builderBOT). Нарушение = откат PR.
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

## Worktrees

Используй `.worktrees/` для git worktrees.

## Skills и Commands (claude-skills, установлено 08.05.2026)

Источник: `https://github.com/alirezarezvani/coude-skills` (клон в `../claude-skills/`).
Установлены в `.claude/skills/` и `.claude/commands/`. **`.claude/` в .gitignore** — это локальная конфигурация Claude.

**Skills (35, в `.claude/skills/<name>/SKILL.md`)** — domain knowledge packs. Активируются автоматически когда Claude видит подходящий контекст. Применимые для savdo-builder:

| Skill | Когда полезен |
|-------|---------------|
| `api-design-reviewer` | Перед merge нового NestJS endpoint'а |
| `api-test-suite-builder` | Сгенерировать Jest тесты для модуля |
| `database-schema-designer` | Новая Prisma модель / migration |
| `monorepo-navigator` | Ориентация в Turborepo apps/packages |
| `dependency-auditor` | `pnpm audit` + анализ результатов |
| `env-secrets-manager` | Railway env vars / .env hygiene |
| `migration-architect` | Большие data migrations (TG→Supabase pattern) |
| `pr-review-expert` | Финальное ревью перед push |
| `skill-security-auditor` | Аудит изменений на security |
| `sql-database-assistant` | Сложные Postgres-запросы / индексы |
| `tech-debt-tracker` | Каталогизация TODO/FIXME |
| `performance-profiler` | Backend latency / N+1 |
| `codebase-onboarding` | Onboarding новых разработчиков |
| `release-manager` | Генерация changelog / release notes |
| `git-worktree-manager` | Параллельные сессии Claude |
| `runbook-generator` | Operational runbooks из кода |

**Commands (29, в `.claude/commands/<name>.md`)** — slash-команды. Вызываются через `/<name>`. Полезные для savdo-builder:

- `/a11y-audit` — accessibility аудит (TMA-A11Y use case)
- `/changelog` — сгенерировать CHANGELOG.md из коммитов
- `/focused-fix` — узкий bugfix без побочных изменений
- `/sprint-plan`, `/sprint-health` — планирование спринтов
- `/tech-debt`, `/retro` — backlog и retro
- `/tdd` — test-driven workflow
- `/plugin-audit`, `/project-health`, `/saas-health` — аудиты
- `/wiki-init`, `/wiki-ingest`, `/wiki-query` — wiki workflow

**Index в Obsidian:** `D:\Obsidian Vault\PROJECTS\savdo-builder\skills-index.md`.
