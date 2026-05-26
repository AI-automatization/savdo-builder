# Launch Go / No-Go — savdo-builder Public Launch

**Дата:** 2026-05-20
**Применение:** [`templates/go-no-go-checklist.md`](templates/go-no-go-checklist.md)
**Owner:** Полат (api/admin) + Азим (web)
**Тип:** public launch web-buyer + web-seller (закрытая beta завершена)
**Plan launch date:** 2026-06-15 (T-26 дней)

> **СТАТУС ДАННЫХ:** scores ниже взяты из `docs/readiness/launch-readiness-2026-05-20.md`
> (aggregate **6.6 / 10**, verdict **Conditional Go**). Документ пересчитан 2026-05-21
> после того как readiness-отчёт был доделан. Изначальные ⏳ stub-скоры сняты.

---

## 1. Контекст запуска

- **Что запускается:** публичный launch storefront (`maxsavdo.uz/<slug>`) + seller-dashboard + admin panel
- **Аудитория:** sellers (Telegram-каналы UZ) + buyers (web + TG WebApp)
- **Scope:**
  - ✅ Витрина с товарами, корзина, оформление заказа
  - ✅ Seller-кабинет: товары, заказы, чат
  - ✅ Admin: модерация, audit_log
  - ❌ Онлайн-платежи (см. ADR-003 — без платежей в MVP)
  - ❌ Mobile (заморожен до Phase 3)
- **Не-цели:** scale > 50 sellers первые 30 дней (sof launch by design)

---

## 2. Принципы gate

| Тип | Логика |
|-----|--------|
| **must-pass** | ≥ threshold обязательно. Один провал → **No-Go**. |
| **should-pass** | ≥ threshold желательно. Провал → **Conditional**. |
| **N/A** | вне scope текущего launch (например, payments) |

---

## 3. Чеклист (14 критериев)

> Threshold-ы выставлены под уровень риска public launch с реальными деньгами / репутацией.

| # | Категория | Критерий | Тип | Thr | Score | Verdict |
|---|-----------|----------|-----|-----|-------|---------|
| 1 | Security | OWASP Top-10 чек, auth (MFA для admin), RBAC enforcement, secret rotation, no exposed `.env` | must | ≥ 7 | **8** | ✅ |
| 2 | Data | Prisma migrations reversible, `pg_dump` восстановлен на тесте, no destructive DDL в pending | must | ≥ 8 | **7** | ❌ |
| 3 | Infra | Railway env vars (api/admin/web-buyer/web-seller), watchPatterns, health endpoints | must | ≥ 7 | **7** | ✅ |
| 4 | Observability | Structured logs, error tracking (Sentry?), uptime monitor, dashboard с key metrics | must | ≥ 6 | **6** | ✅⚠️ |
| 5 | Performance | API p95 < 300ms на критичных endpoints, web LCP < 2.5s, load test 50 RPS | must | ≥ 6 | **7.5** | ✅ |
| 6 | Tests | Unit api ≥ 60%, e2e критичных flows (checkout, seller-onboarding) | should | ≥ 6 | **5** | ⚠️ |
| 7 | Deps | `pnpm audit --prod` — no high/critical | must | ≥ 7 | **6** | ❌ |
| 8 | A11y | Hit-area ≥ 48px, contrast WCAG AA, semantic HTML, keyboard nav | should | ≥ 6 | **6.5** | ✅ |
| 9 | i18n | ru + uz для launch-флоу (onboarding, checkout, error states) | should | ≥ 7 | **8** | ✅ |
| 10 | Legal | Публичная оферта, Privacy Policy, ToS, data-processing для UZ | must | ≥ 7 | **5** | ❌ |
| 11 | Marketing | Landing страница, post-templates, лид-каналы (см. project_lead_gen_channels) | should | ≥ 5 | **7** | ✅ |
| 12 | Payments | N/A — out-of-scope для MVP (ADR-003) | n/a | — | — | — |
| 13 | Support | TG-канал support, FAQ, on-call для первых 14 дней | should | ≥ 6 | **5.5** | ⚠️ |
| 14 | Onboarding | Seller onboarding протестирован на 5 живых юзерах | should | ≥ 6 | **7** | ✅ |

**Sum of must-pass below threshold:** 3 из 7 (Data, Deps, Legal).
**Aggregate weighted:** **6.6 / 10** (readiness §"Сводка скоров").

> **Δ от stub:** Security 6 → 8 (sec-audit 16.05 закрыл 4 из 5 находок), Observability 4 → 6 (Sentry SDK + StructuredLogger вкатили), Tests 4 → 5 (admin/tma smoke добавлены), Performance 6 → 7.5 (pg_trgm + N+1 закрыто), i18n 6 → 8 (полный ru+uz во всех 4 апах), Onboarding 5 → 7 (homepage discovery + seller-onboarding intercept закрыты), Deps 7 → 6 (нет `pnpm audit` в CI — переоценено вниз).

---

## 4. Verdict — по реальным скорам readiness-отчёта

### 🟡 **Conditional Go** (соответствует verdict readiness §"Verdict")

**Public launch блокирован пока 3 must-pass < threshold не закрыты.**
**Soft-launch (closed beta до 50 продавцов)** допускается после закрытия Top-5
критического пути из readiness (5–7 дней) — реквизиты оферты для closed-beta
не обязательны (можно стартовать с placeholder и договориться с beta-sellers).

**Блокеры (must-pass < threshold):**

1. **Data (7 < 8)** — Prisma миграции стабильны, но `pg_dump → restore` end-to-end
   не прогонялся. Backup/restore-runbook + drill-script задеплоены 20.05
   (`docs/runbooks/postgres-backup-restore.md`, `scripts/db/restore-drill.sh`),
   нужен один реальный прогон на staging до запуска.
2. **Deps (6 < 7)** — overrides в `package.json` патчат конкретные CVE
   (path-to-regexp, multer, axios, vite, postcss, follow-redirects, lodash,
   handlebars, picomatch, fast-xml-*), но `pnpm audit --prod` не запускается в CI.
   Нет регулярного baseline / Dependabot. После добавления weekly cron-job
   `dependency-audit.yml` Deps вернётся к 7+.
3. **Legal (5 < 7)** — `apps/web-buyer/src/app/offer/page.tsx:71-75` всё ещё
   placeholder для реквизитов юр.лица (ИНН/ОКЭД/юр.адрес/счёт). Зависит от
   регистрации ИП/ООО — внешняя процедура 3–7 календарных дней.

**На грани (must-pass = threshold):**
- **Observability (6 = 6)** ✅⚠️ — `StructuredLogger` + `ErrorReporter` (Sentry SDK)
  есть, но нет реального DSN + uptime-ping'а. Один сетевой провал = слепой launch.
  Технически проходим, но **очень тонко** — рекомендуется поднять до 7 (UptimeRobot +
  Sentry DSN, 30 минут работы) до публичного объявления.

**Жёлтые флаги (should-pass < threshold, не блокеры):**
- **Tests (5 < 6)** — admin/tma имеют smoke (4+14 тестов добавлены 20.05), web-buyer/web-seller всё ещё 0.
- **Support (5.5 < 6)** — нет `@savdo_support` TG-чата, нет FAQ-страницы.

---

## 5. Условные требования (если решим Conditional после фикса must-pass)

Если все 4 блокера выше будут закрыты до 2026-06-15, оставшиеся жёлтые флаги переводят запуск в **Conditional**:

- [ ] **Tests** — добавить e2e тесты для checkout-flow + seller-onboarding. Owner: Полат + Азим. Deadline: 2026-06-10.
- [ ] **i18n** — закрыть оставшиеся 30% uz-переводов (см. skill `uzbek-translator`). Owner: Азим. Deadline: 2026-06-12.
- [ ] **Support** — настроить TG-канал, FAQ из топ-20 вопросов закрытой беты. Owner: Полат. Deadline: 2026-06-13.
- [ ] **Onboarding** — пригнать 5 sellers из лидген-каналов на soft-launch неделю, собрать feedback. Owner: Полат. Deadline: 2026-06-08.

При невыполнении любого пункта conditional-списка к T-2 дня → **отложить launch на +1 неделю**.

---

## 6. План фикса блокеров (Conditional → Go)

### Блокер 1: Data (7 → ≥ 8)

- **Что:** один реальный restore-drill в Railway staging:
  `bash scripts/db/restore-drill.sh --dump <prod-snapshot.dump> --target-db <staging-url> --source-db <prod-url>`.
  Скрипт проверяет DROP+restore+integrity-check+row-count drift ≤ 5%.
  Залогировать exit=0 в `analiz/done.md`. После — настроить Railway-cron на
  ежемесячный прогон (`POSTGRES_BACKUP_RETENTION_DAYS` + cron в Railway dashboard).
- **Кто:** Полат (владелец инфры) + Азим (verify-only прогон скрипта).
- **Сколько:** 2 дня (1 — staging-прогон, 1 — Railway-cron + alert на FAIL).
- **Cut-off:** 2026-05-28.

### Блокер 2: Deps (6 → ≥ 7)

- **Что:** `.github/workflows/dependency-audit.yml` — weekly cron, `pnpm audit
  --prod --json`, fail если есть `high`/`critical`. Зафиксировать baseline.
  Опционально: GitHub Dependabot для weekly PR-bump'ов.
- **Кто:** Полат.
- **Сколько:** 0.5 дня.
- **Cut-off:** 2026-05-30.

### Блокер 3: Legal (5 → ≥ 7)

- **Что:** заполнить `apps/web-buyer/src/app/offer/page.tsx:71-75` ИНН/ОКЭД/юр.адресом
  после регистрации ИП/ООО. Cookie banner — добавляется только если есть
  трекинг-cookies (сейчас нет — можно отложить).
- **Кто:** Бизнес (регистрация) → Полат (заполнение).
- **Сколько:** 3–7 календарных дней (внешняя процедура).
- **Cut-off:** 2026-06-05.

### Hardening (Observability 6 → 7, поднимаем с границы)

- **Что:** Sentry DSN в Railway env, UptimeRobot на 5 endpoints с TG-алертами.
- **Кто:** Полат.
- **Сколько:** 0.5 дня.
- **Cut-off:** 2026-05-30.

### Re-review

- **Дата:** 2026-06-06 (T-9 дней от launch)
- **Owner:** оба
- **Результат:** обновлённые scores → новый verdict Go / Conditional / No-Go

---

## 7. Если решение Go (гипотетически после фиксов)

### Pre-launch (T-2 дня)

- [ ] Final smoke test всех 4 deploy-targets
- [ ] DNS / SSL проверены
- [ ] Backup сделан вечером перед launch
- [ ] On-call расписан на первые 72 часа

### Launch (T0)

- [ ] Включить публичный доступ
- [ ] Запостить в лидген-каналы (см. `project_lead_gen_channels`)
- [ ] Активный мониторинг первые 8 часов

### Post-launch (T+7 дней)

- [ ] Заполнить «Реальность после» в §8 этого документа
- [ ] Postmortem если были инциденты (skill `incident-response`)

---

## 8. Post-launch review (заполняется T+7 / T+30)

| Critic | Pre-score | Реальный post-score | Δ | Уроки |
|--------|-----------|---------------------|---|-------|
| 1 Security | … | … | … | … |
| 2 Data | … | … | … | … |
| 3 Infra | … | … | … | … |
| 4 Observ | … | … | … | … |
| 5 Perf | … | … | … | … |
| 6 Tests | … | … | … | … |
| 7 Deps | … | … | … | … |
| 8 A11y | … | … | … | … |
| 9 i18n | … | … | … | … |
| 10 Legal | … | … | … | … |
| 11 Marketing | … | … | … | … |
| 12 Payments | n/a | n/a | n/a | если в scope для Phase 2 — добавить |
| 13 Support | … | … | … | … |
| 14 Onboarding | … | … | … | … |

---

## 9. Подписи

- Полат: ⏳ pending до закрытия Top-3 must-pass блокеров
- Азим: ⏳ pending до закрытия Top-3 must-pass блокеров
- Дата принятия finальная: TBD (плановое re-review 2026-06-06)

---

## 10. Связанные документы

- [`templates/go-no-go-checklist.md`](templates/go-no-go-checklist.md) — шаблон
- [`framework.md`](framework.md) — методология
- [`../readiness/launch-readiness-2026-05-20.md`](../readiness/launch-readiness-2026-05-20.md) — **источник реальных scores** (параллельный агент)
- [`../adr/ADR-003_no_payments_mvp.md`](../adr/ADR-003_no_payments_mvp.md) — почему payments out-of-scope
- [`../V1.1/`](../V1.1/) — инварианты и state machines (определяют тесты)
- `analiz/tasks.md` — текущие open tasks которые могут менять scores
- `memory/project_pending_tasks.md` — pending tasks Полата (MFA, RBAC и т.д.)

---

## 11. Следующее действие

`docs/readiness/launch-readiness-2026-05-20.md` готов — этот документ пересчитан
по нему 2026-05-21.

Текущий verdict 🟡 **Conditional Go** — soft-launch (closed beta) можно
объявлять после закрытия Top-5 critical path readiness'a (5–7 дней), public
launch — после закрытия 3 must-pass блокеров (Data → drill, Deps → CI audit,
Legal → реквизиты).
