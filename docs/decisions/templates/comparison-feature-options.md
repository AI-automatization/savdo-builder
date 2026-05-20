# Feature Options Comparison — Template

**Используется для:** «выбираем между X / Y / Z библиотекой / архитектурой / провайдером».
Упрощённая версия `scoring-matrix.md` — для технических решений без публичных last-ing последствий.

> Скопируй → `docs/decisions/<topic>-YYYY-MM-DD.md` → заполни.
> Если решение публичное (бренд, имя, цвет) — используй `scoring-matrix.md` вместо этого.

---

## 1. Контекст

- **Что выбираем:** …
- **Где используется:** [api / web-buyer / packages/db / ...]
- **Кто использует:** Полат / Азим / оба
- **Откат стоит:** [часов работы]

---

## 2. Опции (3+)

| # | Опция | Версия / источник | Лицензия | Maintainer activity |
|---|-------|-------------------|----------|---------------------|
| A | Library X | X.Y.Z | MIT | last release: YYYY-MM |
| B | Library Y | … | … | … |
| C | Library Z | … | … | … |

---

## 3. Quick-check (must-pass до scoring)

| Проверка | A | B | C |
|----------|---|---|---|
| Лицензия совместима с проектом (MIT/Apache/BSD ОК; AGPL — нет) | ✅ | ✅ | ❌ |
| Активный maintainer (commit < 6 мес назад) | ✅ | ❌ | ✅ |
| Совместима со стеком (NestJS 11 / Next.js 16 / Node 22) | ✅ | ✅ | ✅ |
| Нет известных CVE high/critical | ✅ | ✅ | ✅ |
| Pulse — issues отвечаются | ✅ | ✅ | ✅ |

❌ хоть в одной строке → опция отпадает до scoring.

---

## 4. Сравнение по критериям

| Критерий | Вес | A | B | C |
|----------|-----|---|---|---|
| Functional fit (закрывает usecase) | 0.25 | 9 | 7 | 8 |
| DX / API ergonomics | 0.15 | 8 | 6 | 7 |
| Performance | 0.15 | 7 | 9 | 7 |
| Bundle size / footprint | 0.10 | 6 | 9 | 8 |
| Docs quality | 0.10 | 9 | 5 | 7 |
| Community / SO answers | 0.10 | 9 | 4 | 7 |
| TypeScript support | 0.10 | 9 | 8 | 6 |
| Migration cost (low = high score) | 0.05 | 8 | 6 | 7 |
| **Weighted Σ** | | **8.10** | **6.75** | **7.25** |

---

## 5. Подводные камни (за каждой опцией)

### A — Library X
- ⚠️ Big bundle (+120kb)
- ⚠️ Требует peerDep на Y
- ✅ TypeScript first-class

### B — Library Y
- ⚠️ Maintainer на паузе с 2025-12
- ✅ Tiny, fast

### C — Library Z
- ⚠️ API меняется между мажорами
- ✅ Хороший Russian-language community

---

## 6. Решение

**Выбрано:** A (Library X)
**Score:** 8.10 vs 7.25 (#2) vs 6.75 (#3)

**Главные плюсы:**
- Functional fit 9/10
- Docs + community сильнее всех
- TS-types из коробки

**Trade-off:**
- Bundle size 6/10 (+120kb) — приемлемо для admin/api, не критично для web-* (lazy load).

---

## 7. Action items

- [ ] `pnpm add library-x`
- [ ] Конфиг в [файл]
- [ ] Обновить docs (если public API меняется)
- [ ] Migrate [старая опция] → A (если применимо)
- [ ] ADR? — да/нет (нужен только если library меняет архитектуру)
- [ ] Obsidian decision note

---

## 8. Review

- **Через 6 месяцев:** проверить — нет ли регрессии, баги, что не учли?
- **Условие немедленного пересмотра:** CVE high/critical в библиотеке.

---

## Пример (Click vs Payme vs Octo)

```
                          Click   Payme   Octo
Functional fit (0.25)     9       9       6
DX (0.15)                 7       8       6
Comm (0.15)               7       8       8
Coverage UZ banks (0.15)  9       9       6
Dev-effort (0.10)         7       8       6
SLA (0.10)                7       7       5
Docs (0.05)               6       8       5
Brand trust (0.05)        7       7       4
                          ───     ───     ───
                          7.75    8.20    6.05

→ Payme выбран.
```
