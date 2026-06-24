# maxsavdo — Claude Rules

E-commerce store builder для Telegram-продавцов Узбекистана.

---

## ⚡ АВТО-АКТИВАЦИЯ СКИЛЛОВ (читать ПЕРВЫМ)

> Base44-style activation rules. ПЕРЕД каждой задачей — найди совпадение и вызови скилл через Skill tool. Не жди когда пользователь попросит.

| Сигнал в задаче | Авто-активировать |
|---|---|
| Новый NestJS endpoint / controller / UseCase | `new-api-endpoint` → `api-design-reviewer` |
| Prisma schema / migration / новая модель | `database-schema-designer` → `migration-architect` |
| Баг / "не работает" / "сломано" | `focused-fix` |
| PR review / ревью кода / перед пушем | `pr-review-expert` → `adversarial-reviewer` |
| TMA / Telegram WebApp / apps/tma | `twa-miniapp` |
| UI компонент / дизайн / стили | `ui-ux-savdo` → `ui-design-system` |
| Новая команда бота / Telegram handler | `new-bot-command` |
| Auth / JWT / RBAC / permissions | `senior-security` |
| Производительность / N+1 / медленно | `performance-profiler` |
| Railway / деплой / env vars / secrets | `env-secrets-manager` |
| Тесты / Jest / coverage | `api-test-suite-builder` |
| Release / changelog / версия | `release-manager` |
| Большая фича (>3 файлов) | `spec-driven-workflow` сначала — план до кода |
| Безопасность / pentest / OWASP | `security-pen-testing` → `cloud-security` |
| SQL запрос / индекс / оптимизация | `sql-database-assistant` |
| Монорепо навигация / Turborepo | `monorepo-navigator` |

**Правило:** если задача попадает в таблицу — вызвать скилл молча, без уточнения у пользователя. Если не попадает — работать без скилла.

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

**Бизнес-модель, монетизация, ценообразование, маркетинг, GTM, контент, продажи — Азим** (с 02.06.2026).
Полат — только инженерия/инфра (api/admin/db/types/tma + DevOps/биллинг-cron); бизнес-решения он больше
не owns, только consult по техвыполнимости (напр. multi-store/INV-S01). Гибкость: правки в `apps/web-buyer`/
`apps/web-seller` под бизнес-нужды делаем по ходу. Мастер-план: `docs/business/roadmap-to-production-2026-06-02.md`.

## Документация

| Что | Где |
|-----|-----|
| Архитектурный фундамент | `docs/V0.1/` |
| Инварианты, state machines, scope | `docs/V1.1/` |
| Архитектурные решения | `docs/adr/` |
| Задачи в работе | `docs/tasks/[domain].md` |
| Завершённые задачи | `docs/done/[domain].md` |
| API контракты (нужные endpoints) | `docs/contracts/` |
| **Дизайн-система (UI)** | `docs/design/maxsavdo-design-v2.md` (liquid-authority.md — deprecated) |
| **Бизнес-модель / монетизация / GTM / контент** (владелец Азим) | `docs/business/` — мастер `business-model-v2`, роадмап `roadmap-to-production`, контент-карта `completeness-map`, пилот `content/` |

**Перед любой задачей** — прочитать релевантный файл из docs/V1.1/.
**Перед любой UI-задачей** — прочитать `docs/design/maxsavdo-design-v2.md`.

## Агенты

Кастомные агенты: `.claude/agents/`. Использовать агент соответствующий задаче.
Не смешивать роли: backend-developer не трогает web, ui-builder не трогает API.

## Технологический стек
- **Backend:** NestJS + TypeScript + PostgreSQL + Prisma + Redis + BullMQ + Socket.IO
- **Web:** Next.js 16 (App Router) + Tailwind + DaisyUI v5 + TanStack Query
- **Mobile:** Expo / React Native (Phase 3)
- **Storage:** Cloudflare R2 (S3-compatible)
- **OTP:** ТОЛЬКО Telegram Bot (@maxsavdo_bot) — Eskiz.uz и любые SMS ЗАПРЕЩЕНЫ
- **Notifications:** Telegram Bot (seller) + in-app
- **Deploy:** Railway

## Ключевые правила (нарушать нельзя)

0. **❌ ESKIZ.UZ ЗАПРЕЩЁН** — никакого SMS, никакого Eskiz, никакого Playmobile. OTP только через Telegram Bot API (@maxsavdo_bot). Нарушение = откат PR.
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

**Skills (53, в `.claude/skills/<name>/SKILL.md`)** — domain knowledge packs. Активируются автоматически когда Claude видит подходящий контекст. Применимые для savdo-builder:

### Engineering / API / DB

| Skill | Когда полезен |
|-------|---------------|
| `api-design-reviewer` | Перед merge нового NestJS endpoint'а |
| `api-test-suite-builder` | Сгенерировать Jest тесты для модуля |
| `database-schema-designer` | Новая Prisma модель / migration |
| `sql-database-assistant` | Сложные Postgres-запросы / индексы |
| `migration-architect` | Большие data migrations (TG→Supabase pattern) |
| `monorepo-navigator` | Ориентация в Turborepo apps/packages |
| `dependency-auditor` | `pnpm audit` + анализ результатов |
| `env-secrets-manager` | Railway env vars / .env hygiene |
| `pr-review-expert` | Финальное ревью перед push |
| `skill-security-auditor` | Аудит изменений на security |
| `tech-debt-tracker` | Каталогизация TODO/FIXME |
| `performance-profiler` | Backend latency / N+1 |
| `codebase-onboarding` | Onboarding новых разработчиков |
| `release-manager` | Генерация changelog / release notes |
| `git-worktree-manager` | Параллельные сессии Claude |
| `runbook-generator` | Operational runbooks из кода |

### Design / UI / UX (новое 08.05.2026)

| Skill | Когда полезен |
|-------|---------------|
| `ui-design-system` | Design tokens / component docs / dev handoff (maxsavdo Liquid Authority) |
| `ux-researcher-designer` | Persona / journey map / usability testing |
| `apple-hig-expert` | iOS/macOS HIG, accessibility-first, Liquid Glass aesthetics 2026 |
| `landing-page-generator` | Landing pages (web-buyer storefront SEO) |

### Security / Pentest (новое 08.05.2026)

| Skill | Когда полезен |
|-------|---------------|
| `senior-security` | Security review больших фич, threat modeling |
| `senior-secops` | SecOps процессы, monitoring, alerting |
| `security-pen-testing` | OWASP-аудит endpoints, обход auth, RBAC bypass проверки |
| `cloud-security` | Railway/Supabase security, IAM, secret rotation |
| `adversarial-reviewer` | Adversarial code review (что сломает злоумышленник) |
| `incident-response` | После инцидента: containment, postmortem, audit log |
| `code-reviewer` | Security-aware код-ревью |

### Backend / Network / Data (новое 08.05.2026)

| Skill | Когда полезен |
|-------|---------------|
| `senior-backend` | NestJS архитектура, REST/WebSocket/HTTP-клиенты (axios/fetch), retries, timeouts |
| `senior-fullstack` | Backend ↔ frontend integration, type-safe contracts (packages/types) |
| `senior-data-engineer` | ETL, data pipelines, complex SQL, batch jobs |

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

---

## PRE-FLIGHT PROTOCOL (обязателен — проект-специфичные правила)

### Перед claim о коде
- `grep` → существует ли функция/тип в codebase?
- `read` → прочитать файл, не описывать по памяти
- Цитировать: `apps/api/src/users/users.service.ts:47 — там метод X`
- Схема БД: только после `read packages/db/prisma/schema.prisma`

### Перед edit
- `git status` → чужие файлы? стоп
- `read` целевого файла (параллельные сессии меняют файлы)
- Зоны жёсткие: Полат = `apps/api`, `apps/admin`, `packages/db`, `packages/types` | Азим = `apps/web-*`
- `web-*` без явного разрешения Полата — не трогать

### Обязательные правила self-audit
1. Никогда не утверждать о коде без read/grep
2. Никогда "я помню из прошлой сессии" — только MEMORY.md + read файла
3. Контекст >50 msg → начать новую сессию с `git status` + ключевые файлы
4. Перед миграцией → read `packages/db/prisma/schema.prisma` полностью
5. Не добавлять абстракцию когда нужно 3 строки
6. Не использовать `any` в TypeScript без явного комментария почему
7. Не делать `git add -A` — только конкретные файлы
8. Не делать DROP/RENAME в миграциях без предупреждения Полата

---

## GUARDRAILS (запрет на confidence без источника)

### Запрещено
- "Я помню что там есть функция X" (без grep)
- "Схема выглядит так..." (без read schema.prisma)
- "Версия Prisma/Railway/Next.js поддерживает Y" (без WebSearch)
- "Там уже реализовано" (без git log)
- "Обычно NestJS делает это так..." (проверь в конкретном коде)

### Обязательно
- `grep`: "функция X найдена в `apps/api/src/orders/orders.service.ts:89`"
- `read`: "прочитал `schema.prisma:145` — там поле `status` enum OrderStatus"
- WebSearch для версий: "Railway docs 2025: флаг `--detach` убран в v3.2"
- Если источника нет → "Я не знаю, нужно проверить"

---

## WORKFLOW (полный процесс сессии)

```
1. СТАРТ СЕССИИ
   git status → нет ли конфликтов
   Прочитать: analiz/tasks.md, analiz/logs.md
   Проверить MEMORY.md vs код (stale? → обновить)

2. GROUNDING (перед любым claim/edit)
   grep паттерна → существует?
   read целевого файла → не по памяти
   WebSearch → если вопрос про версию либы (cutoff: август 2025)

3. РАБОТА
   code / analysis / edit
   Только конкретные файлы git add

4. SELF-CHECK (перед output)
   □ Не нарушил зоны (Полат/Азим)?
   □ Не утверждал без grep/read?
   □ Нет overengineering (3 строки vs абстракция)?
   □ Нужен Obsidian ADR? → obsidian-note.ps1

5. ЗАВЕРШЕНИЕ
   analiz/done.md — что сделано
   analiz/tasks.md — удалить закрытые задачи
   MEMORY.md — обновить если изменился контекст
```

---

## Модель: Fable 5 vs Sonnet 4.6

### Sonnet 4.6 (для savdo-builder daily)
- NestJS endpoints, Prisma migrations, Next.js pages
- Bug fix, рефакторинг, grep → edit цикл
- Много tool calls (read/grep/edit) — Sonnet быстрее и дешевле

### Fable 5 (переключать через /model)
- Архитектурный ADR: выбор между 3+ вариантами (например: WebSocket vs polling)
- Security audit с нестандартными векторами
- PRD / API contract / технические спецификации
- Reasoning chain >10 шагов

### API конфиг (при прямом вызове Anthropic API)
```typescript
// Код (без thinking)
{ temperature: 0.3, top_p: 0.85 }

// Архитектура (с extended thinking)
// ВАЖНО: temperature и top_p несовместимы с thinking → убрать
{ thinking: { type: "enabled", budget_tokens: 16000 } }
```
