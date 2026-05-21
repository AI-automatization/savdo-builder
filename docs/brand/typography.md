# Savdo — Typography

**Версия:** 1.0 · **Дата:** 2026-05-20

---

## 1. Шрифт — Inter

**Primary font:** Inter (variable).

**Source of truth (код):** `apps/web-buyer/src/app/layout.tsx` (использует `next/font/google`).

```ts
// apps/web-buyer/src/app/layout.tsx
import { Inter } from "next/font/google";
const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
});
```

```css
/* apps/web-buyer/src/app/globals.css */
body {
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
}
```

### Почему Inter

| Критерий | Inter | Manrope | Roboto | system-ui |
|----------|-------|---------|--------|-----------|
| Латиница UZ + кириллица RU | ✅ оба subsets | ✅ | ✅ | ⚠️ зависит от ОС |
| Узб. apostrof `ʻ` (U+02BB) | ✅ корректно | ⚠️ хуже kern | ✅ | ⚠️ |
| Tabular-nums (цены) | ✅ `tnum` ssXX | ✅ | ✅ | ⚠️ |
| Character variants (`cv11 ss01`) | ✅ extensive | ⚠️ ограничено | ❌ | ❌ |
| Variable font (weight) | ✅ 100-900 | ✅ 200-800 | ❌ статичные | ❌ |
| Bundle size (1 weight + variable) | ~50 KB woff2 | ~45 KB | ~40 KB | 0 (system) |
| Узнаваемость / character | средняя (хороший «нейтрал») | hipster, character | очень generic | случайная |
| UZ-марка использует | ⚠️ редко (мы будем редким случаем) | редко | повсюду | |

**Победитель — Inter:** баланс читаемости латиницы + кириллицы, корректная отрисовка узб. apostrof, character variants для тонкой настройки (`cv11` — альтернативный l, `ss01` — однонаправленные кавычки), нейтральный character который не «кричит» — поддерживает retail-warmth.

### Fallback stack

```css
font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI",
             Roboto, system-ui, sans-serif;
```

**Зачем fallback:** если Inter не загрузился (slow 3G / Iran-block / cache miss) — система покажет нативный sans-serif. На iOS — SF Pro, на Android — Roboto, на Windows — Segoe UI. Все три приличные. **Не использовать Times / serif fallback.**

---

## 2. Двуязычие — RU + UZ

### Узбекская латиница — критическое

Узбекистан с 2023 года официально перешёл на латиницу. Мы используем **только латиницу** в uz-копи, не кириллицу.

**Специальные символы:**
- `ʻ` — U+02BB **MODIFIER LETTER TURNED COMMA**, используется в Oʻzbekiston, foʻq, oʻquv
- `ʼ` — U+02BC **MODIFIER LETTER APOSTROPHE**, используется в boʼlim (необязательно — некоторые слова без `ʼ` тоже валидны)

**КРИТИЧЕСКИ ВАЖНО:**
- **Никогда** `'` (U+0027 ASCII apostrophe — обычная клавиатурная)
- **Никогда** `'` (U+2019 right single quotation mark — Word auto-correct)
- **Никогда** `'` (U+2018 left single quotation mark)

Inter правильно отрисовывает `ʻ` U+02BB и `ʼ` U+02BC в обоих размерах и весах. Проверено glyph-coverage. Manrope и Roboto тоже OK, system-ui — зависит от системы (на Windows старых может быть пустой квадрат).

**Тестовая строка для проверки рендера:**

```
Oʻzbekiston Respublikasi · foʻq · zoʻr · soʻm · boʼlim · oʻquv
```

Если шрифт не поддерживает `ʻ` — увидишь tofu (□). В Inter — увидишь правильную одинарную модификаторную запятую с правильным kern.

### Кириллица для RU

Inter subset `cyrillic` — полный (вся кириллическая базовая зона + расширения).

**Тестовая строка:**

```
Здравствуйте · 1 250 000 сум · Корзина · Заказ № 142 · Ёлки
```

Особое внимание к `ё` — некоторые шрифты её не имеют, и она deграждируется до `е`. Inter — есть.

### Mixed-language UI

Часто на одном экране и ru, и uz (например, language toggle, multi-region listing). Inter одинаково отрисовывает оба subsets, без визуального разрыва (нет переключения шрифта на полпути строки).

---

## 3. Type scale

База — `16px = 1rem`. Все размеры в `rem` для accessibility (пользователь может увеличить шрифт системы).

| Token | Size | Line-height | Tracking | Weight (default) | Использование |
|-------|------|-------------|----------|------------------|--------------|
| `display` | 3.5rem (56px) | 1.05 | -0.02em | 700 bold | hero h1 landing, не используется в app |
| `h1` | 2rem (32px) | 1.15 | -0.015em | 700 bold | page title (storefront home, settings) |
| `h2` | 1.5rem (24px) | 1.2 | -0.01em | 700 bold | section title |
| `h3` | 1.25rem (20px) | 1.25 | -0.005em | 600 semibold | card title, store name |
| `h4` | 1.125rem (18px) | 1.3 | 0 | 600 semibold | product card title, list section |
| `body-lg` | 1.0625rem (17px) | 1.55 | 0 | 400 regular | reading-flow body, long descriptions |
| `body` | 1rem (16px) | 1.5 | 0 | 400 regular | default body |
| `body-sm` | 0.875rem (14px) | 1.5 | 0 | 400 regular | secondary body, help text, footer |
| `caption` | 0.75rem (12px) | 1.4 | 0.01em | 500 medium | captions, micro-labels (rare) |
| `overline` | 0.6875rem (11px) | 1.3 | 0.18em | 600 semibold uppercase | section eyebrow «— ПЕРЕЙТИ В МАГАЗИН» |
| `mono` | 0.875rem (14px) | 1.5 | 0 | 400 monospace | code, slug `savdo.uz/<slug>` |

### Применение через Tailwind

Web-buyer уже использует tailwind-классы вида `text-2xl`, `text-base`, `text-sm` — это маппится 1:1 на нашу scale:

| Tailwind | Token | Size |
|----------|-------|------|
| `text-4xl` | display | 36px (можно использовать вместо 56px display на странице — компромисс) |
| `text-3xl` | h1 | 30px (приближение) |
| `text-2xl` | h2 | 24px |
| `text-xl` | h3 | 20px |
| `text-lg` | h4 | 18px |
| `text-base` | body | 16px |
| `text-sm` | body-sm | 14px |
| `text-xs` | caption | 12px |
| `text-[11px]` | overline | 11px (custom) |

---

## 4. Hierarchy rules

### Headings

1. **Один `h1` на страницу.** Все остальные — `h2/h3/h4`.
2. **`h1` всегда в `--color-text-strong`** (`#1F1A12` light / `#F5EFE3` dark), weight 700.
3. **Цена / value strong** = `font-bold` + `--color-text-strong`. Например, итоговая сумма заказа.
4. **Sub-text после heading** = `text-body` + `--color-text-body` (`#3D3525`).

### Body / paragraphs

1. **Body по умолчанию** = `text-base` + `--color-text-body` (`#3D3525` light). 16px, line-height 1.5.
2. **Long-form (карточки описания товара, страница «О магазине»):** `text-lg` (17px) для лучшей читаемости длинных абзацев. Line-height 1.55+.
3. **Не использовать `--color-text-primary` (`#1F1A12`) для длинных абзацев** — слишком высокий контраст утомляет глаз. Только для headings и important values.

### Muted / sub-text

- `--color-text-muted` (`#8A7D6A` light) — для labels, hints, secondary info, **только в размере ≥14px / bold** (WCAG 3.6:1 — AA Large).
- Если sub-text < 14px и normal weight — использовать `--color-text-body` (`#3D3525`), не muted.

### Numbers — tabular nums

Все ценники, итоги, балансы, счётчики используют tabular figures (моноширинные цифры). У Inter это feature `tnum`.

```css
.tabular { font-variant-numeric: tabular-nums; }
```

или Tailwind:

```html
<span class="tabular-nums">1 250 000</span>
```

**Почему важно:** в списке заказов цены выравниваются по правому краю столбиком. Без tabular-nums разные цифры имеют разную ширину, и `1 100 000` рядом с `1 250 000` дрожит.

---

## 5. Weights

Inter variable — все веса. Используем 4 уровня:

| Weight | Value | Использование |
|--------|-------|--------------|
| Regular | 400 | body, descriptions, default |
| Medium | 500 | secondary labels, captions с акцентом, navigation links |
| Semibold | 600 | h3/h4, card titles, button text, wordmark «Savdo» |
| Bold | 700 | h1/h2, important values, prices |

**Не используем:** 100/200/300 (light) — на cream-bg они теряются и режут читаемость. 800/900 (extra-bold/black) — overkill, тяжеловесно для retail-warmth.

---

## 6. Wordmark «Savdo» — типографическая спецификация

| Параметр | Значение |
|----------|----------|
| Font | Inter |
| Weight | 600 Semibold |
| Tracking | -0.01em |
| Color | `var(--color-brand)` (terracotta) |
| Letter case | Capital S, lowercase avdo — «Savdo» |
| Italic | Никогда |
| Underline | Никогда (кроме hover state в link-context — opciоnально) |

**Minimum size:** 14px (ниже — нечитаемо на mobile). Для favicon-сценариев — используем monogram, не wordmark.

**Пример HTML:**

```html
<span style="font: 600 24px/1 var(--font-inter); color: var(--color-brand); letter-spacing: -0.01em;">
  Savdo
</span>
```

**Tailwind:**

```html
<span class="font-semibold text-2xl tracking-tight" style="color: var(--color-brand)">
  Savdo
</span>
```

---

## 7. Special elements

### Overline / eyebrow

Используется в hero-секциях и section-headers как «верхняя строчка» перед заголовком.

```html
<span class="text-[11px] uppercase tracking-[0.18em] font-semibold" style="color: var(--color-brand)">
  — ПЕРЕЙТИ В МАГАЗИН
</span>
```

- Tracking `0.18em` — широкий, lifestyle-marketing look.
- Color — `brand` обычно, или `text-muted` для нейтральных секций.

### Price display

```html
<span class="text-base font-bold tabular-nums" style="color: var(--color-text-strong)">
  1 250 000
</span>
<span class="text-xs font-normal" style="color: var(--color-text-muted)">сум</span>
```

- Число — bold, tabular, strong.
- «сум» — small, muted, не отвлекает.
- **Разделитель тысяч — пробел ` ` (non-breaking space)**, не запятая. Это UZ-стандарт.

### Code / slug

```html
<code class="font-mono text-sm" style="color: var(--color-text-body)">
  savdo.uz/<span style="color: var(--color-brand)">lola-shop</span>
</code>
```

- Inter не имеет monospace варианта — используем системный mono fallback: `font-mono` в Tailwind = `ui-monospace, SFMono-Regular, "Liberation Mono", Menlo, Consolas, monospace`.

### Long-form description (страница товара / о магазине)

```html
<article class="max-w-prose text-[17px] leading-[1.55]" style="color: var(--color-text-body)">
  <p>Описание товара... первый абзац... 5-7 строк.</p>
  <p class="mt-4">Второй абзац...</p>
</article>
```

- `max-w-prose` (≈ 65ch) — оптимальная длина строки для чтения.
- Line-height 1.55 — длинный текст легче сканировать.
- Между абзацами `mt-4` (16px).

---

## 8. Telegram MainButton / WebApp

Telegram WebApp использует **системный шрифт устройства** для MainButton / SecondaryButton — переопределить нельзя.

```
iOS:     SF Pro
Android: Roboto
Desktop: Segoe UI / SF Pro
```

Это сознательное ограничение. В TMA-контенте (наш собственный HTML) — используем Inter как обычно. Только Telegram-нативные buttons остаются в system font. **Не пытаться накрыть Telegram MainButton своим шрифтом** — Telegram перерендерит.

---

## 9. Accessibility

### Размеры

- **Минимальный размер интерактивного текста:** 14px (1px = 0.875rem).
- **Минимальный размер декоративного текста:** 11px (0.6875rem) — только для overline / micro-labels.
- **Body — 16px** (1rem) — никогда не уменьшать body. Это базовая accessibility-планка.

### Line-height

- Body / paragraphs: **минимум 1.5** (WCAG SC 1.4.12 Text Spacing).
- Headings: **минимум 1.15** (потому что они короткие — large gaps смотрятся странно).

### Line-length

- **Optimal:** 60-75 characters per line (Tailwind `max-w-prose` ≈ 65ch).
- **Max:** 95 characters (Tailwind `max-w-[95ch]`). Шире — глаз теряет начало следующей строки.

### Letter-spacing

- **Body** — `0` (default Inter — уже оптимален).
- **Headings (≥ 24px)** — slight negative `-0.01em` to `-0.02em` (Inter на больших размерах смотрится swooshy без tightening).
- **Uppercase** — positive `0.05em` минимум, до `0.2em` для wide-marketing-eyebrow.

### Color contrast — см. `palette.md` секцию 7

---

## 10. CSS-tokens for typography

Готовы к копированию в `globals.css`:

```css
:root {
  /* Font families */
  --font-sans:  var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono:  ui-monospace, SFMono-Regular, "Liberation Mono", Menlo, Consolas, monospace;

  /* Sizes (rem-based, 16px = 1rem) */
  --text-display:  3.5rem;     /* 56px */
  --text-h1:       2rem;       /* 32px */
  --text-h2:       1.5rem;     /* 24px */
  --text-h3:       1.25rem;    /* 20px */
  --text-h4:       1.125rem;   /* 18px */
  --text-body-lg:  1.0625rem;  /* 17px */
  --text-body:     1rem;       /* 16px */
  --text-body-sm:  0.875rem;   /* 14px */
  --text-caption:  0.75rem;    /* 12px */
  --text-overline: 0.6875rem;  /* 11px */

  /* Line-heights */
  --leading-tight:    1.15;
  --leading-snug:     1.25;
  --leading-normal:   1.5;
  --leading-relaxed:  1.55;

  /* Tracking */
  --tracking-tight:   -0.015em;
  --tracking-normal:  0;
  --tracking-wide:    0.05em;
  --tracking-marketing: 0.18em;

  /* Weights */
  --font-regular:  400;
  --font-medium:   500;
  --font-semibold: 600;
  --font-bold:     700;
}
```

---

## 11. Чек-лист «типографически чистый экран»

- [ ] Один `h1` на страницу
- [ ] Body — `text-base` (16px), не меньше для интерактива
- [ ] Long-form (> 3 абзаца) — `text-lg` + `max-w-prose` + line-height 1.55
- [ ] Цены — `tabular-nums`, разделитель пробел ` `
- [ ] Узб. apostrof — `ʻ` U+02BB, не `'`
- [ ] Wordmark «Savdo» — semibold, terracotta, capital S
- [ ] Uppercase используется ≤ 4 слов подряд (capslock в копи запрещён)
- [ ] Italic — никогда на UI (только foreign-language вкрапления типа «in vivo», и то редко)
- [ ] Underline — только на hover для links

---

## 12. История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | v1. Inter зафиксирован. Scale 11/12/14/16/17/18/20/24/32/56. Узб. apostrof — обязательно `ʻ` U+02BB. |
