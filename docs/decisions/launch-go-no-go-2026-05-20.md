# Launch Go / No-Go — savdo-builder Public Launch

**Дата:** 2026-05-20
**Применение:** [`templates/go-no-go-checklist.md`](templates/go-no-go-checklist.md)
**Owner:** Полат (api/admin) + Азим (web)
**Тип:** public launch web-buyer + web-seller (закрытая beta завершена)
**Plan launch date:** 2026-06-15 (T-26 дней)

> **СТАТУС ДАННЫХ:** этот документ ссылается на `docs/readiness/launch-readiness-2026-05-20.md`, который заполняется параллельным агентом и на момент создания этого файла **ЕЩЁ НЕ СУЩЕСТВУЕТ**.
>
> Все scores ниже — **СТАБЫ (помечены как ⏳ stub)** на основе текущего знания состояния проекта из `analiz/`, `docs/V1.1/`, и memory checkpoints. После того как readiness-отчёт будет готов — этот документ нужно **пересчитать**.

---

## 1. Контекст запуска

- **Что запускается:** публичный launch storefront (`savdo.uz/<slug>`) + seller-dashboard + admin panel
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
| 1 | Security | OWASP Top-10 чек, auth (MFA для admin), RBAC enforcement, secret rotation, no exposed `.env` | must | ≥ 7 | **6** ⏳ stub | ❌ |
| 2 | Data | Prisma migrations reversible, `pg_dump` восстановлен на тесте, no destructive DDL в pending | must | ≥ 8 | **7** ⏳ stub | ❌ |
| 3 | Infra | Railway env vars (api/admin/web-buyer/web-seller), watchPatterns, health endpoints | must | ≥ 7 | **8** ⏳ stub | ✅ |
| 4 | Observability | Structured logs, error tracking (Sentry?), uptime monitor, dashboard с key metrics | must | ≥ 6 | **4** ⏳ stub | ❌ |
| 5 | Performance | API p95 < 300ms на критичных endpoints, web LCP < 2.5s, load test 50 RPS | must | ≥ 6 | **6** ⏳ stub | ✅ |
| 6 | Tests | Unit api ≥ 60%, e2e критичных flows (checkout, seller-onboarding) | should | ≥ 6 | **4** ⏳ stub | ⚠️ |
| 7 | Deps | `pnpm audit --prod` — no high/critical | must | ≥ 7 | **7** ⏳ stub | ✅ |
| 8 | A11y | Hit-area ≥ 48px, contrast WCAG AA, semantic HTML, keyboard nav | should | ≥ 6 | **6** ⏳ stub | ✅ |
| 9 | i18n | ru + uz для launch-флоу (onboarding, checkout, error states) | should | ≥ 7 | **6** ⏳ stub | ⚠️ |
| 10 | Legal | Публичная оферта, Privacy Policy, ToS, data-processing для UZ | must | ≥ 7 | **5** ⏳ stub | ❌ |
| 11 | Marketing | Landing страница, post-templates, лид-каналы (см. project_lead_gen_channels) | should | ≥ 5 | **6** ⏳ stub | ✅ |
| 12 | Payments | N/A — out-of-scope для MVP (ADR-003) | n/a | — | — | — |
| 13 | Support | TG-канал support, FAQ, on-call для первых 14 дней | should | ≥ 6 | **5** ⏳ stub | ⚠️ |
| 14 | Onboarding | Seller onboarding протестирован на 5 живых юзерах | should | ≥ 6 | **5** ⏳ stub | ⚠️ |

**Sum of must-pass below threshold:** 4 из 7 (Security, Data, Observability, Legal)

---

## 4. Verdict (предварительный, по стабам)

### 🔴 **NO-GO** (предварительно, ждём подтверждения от readiness-отчёта)

**Блокеры (must-pass < threshold):**

1. **Security (6 < 7)** — нужен audit на OWASP Top-10. MFA enforcement для admin не подтверждён (см. `memory/project_pending_tasks.md`).
2. **Data (7 < 8)** — миграции есть, но не проверен `pg_dump → restore` end-to-end (см. `feedback_prod_data_safety`).
3. **Observability (4 < 6)** — структурированные логи частично, alerts/dashboard отсутствуют. Без этого — слепой launch.
4. **Legal (5 < 7)** — оферта, политика обработки персональных данных UZ — не готовы.

**Жёлтые флаги (should-pass < threshold, но не блокеры сами по себе):**
- Tests (4 < 6) — критичные flows без e2e покрытия
- i18n (6 < 7) — частичный uz
- Support (5 < 6) — нет formal on-call rotation
- Onboarding (5 < 6) — не тестировался на живых

---

## 5. Условные требования (если решим Conditional после фикса must-pass)

Если все 4 блокера выше будут закрыты до 2026-06-15, оставшиеся жёлтые флаги переводят запуск в **Conditional**:

- [ ] **Tests** — добавить e2e тесты для checkout-flow + seller-onboarding. Owner: Полат + Азим. Deadline: 2026-06-10.
- [ ] **i18n** — закрыть оставшиеся 30% uz-переводов (см. skill `uzbek-translator`). Owner: Азим. Deadline: 2026-06-12.
- [ ] **Support** — настроить TG-канал, FAQ из топ-20 вопросов закрытой беты. Owner: Полат. Deadline: 2026-06-13.
- [ ] **Onboarding** — пригнать 5 sellers из лидген-каналов на soft-launch неделю, собрать feedback. Owner: Полат. Deadline: 2026-06-08.

При невыполнении любого пункта conditional-списка к T-2 дня → **отложить launch на +1 неделю**.

---

## 6. План фикса блокеров (No-Go → Conditional)

### Блокер 1: Security (6 → ≥ 7)

- **Что:** OWASP Top-10 audit (skill `security-pen-testing`), MFA enforcement в admin login flow, secret rotation на Railway.
- **Кто:** Полат + skill-driven audit.
- **Сколько:** 5 дней.
- **Cut-off:** 2026-05-30.

### Блокер 2: Data (7 → ≥ 8)

- **Что:** `pg_dump prod` → restore в staging, verify schema + rows. Зафиксировать ADR на runbook backup/restore.
- **Кто:** Полат.
- **Сколько:** 2 дня.
- **Cut-off:** 2026-05-28.

### Блокер 3: Observability (4 → ≥ 6)

- **Что:** Sentry для api + admin + web-*. UptimeRobot для всех 4 endpoints. Базовый dashboard (Railway logs aggregated + Postgres slow queries).
- **Кто:** Полат + skill `observability-designer`.
- **Сколько:** 5 дней.
- **Cut-off:** 2026-06-02.

### Блокер 4: Legal (5 → ≥ 7)

- **Что:** оферта + Privacy Policy + ToS с UZ-юристом, размещение на `savdo.uz/legal/*`, cookie banner.
- **Кто:** Полат (координация) + внешний юрист.
- **Сколько:** 10 дней (включая правки).
- **Cut-off:** 2026-06-05.

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

- Полат: ⏳ pending after readiness-отчёт
- Азим: ⏳ pending after readiness-отчёт
- Дата принятия finальная: TBD

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

**Параллельный агент** заканчивает `docs/readiness/launch-readiness-2026-05-20.md` → этот документ **обязательно пересчитывается** с реальными scores → finальный verdict.

Текущий verdict ⏳ **NO-GO (preliminary, based on stubs)** — но это сигнал «есть 4 must-pass блокера, готовь план фикса», а не «launch отменён».
