# Азим — установи claude-skills (от Полата)

Дата: 12.05.2026

Я (Полат) поставил себе пак из 53 скилов + 29 команд для Claude. Сильно ускоряет работу.
Поставь тоже — `.claude/` в `.gitignore`, у каждого свой набор.

---

## Установка (5 минут)

```bash
# 1. Клонируем рядом с savdo-builder (НЕ внутрь!)
cd C:/Users/USER/Desktop/debug
git clone https://github.com/alirezarezvani/coude-skills.git claude-skills

# 2. Копируем skills и commands в .claude/ внутри savdo-builder
cd savdo-builder
mkdir -p .claude/skills .claude/commands
cp -r ../claude-skills/skills/* .claude/skills/
cp -r ../claude-skills/commands/* .claude/commands/
```

Источник: <https://github.com/alirezarezvani/coude-skills>

---

## Дальше — сам разберись (важно!)

**Не используй всё подряд.** У тебя зона `apps/web-buyer` + `apps/web-seller` —
не все 53 скила тебе нужны. Часть про backend, security, DevOps — это моя зона.

### Что нужно сделать:

1. **Прочитай все скилы:** `.claude/skills/<name>/SKILL.md` — у каждого описание
   в шапке: когда активируется, что умеет.
2. **Протестируй интересные** — открой Claude в `savdo-builder/`, кинь ему
   задачу из своей зоны (например "сделай рефакторинг web-buyer cart page"
   или "сгенерируй SEO лендинг"). Посмотри какой skill подтянулся.
3. **Реши какие оставить:**
   - Полезные — оставляй
   - Шумные (мешают, лезут не туда) — **удаляй** папку из `.claude/skills/`
     или переименовывай `SKILL.md` → `SKILL.md.disabled`
4. **Команды (`/имя`):** проверь которые из 29 реально пригодятся для frontend.

---

## Мои рекомендации (под твою зону)

### Skills — кандидаты в "must have" для web-*

| Skill | Зачем |
|-------|-------|
| `landing-page-generator` | Лендинги web-buyer (SEO storefront) |
| `ui-design-system` | Liquid Authority design tokens, dev handoff |
| `ux-researcher-designer` | Persona, journey map, usability |
| `apple-hig-expert` | iOS HIG, accessibility-first, Liquid Glass 2026 |
| `senior-fullstack` | Контракты frontend ↔ `packages/types` |
| `pr-review-expert` | Самопроверка перед PR в main |
| `monorepo-navigator` | Ориентация в Turborepo |
| `code-reviewer` | Security-aware ревью |
| `dependency-auditor` | `pnpm audit` фронтенд-зависимостей |

### Skills — НЕ для твоей зоны (можешь удалить)

| Skill | Почему не твоё |
|-------|----------------|
| `api-design-reviewer` | Это мой backend |
| `api-test-suite-builder` | Тоже мой backend |
| `database-schema-designer` | packages/db только Полат |
| `sql-database-assistant` | Backend |
| `migration-architect` | Backend |
| `senior-backend` | Backend |
| `senior-data-engineer` | Backend |
| `performance-profiler` | Backend latency |
| `cloud-security` | Railway/Supabase — моя зона |
| `senior-secops` | DevOps |
| `senior-security` | Security review больших фич — моя зона |

### Commands (29) — самые полезные для frontend

| Команда | Что делает |
|---------|-----------|
| `/a11y-audit` | Accessibility аудит страницы — критично для web-buyer/seller |
| `/focused-fix` | Узкий bugfix без побочных изменений |
| `/changelog` | Generate CHANGELOG из коммитов |
| `/sprint-plan`, `/sprint-health` | Планирование |
| `/tech-debt`, `/retro` | Backlog и retro |
| `/tdd` | Test-driven workflow |
| `/project-health` | Аудит проекта |

---

## Правила

- **Skills активируются автоматически** когда Claude видит подходящий контекст.
  Не нужно их явно "включать".
- **Commands** вызываются через `/<имя>` в чате с Claude.
- **`.claude/` в `.gitignore`** — НИЧЕГО не пуш, у каждого свой набор.
- Полный список с описаниями: `savdo-builder/CLAUDE.md` (раздел "Skills и Commands").

---

## Когда увидишь — напиши

Когда поставишь и протестишь — отметься в `analiz/done.md` своим разделом
"Азим установил claude-skills" + перечисли что оставил/удалил. Будет
полезно для документации в проекте.

— Полат
