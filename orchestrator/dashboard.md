# Dashboard — состояние мира

**Обновлено:** 2026-05-21 18:45 (claude:session-N)

## 🔴 Активные задачи

1. **`VERIFY-CHECKOUT-CONFIRM-500-001`** — Полат должен пройти корзинный checkout
   на проде (web-buyer / TMA), оба режима delivery+pickup, отписать результат.
2. **`INFRA-BACKUP-DRILL-FIRST-RUN-001`** — нужен `DATABASE_URL` от Railway prod
   для первого реального restore-drill (закроет Data 7→8.5).
3. **Sentry активация** — получить DSN на sentry.io, добавить в Railway env →
   savdo-api автоматически начнёт отправлять events (Observability 6→8).

## ⏳ Ждут (внешняя зависимость)

- **`LEGAL-OFFER-REQUISITES-001`** — реквизиты ИП/ООО в `apps/web-buyer/src/app/offer/page.tsx:71-75`.
  Ждём регистрацию (3-7 календарных дней внешняя процедура).
- **`MARKETING-PAYMENT-CLICK-PAYME-001`** — Click/Payme после открытия бизнес-счёта.
- **8 high advisories** в `next` — bump Next.js ≥16.2.6 (Азим, web-buyer + web-seller).
- **Azim's local docs commit** — он ждёт твой OK на push 6 файлов + tasks.md
  с 3 новыми тикетами (CI-PNPM-AUDIT-001 ✅ закрыт мной, LEGAL-OFFER-REQUISITES-001,
  PRE-LAUNCH-VITE-VERIFY-001).

## ❓ Открытые вопросы для Полата

- Орестратор Stage 2 (Telegram-бот) — делать сейчас или подождать пока Stage 1
  поживёт неделю?
- `@nestjs/core` 10→11 major migration — отдельный тикет (moderate advisory) —
  когда брать?
- NotebookLM-skill — поставишь сам когда будет 15 минут?
  Команда: `cd for_claude/notebooklm-skill && python scripts/run.py auth_manager.py login`

## ✅ Закрыто в последней сессии (21.05.2026)

- `CI-PNPM-AUDIT-001` — weekly pnpm audit + baseline + check-скрипт (`af8d42c`).
- uz i18n canon fixes (`809a3ed`): PENDING → kutilmoqda, Qorongʻi → Qorongʻu.
- Brand decision reframe + go-no-go recalc по реальным readiness-скорам.
- Stage 1 orchestrator (этот файл).

## 🎯 Следующее действие

**Если есть DATABASE_URL** → запустить backup + restore-drill, закрыть Data блокер.
**Если нет** → ждать твоего решения по Stage 2 orchestrator / NotebookLM / NestJS-bump.
**В любом случае** — `VERIFY-CHECKOUT-CONFIRM-500-001` твой шаг (зайти в TMA на проде).

## 📊 Launch Readiness снапшот

Текущая оценка: **~7.2/10** (Conditional Go для soft launch ≤50 sellers).
Public launch — ждёт Legal + checkout verify + 1-2 операционных setup'а.
Полный отчёт: `docs/readiness/launch-readiness-2026-05-20.md`.

## 🔗 Карта ключевых файлов

- Tasks: `analiz/tasks.md` (живой), `analiz/done.md` (история)
- Bugs/incidents: `analiz/logs.md`
- Audits: `analiz/audits/`
- Brand book: `docs/brand/`
- Readiness: `docs/readiness/launch-readiness-2026-05-20.md`
- Decisions: `docs/decisions/`
- Runbooks: `docs/runbooks/`
