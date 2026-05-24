# ADR-008 — Brand name `maxsavdo`, domain `maxsavdo.uz`

**Дата:** 2026-05-22
**Статус:** Accepted

## Контекст

`savdo.uz` занят (триггер ребрендинга). Команда (Полат + Азим) рассмотрела
несколько раундов кандидатов:

- **Round 1** (`docs/decisions/platform-rename-shortlist-round1-2026-05-21.md`):
  scoring-based матрица 8 кандидатов (OlSot, Bizniki, Anorbozor, Soddabozor,
  Dukonim, Bizbozor, Sotbozor, Karvonbozor). Победитель по числам OlSot 8.95.
  **Отклонён Азимом** («не впечатляет»).
- **Round 2 (отменён в процессе)** — UZ-craft / heritage слова (Doppi, Suzani,
  Adras, Naqsh) — все короткие `.com` заняты domain-инвесторами. Концепт
  «Boqcham» получил скоринг 8.20, тоже отклонён («что за хуйня»).
- **Round 3** — модерн-tech wave (Diyor, Tarmoq, Almash, ...). Все короткие
  `.uz` или `.com` заняты или премиум.
- **Финальная итерация** — Полат предложил `maxsavdo` (max + savdo, mass
  concept). Подтверждено свободно на reg.uz: **`maxsavdo.uz`**.
- Параллельный список Азима (`analiz/brand-name-candidates.md`): MassMarket,
  MassSeller, Arvex, AuraShop. `maxsavdo` оценен как лучший компромисс —
  сохраняет «savdo»-наследие, добавляет «mass»-смысл.

## Решение

**Имя бренда:** `maxsavdo`
**Основной домен:** `maxsavdo.uz`
**Дополнительный:** `maxsavdo.com` (берём, если свободен — для международных
коммуникаций и redirect к `.uz`)

### Обоснование

| Критерий | Оценка |
|----------|--------|
| **Mass concept** | ✅ `max` сразу читается как «максимум, большой ассортимент» |
| **UZ-fit** | ✅ Сохраняет «savdo» — узнаваемый узбекский корень |
| **Произношение** | ✅ Идентично ru/uz/en — «макс-савдо» |
| **Длина** | ✅ 8 букв — приемлемо |
| **Domain доступность** | ✅ `maxsavdo.uz` свободен (подтверждено) |
| **Не workaround** | ✅ Полноценное слово, не «mssavdo» / «mcsavdo» |
| **Brand identity на палитре** | ✅ Совместимо с Soft Color Lifestyle (terracotta+cream) Азима |

### Что меняется

- Все упоминания «Savdo» в брендинге → `maxsavdo`
- Wordmark в логотипе (см. `docs/brand/logo-spec.md`) — обновить
- Маркетинговые тексты, landing-pages — `maxsavdo`
- Email-домены: `support@maxsavdo.uz`, `privacy@maxsavdo.uz` (после регистрации
  бизнес-почты)
- `<html lang>` остаётся (язык, не бренд)

### Что НЕ меняется

- **Папка репо** `savdo-builder/` — оставляем (cosmetic rename = большой effort,
  не стоит). Внутренние module-names тоже не трогаем.
- **`@savdo_builderBOT`** — Telegram-бот username привязан к платформе, рефакторинг
  bot username = boilerplate. Оставляем, можно в будущем мигрировать к
  `@maxsavdo_bot`.
- **API base URL** `savdo-api-production.up.railway.app` — Railway service
  rename позже, не блокер.
- **Доменные модели** в коде (`Store`, `Product`, etc.) — НЕ касаются бренда.

## Альтернативы (рассмотрены и отклонены)

- **Сохранить «Savdo»** — `.uz` занят, плохая SEO-история на чужой домен.
- **OlSot** (Round 1 winner) — Азим: «не впечатляет».
- **Boqcham** (Round 2 winner) — Полат сам: «что за хуйня».
- **MassMarket / MassSeller** (Азим из brand-name-candidates) — generic, не
  UZ-rooted, conflict с возможными trademark в EN-зоне.
- **Arvex** — coined, отсутствует mass-смысл, не resonate с UZ-аудиторией.
- **AuraShop** — generic, занято в EN-зоне.
- **mcsavdo / mssavdo** — workaround-prefix вокруг занятого `msavdo.uz`, MS-связи
  с Microsoft, плохое UX.

## Последствия

### Положительные
- Имя bookable + domain свободен → запуск не блокируется.
- «Savdo»-наследие сохраняется → не теряем уже сформированной mental association
  с продуктом.
- Mass concept позиционирует против Uzum/Olcha (узкоспециализированные
  «маркетплейс электроники», «маркетплейс еды») — у нас «всё для малых».

### Отрицательные / риски
- 8 букв — длиннее чем Uzum (4) или Olcha (5).
- `max-` префикс уже используется multiple brands (Maxi, MaxStore, MaxiMart) —
  не уникально, но и не conflict.
- Если будем международно расширяться — `maxsavdo` нерусскоязычной аудитории
  бессмысленно. Mitigation: возможен domain `maxsavdo.com` + suffix-translation
  («maxsavdo: marketplace builder for Telegram»).

## Migration plan

1. ✅ `maxsavdo.uz` купить (Полат, до конца этой недели)
2. ✅ `maxsavdo.com` проверить и купить если свободен
3. Обновить `docs/brand/`, `docs/business/`, `docs/decisions/` — убрать
   «working name» disclaimer
4. Обновить `docs/brand/logo-spec.md` wordmark draft → `maxsavdo`
5. После регистрации ИП/ООО + бизнес-почты — `support@maxsavdo.uz` etc.
6. Перед public launch — landing page на `maxsavdo.uz` с redirect от старых
   URL'ов.
7. Bot username миграция — не сейчас, отдельный тикет в Phase 2.

## Связано

- `analiz/brand-name-candidates.md` — список кандидатов
- `docs/decisions/platform-rename-shortlist-round1-2026-05-21.md` — Round 1
- `docs/decisions/brand-selection-2026-05-20.md` — pre-Savdo scoring
- `docs/decisions/business-plan-v1-2026-05-22.md` — бизнес-план под maxsavdo
- `docs/business/business-plan-v1-2026-05-22.html` — visual версия
- `docs/brand/brand-book.md` — обновить wordmark color на terracotta
