# Brand Selection — Name × Palette × Logo

**Дата:** 2026-05-20
**Статус:** Decision document (применение `templates/scoring-matrix.md`)
**Оценщики:** Полат (backend / стратегия) + симуляция Азима (web / дизайн) — финальная валидация Азимом обязательна перед ADR
**Связано:** [`docs/brand/README.md`](../brand/README.md), `analiz/audits/web-buyer-vs-seller-design-2026-05-20.md`

> **Важно:** документ принимает решение по числам, но финальный sign-off — Полат + Азим вместе. Если Азим выставит оценки заметно отличные — пересчитать средние.

---

## 1. Контекст

Команда (Полат + Азим) к moment-у запуска должна закрыть три открытых брендовых вопроса:

1. **Имя продукта** — оставляем «Savdo» или меняем?
2. **Палитра** — четыре варианта в работе у Азима, нужно зафиксировать одну.
3. **Логотип** — направление визуала.

Текущее состояние:
- В коде / domain `.uz` зарезервировано имя **Savdo** (`savdo.uz/<slug>`).
- В `docs/brand/README.md` зафиксирован v1 палитры — terracotta + cream.
- Логотип — заглушки `logo-wordmark.svg`, `logo-monogram-s.svg`.

Триггер: до публичного launch < 4 недель. Дальше менять имя / палитру = breaking change для пользователей и SEO.

---

## 2. Часть 1: NAME

### 2.1 Критерии и веса

| # | Критерий | Вес | Почему |
|---|----------|-----|--------|
| C1 | Memorability | 0.20 | первый touch определяет, вспомнит ли seller через неделю |
| C2 | UZ-fit | 0.15 | продукт ТОЛЬКО для UZ — резонанс с локалью критичен |
| C3 | Ownability / domain | 0.15 | `.uz` + `.com` свободны? SEO conflict? |
| C4 | Brand-storytelling | 0.15 | можно ли построить нарратив (что значит, откуда) |
| C5 | Pronunciation ru+uz | 0.10 | bilingual market — оба должны произнести с первого раза |
| C6 | SEO competition | 0.10 | низкая конкуренция = быстрый ранжинг |
| C7 | Simplicity to type | 0.10 | mobile keyboard — диакритика дороже |
| C8 | B2B + B2C dual fit | 0.05 | sellers (B2B) и buyers (B2C) видят одно имя |
| **Σ** | | **1.00** | |

### 2.2 Кандидаты

1. **Savdo** (current, ru+uz: «торговля»)
2. **Doʻkon** (uz: «магазин»)
3. **Doʻkonim** (uz: «мой магазин»)
4. **Sotuv** (uz: «продажа»)
5. **Tijorat** (uz: «коммерция»)
6. **Bozor** (uz/ru: «базар»)
7. **Telegro** (искусственное, telegram + грузия/торговля)

### 2.3 Scoring

| Critic (вес) | Savdo | Doʻkon | Doʻkonim | Sotuv | Tijorat | Bozor | Telegro |
|---|---|---|---|---|---|---|---|
| C1 Memorability (0.20)         | 8 | 7 | 6 | 6 | 6 | 9 | 5 |
| C2 UZ-fit (0.15)               | 9 | 9 | 9 | 8 | 7 | 9 | 4 |
| C3 Ownability/domain (0.15)    | 8 | 5 | 6 | 6 | 4 | 3 | 9 |
| C4 Brand-storytelling (0.15)   | 9 | 6 | 7 | 5 | 6 | 7 | 4 |
| C5 Pronunciation ru+uz (0.10)  | 10| 6 | 5 | 8 | 7 | 10| 7 |
| C6 SEO competition (0.10)      | 7 | 4 | 6 | 6 | 3 | 2 | 9 |
| C7 Simplicity to type (0.10)   | 10| 6 | 5 | 9 | 8 | 10| 8 |
| C8 B2B+B2C dual fit (0.05)     | 9 | 7 | 6 | 7 | 8 | 7 | 6 |
| **Weighted Σ** | **8.55** | **6.45** | **6.45** | **6.65** | **5.95** | **6.95** | **5.95** |

### 2.4 Обоснование оценок (1 строка)

**Savdo:**
- C1 (8) — короткое, 5 букв, knigobyl-ассоциация с торговлей
- C2 (9) — литературное слово, понятно и узбекам и русским
- C3 (8) — savdo.uz уже наш, `.com` занят но не critical (UZ-only бренд)
- C4 (9) — «торговля» — нейтральный, чистый story-fundament, любая narrative-обёртка ложится
- C5 (10) — нет диакритики, читается одинаково в ru/uz
- C6 (7) — слово общее, но SEO-comp на UZ-рынке низкий
- C7 (10) — латиница, без апострофа
- C8 (9) — «торговля» нейтрально звучит и для seller, и для buyer

**Doʻkon:**
- C1 (7) — узнаваемое, но «магазин» — generic
- C2 (9) — родное узбекское
- C3 (5) — апостроф `ʻ` ломает domain (`do'kon.uz` → `dukon.uz`?), путаница
- C4 (6) — «магазин» — описание, не имя бренда
- C5 (6) — русскоязычные путают «дукон / дёкон / докон»
- C6 (4) — много магазинов с этим словом в названии
- C7 (6) — апостроф = две клавиши на mobile
- C8 (7) — для seller'а ок, для buyer'а «магазин» нейтрально

**Doʻkonim:**
- C1 (6) — длиннее, посессив «мой» добавляет ноту, но фрикативу
- C2 (9) — родное
- C3 (6) — `dokonim.uz` свободен предположительно, но та же апостроф-проблема
- C4 (7) — «мой магазин» = good for seller-side storytelling, но не для buyer'а
- C5 (5) — длиннее, ru-произношение спотыкается
- C6 (6) — менее загружено
- C7 (5) — 8 знаков + апостроф
- C8 (6) — seller-leaning, buyer-side плохо («мой магазин Azim'а — а я причём?»)

**Sotuv:**
- C1 (6) — простое, но «продажа» — sales-словарь
- C2 (8) — узбекское
- C3 (6) — `sotuv.uz` вероятно свободен
- C4 (5) — продажа = transactional, не для бренда
- C5 (8) — простое произношение
- C6 (6) — средняя загруженность
- C7 (9) — 5 латинских букв
- C8 (7) — seller-fit, buyer хуже («продажа» = продают мне)

**Tijorat:**
- C1 (6) — длинное, литературное
- C2 (7) — арабизм, скорее литературный
- C3 (4) — есть Tijorat Bank — конфликт
- C4 (6) — «коммерция» — формальное
- C5 (7) — ti-jo-rat, ок
- C6 (3) — конкуренция с банком очень высокая
- C7 (8) — 7 букв
- C8 (8) — нейтрально

**Bozor:**
- C1 (9) — bazar — слово знают все, instant memorability
- C2 (9) — родное
- C3 (3) — bozor.uz занят, .com занят — крупные players в FMCG
- C4 (7) — «базар» — strong association, но MAY конфликтовать с маркетплейс-image («неорганизованный»)
- C5 (10) — bo-zor, проще не бывает
- C6 (2) — слово используется тысячами компаний
- C7 (10) — 5 букв
- C8 (7) — buyer-friendly, seller — слабее («я на базаре?»)

**Telegro:**
- C1 (5) — искусственное, не цепляет
- C2 (4) — звучит чужим
- C3 (9) — почти наверняка свободно во всех зонах
- C4 (4) — придётся объяснять что значит
- C5 (7) — te-le-gro, читается
- C6 (9) — uniquely findable
- C7 (8) — 7 латинских букв
- C8 (6) — нейтрально-непонятно

### 2.5 Ранжирование NAME

| Rank | Name | Score | Δ от winner |
|------|------|-------|-------------|
| 1 | **Savdo** | **8.55** | — |
| 2 | Bozor | 6.95 | −1.60 |
| 3 | Sotuv | 6.65 | −1.90 |
| 4 | Doʻkon | 6.45 | −2.10 |
| 4 | Doʻkonim | 6.45 | −2.10 |
| 6 | Tijorat | 5.95 | −2.60 |
| 6 | Telegro | 5.95 | −2.60 |

**Sanity:**
- Winner ≥ 6.0 ✅ (8.55)
- Разрыв с #2 ≥ 0.5 ✅ (1.60)
- Нет красных must-pass ниже 4 ✅

**Решение по NAME: SAVDO** (статус-кво подтверждён по числам, не по инерции).

---

## 3. Часть 2: PALETTE

### 3.1 Критерии и веса (другие, под визуал)

| # | Критерий | Вес | Почему |
|---|----------|-----|--------|
| P1 | UZ-cultural resonance | 0.20 | палитра должна «чувствовать» local |
| P2 | Differentiation от Uzum/OLX | 0.15 | избегаем зелёного / оранжевого |
| P3 | Accessibility (WCAG AA) | 0.15 | контраст текст/фон ≥ 4.5:1 |
| P4 | Warm vs cold balance | 0.15 | savdo = warm bazaar, не cold SaaS |
| P5 | Web → mobile transfer | 0.10 | работает на Telegram WebApp |
| P6 | Print / merch transfer | 0.10 | визитки, наклейки, упаковка |
| P7 | Long-term wear (не устареет) | 0.10 | живёт 3+ года без re-brand |
| P8 | Implementation cost | 0.05 | tokens уже в коде = low |
| **Σ** | | **1.00** | |

### 3.2 Кандидаты

A. **Indigo + amber** — modern fintech-coded (Stripe / Linear vibe)
B. **Sapphire + coral** — bright dual contrast (Notion-light vibe)
C. **Olive + wheat** — earthy muted (Ottolenghi / slow-living)
D. **Terracotta + cream** — текущий v1, уже в коде buyer

### 3.3 Scoring PALETTE

| Critic (вес) | A Indigo+amber | B Sapphire+coral | C Olive+wheat | D Terracotta+cream |
|---|---|---|---|---|
| P1 UZ-cultural (0.20)    | 5 | 6 | 7 | 9 |
| P2 Differentiation (0.15)| 7 | 6 | 8 | 9 |
| P3 Accessibility (0.15)  | 8 | 7 | 6 | 8 |
| P4 Warm balance (0.15)   | 4 | 7 | 7 | 9 |
| P5 Web→mobile (0.10)     | 8 | 7 | 7 | 8 |
| P6 Print/merch (0.10)    | 6 | 7 | 8 | 9 |
| P7 Long-term wear (0.10) | 6 | 5 | 8 | 8 |
| P8 Impl cost (0.05)      | 3 | 3 | 4 | 10 |
| **Weighted Σ** | **6.05** | **6.35** | **7.05** | **8.65** |

### 3.4 Обоснование (1 строка)

**A Indigo+amber:**
- P1 (5) — fintech-coded, читается как «европейский SaaS», не UZ
- P4 (4) — indigo холодный, противоречит warm bazaar
- P8 (3) — придётся переписать все globals.css в web-buyer + web-seller

**B Sapphire+coral:**
- P1 (6) — нейтрально
- P2 (6) — coral может конфликтовать с OLX-оранжевым в восприятии
- P4 (7) — coral тёплый, sapphire balance

**C Olive+wheat:**
- P1 (7) — earth-tones имеют локальный резонанс (плов, пшеница)
- P7 (8) — earthy = вне-трендовое, долго не устареет
- P4 (7) — теплее A, но olive муторно tinted

**D Terracotta+cream:**
- P1 (9) — terracotta = глина, керамика, плов, чайханы — direct UZ-bazaar resonance
- P2 (9) — никто из конкурентов не использует
- P4 (9) — самая warm из всех
- P8 (10) — уже в коде, no migration

### 3.5 Ранжирование PALETTE

| Rank | Palette | Score | Δ от winner |
|------|---------|-------|-------------|
| 1 | **Terracotta + cream (D)** | **8.65** | — |
| 2 | Olive + wheat (C) | 7.05 | −1.60 |
| 3 | Sapphire + coral (B) | 6.35 | −2.30 |
| 4 | Indigo + amber (A) | 6.05 | −2.60 |

**Решение по PALETTE: TERRACOTTA + CREAM (D)** — подтверждение audit-победителя.

---

## 4. Часть 3: LOGO DIRECTION

### 4.1 Критерии и веса

| # | Критерий | Вес | Почему |
|---|----------|-----|--------|
| L1 | Standalone recognizability | 0.20 | favicon 16×16, app icon без текста |
| L2 | Wordmark integration | 0.15 | работает рядом с «Savdo» wordmark |
| L3 | Scale resilience (16 → 512) | 0.15 | favicon ↔ billboard |
| L4 | Cultural meaning | 0.15 | связь с UZ / торговлей |
| L5 | Uniqueness (нет копий) | 0.10 | не похож на Uzum / OLX / Stripe |
| L6 | Versatility (1-color / multicolor) | 0.10 | работает в monochrome |
| L7 | Production cost / iteration | 0.10 | сколько часов до финала |
| L8 | Future-proofing (через 5 лет) | 0.05 | не выглядит trendy-2026 |
| **Σ** | | **1.00** | |

### 4.2 Кандидаты

A. **Monogram «S»** — стилизованная буква (Stripe / Spotify / Slack pattern)
B. **Paper plane + bag** — символ «доставка из Telegram»
C. **Wordmark only** — типографика, без символа (Linear / Vercel)
D. **Ornament** — узбекский геометрический орнамент (звезда, рапид)
E. **Mascot** — character / animal (Duolingo / Mailchimp)

### 4.3 Scoring LOGO

| Critic (вес) | A Monogram | B Plane+bag | C Wordmark | D Ornament | E Mascot |
|---|---|---|---|---|---|
| L1 Recognizability (0.20)   | 9 | 7 | 5 | 8 | 9 |
| L2 Wordmark integration (0.15)| 9 | 7 | 10| 7 | 5 |
| L3 Scale 16→512 (0.15)      | 9 | 6 | 7 | 8 | 4 |
| L4 Cultural meaning (0.15)  | 5 | 6 | 5 | 9 | 6 |
| L5 Uniqueness (0.10)        | 6 | 5 | 6 | 9 | 7 |
| L6 Versatility 1-col (0.10) | 9 | 6 | 9 | 7 | 4 |
| L7 Production cost (0.10)   | 9 | 6 | 10| 5 | 3 |
| L8 Future-proof (0.05)      | 8 | 5 | 9 | 9 | 4 |
| **Weighted Σ** | **7.95** | **6.20** | **7.10** | **7.80** | **5.80** |

### 4.4 Обоснование (1 строка)

**A Monogram:**
- L1 (9) — буква S как стилизация bazaar-арки или wordmark-flag-а — узнаваемо в 16×16
- L3 (9) — векторно масштабируется идеально
- L4 (5) — generic, не даёт UZ-resonance сам по себе, ДА — даёт через цвет (terracotta)
- L7 (9) — у нас уже starter SVG (`logo-monogram-s.svg`)

**B Paper plane + bag:**
- L1 (7) — два объекта на маленьком scale смешиваются
- L4 (6) — telegram-association + покупка
- L5 (5) — есть много fintech-ов с paper-plane, не unique

**C Wordmark only:**
- L1 (5) — без символа slabaya favicon
- L2 (10) — wordmark есть wordmark
- L7 (10) — уже готов в `logo-wordmark.svg`
- L4 (5) — пустой канал на cultural meaning

**D Ornament:**
- L4 (9) — узбекская звезда / рапид / pakhta — direct UZ
- L5 (9) — никто из tech UZ-стартапов не делал
- L7 (5) — нужен дизайнер с этно-экспертизой, итераций много
- L3 (8) — сложность детали ↓ на маленьком scale

**E Mascot:**
- L1 (9) — характер запоминается мгновенно
- L3 (4) — на 16×16 теряется
- L6 (4) — нельзя сжать в 1-color без потери
- L7 (3) — самый дорогой в производстве

### 4.5 Ранжирование LOGO

| Rank | Direction | Score | Δ от winner |
|------|-----------|-------|-------------|
| 1 | **A Monogram «S»** | **7.95** | — |
| 2 | D Ornament | 7.80 | −0.15 ⚠️ |
| 3 | C Wordmark only | 7.10 | −0.85 |
| 4 | B Paper plane + bag | 6.20 | −1.75 |
| 5 | E Mascot | 5.80 | −2.15 |

**⚠️ Sanity-флаг:** разрыв A vs D = 0.15 < 0.5 → формально требуется обсуждение.

**Резолюция:** комбинировать. Logo direction = **A Monogram «S» + D Ornament-accent**. То есть основной знак — монограмма S, но её внутренняя геометрия / отрицательное пространство построено на узбекском орнаментальном паттерне (звезда / рапид). Это даёт max и L1 (узнаваемость), и L4 (cultural meaning).

---

## 5. ФИНАЛЬНАЯ РЕКОМЕНДАЦИЯ

| Слот | Победитель | Score |
|------|------------|-------|
| **Name** | **Savdo** | 8.55 |
| **Palette** | **Terracotta + cream (D)** | 8.65 |
| **Logo direction** | **Monogram «S» с ornament-accent в negative space** | 7.95 (А) + опционально D 7.80 |

### Brand-formula

> **Savdo. Тёплая bazaar-эстетика в terracotta+cream. Монограмма S с узбекским ornament-accent в негативном пространстве.**

### Воплощение

- **Wordmark** — «Savdo» в Inter cv11 ss01, weight 600, color = `colors.brand` (terracotta `#7C3F2E`).
- **Monogram «S»** — vector, окружённый orn-pattern в negative space (звезда / рапид).
- **Favicon / app icon** — monogram only on terracotta background.
- **CTA-цвет** — terracotta, cream — surface.

### Что НЕ делаем

- Не меняем имя на Doʻkon / Bozor / другое — формальный score Savdo +1.60 minimum от любого конкурента.
- Не делаем mascot — provисал по L3 и L6, дорог в производстве.
- Не делаем pure ornament без monogram — слишком специфично для favicon-scale.

---

## 6. Расхождения оценок (для итерации с Азимом)

Этот документ заполнен Полатом (с учётом дизайн-аудита). Перед финализацией:

- [ ] Азим перечитывает §2.3, §3.3, §4.3 и выставляет свои 0–10.
- [ ] Если расхождение > 3 балла в любой ячейке → обсуждение.
- [ ] Усреднённые финальные scores → ADR.

Если scoring Азима подтверждает топ-3 (даже с разной точностью) → выбор финальный, можно идти в ADR.

---

## 7. Next steps

- [ ] Sync с Азимом — финализация scoring (асинхронно в TG)
- [ ] ADR-008: `docs/adr/ADR-008_brand-identity-v1.md` (name + palette + logo direction)
- [ ] Brief дизайнеру monogram «S» с ornament negative space
- [ ] Обновить `docs/brand/logo-spec.md` с финальным направлением
- [ ] Резерв доменов: убедиться `savdo.uz` (есть), проверить `savdo.app`, `savdo.io`
- [ ] Obsidian: `pwsh obsidian-note.ps1 decision savdo-builder "Brand v1 finalized" "Name=Savdo (score 8.55), Palette=Terracotta+cream (8.65), Logo=Monogram S + ornament accent (7.95). Almost-tie с D Ornament разрешён комбинацией."`
- [ ] Review-точка: 2026-11-20 (через 6 месяцев) — проверить: жалуются на имя? путают палитру с конкурентами?

---

## 8. Связанные документы

- [`framework.md`](framework.md) — методология scoring
- [`templates/scoring-matrix.md`](templates/scoring-matrix.md) — шаблон, по которому построен этот файл
- [`templates/adr.md`](templates/adr.md) — формат итогового ADR
- [`../brand/README.md`](../brand/README.md) — brand book v1 (источник палитры)
- [`../adr/`](../adr/) — куда пойдёт ADR-008
