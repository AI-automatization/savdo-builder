# Go / No-Go Checklist — Template

**Используется для:** запуска новой фичи / платформы / миграции / breaking change.
**Версия шаблона:** 1.0

> Скопируй → `docs/decisions/<launch-name>-YYYY-MM-DD.md` → заполни.

---

## 1. Контекст запуска

- **Что запускается:** …
- **Дата launch (план):** YYYY-MM-DD
- **Owner:** [имя]
- **Команда:** Полат / Азим / …
- **Тип:** soft launch (closed beta) | public launch | data migration | breaking change

---

## 2. Принцип gate

- **Must-pass** — критерий обязан быть ≥ threshold. Хоть один must-pass < threshold → **No-Go**.
- **Should-pass** — желательно ≥ threshold. Если < threshold — **Conditional** (запуск с явным риском + план фикса).
- **Nice-to-have** — фиксируем как известный долг, не блокирует.

Шкала 0–10:
- 0–3 — провал
- 4–6 — средне
- 7 — приемлемо для запуска
- 8–9 — хорошо
- 10 — отлично

---

## 3. Критерии (типовой набор для savdo-builder)

> Дополнить / убрать пункты под конкретный запуск. Threshold подобрать под уровень риска.

| # | Категория | Критерий | Тип | Threshold | Score | Verdict |
|---|-----------|----------|-----|-----------|-------|---------|
| 1 | Security | Auth, RBAC, secrets rotation, OWASP-чек | must | ≥ 7 | ? | ? |
| 2 | Data | Migrations reversible, backup тест прошёл | must | ≥ 8 | ? | ? |
| 3 | Infra | Railway env vars set, health checks работают | must | ≥ 7 | ? | ? |
| 4 | Observability | Logs structured, alerts настроены, dashboard есть | must | ≥ 6 | ? | ? |
| 5 | Performance | p95 < target (см. SLO), load test пройден | must | ≥ 6 | ? | ? |
| 6 | Tests | Unit ≥ 60%, e2e критичных path-ов покрыты | should | ≥ 6 | ? | ? |
| 7 | Deps | `pnpm audit` — нет high/critical | must | ≥ 7 | ? | ? |
| 8 | A11y | Hit-area ≥ 48px, контраст AA, semantic HTML | should | ≥ 6 | ? | ? |
| 9 | i18n | ru + uz покрыты для launch-флоу | should | ≥ 7 | ? | ? |
| 10 | Legal | ToS, Privacy, OFFER, data-processing | must | ≥ 7 | ? | ? |
| 11 | Marketing | Landing готов, posts black-листы готовы | should | ≥ 5 | ? | ? |
| 12 | Payments | Если в scope: реальный платёж прошёл end-to-end | must (если в scope) | ≥ 8 | ? | ? |
| 13 | Support | TG-канал, FAQ, кто отвечает первые 2 недели | should | ≥ 6 | ? | ? |
| 14 | Onboarding | Seller / buyer onboarding протестирован на 5 живых юзерах | should | ≥ 6 | ? | ? |

---

## 4. Verdict

### Логика

| Условие | Verdict |
|---------|---------|
| Все must-pass ≥ threshold + все should-pass ≥ threshold | **Go** |
| Все must-pass ≥ threshold + ≥ 1 should-pass < threshold | **Conditional** — список условий ниже |
| Хоть один must-pass < threshold | **No-Go** — отложить, фиксить |

### Текущий verdict: **Go / Conditional / No-Go**

---

## 5. Если Conditional — условные требования

> Каждое условие — конкретное действие с owner и deadline.

- [ ] **[Critic #N]** — фикс [что именно], owner: [имя], deadline: [дата]
- [ ] … 

Запуск разрешается с этим списком, но он становится **критичным backlog** на первую неделю post-launch.

---

## 6. Если No-Go — план фикса

- **Главная блокировка:** Critic #N
- **Что нужно:** …
- **Сколько займёт:** …
- **Новая дата launch (план):** YYYY-MM-DD
- **Re-review:** YYYY-MM-DD

---

## 7. Post-launch review

После launch (через 7 / 30 дней) — заполнить:

| Critic | Score до | Реальность после | Δ |
|--------|----------|-------------------|---|
| 1 | … | … | … |

Что недооценили / переоценили? Изменения в чеклист на будущее.

---

## 8. Подписи

- Owner: [имя], дата
- Полат: [подпись / готов / не готов]
- Азим: [подпись / готов / не готов]

---

## Пример (упрощённый)

```
Запуск: public launch web-buyer + web-seller, 2026-06-15

         Critic              Type  Thr  Score  Verdict
1  Security                  must  7    7      ✅
2  Data migrations           must  8    9      ✅
3  Railway infra             must  7    8      ✅
4  Observability             must  6    5      ❌  ← блокер
5  Performance               must  6    6      ✅
6  Tests                     should 6   4      ⚠️
7  pnpm audit                must  7    7      ✅
…

→ Verdict: No-Go. Главная блокировка — observability (нет alerts).
→ Plan: +1 week, добавить Sentry + UptimeRobot, re-review 2026-06-08.
```
