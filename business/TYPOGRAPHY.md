# Savdo — Typography

> Шрифты + размеры по 4 продуктам. Источник: tailwind.config + index.css.

---

## 1. Font Stacks — system fonts везде

**Не подключаем web-fonts** (CDN-ы, замедление LCP). Используем system-fonts:

### TMA + Web-buyer (warm) + Web-seller (cool)
```css
font-family:
  'SF Pro Rounded',        /* Apple iOS — rounded UI font */
  -apple-system,
  BlinkMacSystemFont,
  ui-rounded,
  'Helvetica Neue',
  system-ui,
  sans-serif;
```

### Admin
```css
font-family:
  ui-sans-serif,
  system-ui,
  -apple-system,
  BlinkMacSystemFont,
  'Segoe UI',
  sans-serif;
```

### Monospace (audit logs, hashes, order numbers)
```css
font-family:
  ui-monospace,
  'SF Mono',
  Menlo,
  Consolas,
  monospace;
font-variant-numeric: tabular-nums;  /* для счётчиков и таймеров */
```

---

## 2. Scale — TMA (CSS-vars, desktop 1.05× override)

| Token | Mobile | Desktop ≥1024 | Tailwind |
|-------|--------|---------------|----------|
| `--t-xxs`  | 11px | 11.5px | `text-xxs` |
| `--t-xs`   | 12px | 12.5px | `text-xs` |
| `--t-sm`   | 13px | 13.5px | `text-sm` |
| `--t-base` | 14px | 14.5px | `text-base` |
| `--t-lg`   | 16px | 17px   | `text-lg` |
| `--t-xl`   | 18px | 19px   | `text-xl` |
| `--t-2xl`  | 22px | 23px   | `text-2xl` |

**Migrate map** (для миграции хардкодов в коде):

```
text-[10px] / text-[11px] → text-xxs
text-[12px]               → text-xs
text-[13px]               → text-sm
text-[14px]               → text-base       (default)
text-[15-16px]            → text-lg
text-[18+px]              → text-xl
```

---

## 3. Scale — Admin (Tailwind v4 defaults)

| Class | px | Use case |
|-------|----|----|
| `text-xs`   | 12 | Meta, timestamps, hint |
| `text-sm`   | 14 | Body, table cells |
| `text-base` | 16 | Buttons, labels |
| `text-lg`   | 18 | Section headers |
| `text-xl`   | 20 | Page title |
| `text-2xl`  | 24 | Hero |

---

## 4. Scale — Web (Soft Color Lifestyle + Liquid Authority)

| Token | Size | Web-buyer | Web-seller |
|-------|------|-----------|------------|
| **xs** | 12 | meta info | label/hint |
| **sm** | 14 | body | body |
| **base** | 16 | default | default |
| **lg** | 18 | section title | section title |
| **xl** | 20 | h2 | h2 |
| **2xl** | 24 | h1 | h1 |
| **3xl** | 30 | hero (marketing) | rare |

---

## 5. Line Heights

| Использование | line-height |
|---------------|-------------|
| Headings (xl+) | 1.2-1.35 |
| UI labels (sm-base) | 1.45-1.5 |
| Body text (sm-base) | 1.5-1.6 |
| Meta (xs/xxs) | 1.4-1.45 |

---

## 6. Font Weights

| Weight | Use case |
|--------|----------|
| **400** (regular) | body, descriptions |
| **500** (medium) | labels, hints |
| **600** (semibold) | section titles, important meta |
| **700** (bold) | h1/h2, primary CTA, prices |

**Не используем** light (300) или thin (100-200) — плохо читается в TG WebView
и на маленьких экранах.

---

## 7. Numerics

**Цены, счётчики, even-spaced columns** — обязательно `tabular-nums`:

```css
.price { font-variant-numeric: tabular-nums; }
```

Узбекский / русский / английский — пробел как тысячный разделитель:
`1 000 000 soʻm` / `1 000 000 сум` (НЕ запятая).

Локализация через `toLocaleString(locale === 'uz' ? 'uz' : 'ru')`.

---

## 8. Letter Spacing

| Контекст | tracking |
|----------|----------|
| Section labels (uppercase) | `tracking-widest` (0.1em) |
| Headings | default |
| Body | default |
| `<kbd>` элементы | `font-mono` без tracking |

---

## 9. Don'ts

- ❌ НЕ использовать кастомные web-fonts через `@import` (медленный LCP)
- ❌ НЕ ставить `font-size: 10px` или меньше (a11y, Apple HIG)
- ❌ НЕ ставить `font-weight: 300` для body (плохо в TG)
- ❌ НЕ комбинировать `text-shadow` + gradient text (читаемость)
- ❌ НЕ использовать `text-[Npx]` хардкоды (не масштабируется light/desktop)
