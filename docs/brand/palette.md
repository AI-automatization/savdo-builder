# Savdo — Palette

**Версия:** 1.0 · **Дата:** 2026-05-20
**Source of truth (код):** `apps/web-buyer/src/app/globals.css`

> Документ определяет полную цветовую систему Savdo: primary, surface, text, accent, semantic. Light + dark + контрастные пары + ready-to-paste CSS-токены.

---

## 1. Brand primary — Terracotta

Brand-цвет — **terracotta**. Тёплый, материальный, отсылает к глине, ремеслу, узбекской керамике (риштан, кашгар). Уникальный для UZ-рынка: ни один маркетплейс / банк / e-commerce платформа в UZ его не использует.

| Token | Light | Dark | Назначение |
|-------|-------|------|-----------|
| `--color-brand` | **`#7C3F2E`** | **`#A05A45`** | CTA fill, wordmark, primary brand surface |
| `--color-brand-hover` | `#6A3526` | `#B36850` | hover state CTA |
| `--color-brand-muted` | `rgba(124,63,46,0.06)` | `rgba(160,90,69,0.18)` | soft button bg, ghost CTA |
| `--color-brand-border` | `rgba(124,63,46,0.15)` | `rgba(160,90,69,0.42)` | ring, ghost CTA border, accent chip |
| `--color-brand-text-on-bg` | `#FBF7F0` | `#FFFFFF` | text/icon на brand-фоне |

**Логика дарка:** в light terracotta — тёмная (#7C3F2E, для печати на cream), в dark — поднята в lightness (#A05A45) чтобы оставаться различимой на тёмном фоне. Семейство сохраняется — оба warm-brown с red-undertone.

---

## 2. Tints / shades — полная шкала

Расширенная шкала Terracotta — для случаев, когда брендового `--color-brand` недостаточно (графики, чарты, иллюстрации, тонкие decorative-фоны). **В UI-компонентах используем только 5 brand-токенов выше**, а не шкалу — она для художественных задач.

### Terracotta (Light reference — `#7C3F2E` ≈ 600)

| Уровень | HEX | HSL | Использование |
|---------|-----|-----|--------------|
| 50  | `#FBF1ED` | hsl(14, 65%, 96%) | очень светлый soft-bg, illustration tint |
| 100 | `#F5DCD2` | hsl(15, 65%, 89%) | secondary chip bg, hover overlay |
| 200 | `#EBB8A4` | hsl(15, 65%, 78%) | illustration mid, secondary text on dark |
| 300 | `#DC8E73` | hsl(15, 60%, 65%) | decorative |
| 400 | `#C26B4F` | hsl(15, 53%, 53%) | chart secondary |
| 500 | `#A05A45` | hsl(15, 41%, 45%) | **brand dark-mode** |
| 600 | `#7C3F2E` | hsl(15, 46%, 34%) | **brand light-mode** ⭐ |
| 700 | `#6A3526` | hsl(15, 47%, 28%) | brand-hover light |
| 800 | `#532A1F` | hsl(15, 45%, 22%) | very dark surfaces, footer-bg |
| 900 | `#3A1D15` | hsl(15, 47%, 15%) | text on light terracotta surface |

Базовая логика: hue ≈ **15° (red-orange)**, saturation плавно падает с уровнем, lightness — основная переменная.

### Cream (neutral warm, `#FBF7F0` ≈ 50)

| Уровень | HEX | Использование |
|---------|-----|--------------|
| 50  | `#FBF7F0` | **app background light** ⭐ |
| 100 | `#F4EEE0` | **surface-sunken light** ⭐ |
| 150 | `#EFE8DA` | **border / divider light** ⭐ |
| 200 | `#E5DCC6` | secondary border |
| 300 | `#D8CFB8` | strong border, separator |
| 400 | `#B5A88E` | **text-dim light** ⭐ |
| 500 | `#8A7D6A` | **text-muted light** ⭐ |
| 600 | `#6B5F4E` | text body alternative |
| 700 | `#3D3525` | **text-body light** ⭐ |
| 800 | `#2A2418` | dark text |
| 900 | `#1F1A12` | **text-primary light** ⭐ |
| 950 | `#16120D` | **app background dark** ⭐ |

---

## 3. Surface palette (полная)

### Light

| Token | HEX | Использование |
|-------|-----|--------------|
| `--color-bg` | `#FBF7F0` | главный фон страницы |
| `--color-surface` | `#FFFFFF` | карточки, контент-блоки, инпуты |
| `--color-surface-muted` | `#FBF7F0` | вторичные секции (= bg, нюанс) |
| `--color-surface-elevated` | `#FFFFFF` | popovers, modals, dropdowns |
| `--color-surface-sunken` | `#F4EEE0` | inset cards (image-placeholder, sunken panels) |
| `--color-divider` | `#EFE8DA` | hr, structural separator |
| `--color-border` | `#EFE8DA` | inputs, buttons, cards |
| `--color-border-strong` | `#D8CFB8` | hover state border, focused outline |
| `--color-skeleton` | `#EFE8DA` | loading skeleton bg |

### Dark

| Token | HEX | Использование |
|-------|-----|--------------|
| `--color-bg` | `#16120D` | warm near-black, главный фон |
| `--color-surface` | `#221C16` | карточки (на 1 step светлее bg) |
| `--color-surface-muted` | `#1E1812` | между bg и surface |
| `--color-surface-elevated` | `#2A231C` | popovers, modals |
| `--color-surface-sunken` | `#100E09` | глубже bg, inset cards |
| `--color-divider` | `rgba(245,239,227,0.08)` | hr (warm-tan-alpha) |
| `--color-border` | `rgba(245,239,227,0.12)` | inputs, buttons |
| `--color-border-strong` | `rgba(245,239,227,0.22)` | hover, focus |
| `--color-skeleton` | `rgba(245,239,227,0.06)` | loading skeleton |

---

## 4. Text palette

### Light

| Token | HEX | Контраст vs `#FBF7F0` | Использование |
|-------|-----|----------------------|--------------|
| `--color-text-primary` | `#1F1A12` | **14.5:1 AAA** | headings, important values |
| `--color-text-strong` | `#1F1A12` | 14.5:1 AAA | wordmark, h1, prices strong |
| `--color-text-body` | `#3D3525` | **10.8:1 AAA** | long-form paragraphs, descriptions |
| `--color-text-muted` | `#8A7D6A` | **3.6:1 AA Large** | sub-text, hint, secondary labels (use ≥14px / bold) |
| `--color-text-dim` | `#B5A88E` | 2.1:1 (decorative) | placeholders, faded labels — НЕ для текста-носителя смысла |

### Dark

| Token | HEX | Контраст vs `#16120D` | Использование |
|-------|-----|----------------------|--------------|
| `--color-text-primary` | `#F5EFE3` | **15.1:1 AAA** | headings, values |
| `--color-text-strong` | `#F5EFE3` | 15.1:1 AAA | wordmark, h1 |
| `--color-text-body` | `#D9CEB9` | **11.3:1 AAA** | paragraphs |
| `--color-text-muted` | `#A89B85` | **6.0:1 AA Normal** | sub-text |
| `--color-text-dim` | `#7A6F5E` | 3.3:1 (decorative) | placeholders |

---

## 5. Accent — отдельно от brand

В Savdo brand = terracotta, и `--color-accent` обычно резолвится в `var(--color-brand)`. **Исключение:** seller-CRM, где `--color-accent: #7C3AED` (heritage violet) использован как функциональный dashboard-accent для CRM-utility — фильтры, segments, internal links. Это **не brand-точка** — wordmark и primary CTA остаются в terracotta.

### Heritage violet (только seller-CRM, ограниченно)

| Token | Light | Dark | Где |
|-------|-------|------|-----|
| `--color-accent-violet` | `#7C3AED` | `#A78BFA` | seller-CRM utility (segments, internal filters) |
| `--color-accent-violet-muted` | `rgba(124,58,237,0.08)` | `rgba(167,139,250,0.16)` | violet soft-button |

**Запрет:** violet не использовать в buyer-витрине, marketing-сайте, wordmark, app-icon, push, email.

---

## 6. Semantic — warm-tinted

Generic shadcn-зелёный (`#10B981`) и красный (`#EF4444`) — токсичны на cream-bg: выглядят попугайски и не вписываются в brand-семейство. Используем **warm-tinted** варианты — те же семантические сигналы, но с тёплыми undertones.

### Success — оливково-зелёный

| Token | Light | Dark | Контраст vs surface |
|-------|-------|------|---------------------|
| `--color-success` | `#4A6B45` | `#7A9B72` | light 5.2:1 / dark 5.8:1 |
| `--color-success-tint-bg` | `rgb(74 107 69 / 0.10)` (через `successTint()`) | `rgb(122 155 114 / 0.16)` | success-pill bg |

**Хелпер:** `successTint(opacity = 0.10)` → `rgb(var(--color-success-rgb) / α)`. См. `apps/web-buyer/src/lib/styles.ts`.

### Warning — янтарный (не amber-400)

| Token | Light | Dark | Контраст |
|-------|-------|------|----------|
| `--color-warning` | `#9C7A2E` | `#D9A95C` | light 4.6:1 / dark 7.2:1 |
| `--color-warning-tint-bg` | `rgb(156 122 46 / 0.10)` | `rgb(217 169 92 / 0.16)` | warning-pill bg |

### Danger — кирпично-красный (не rose-500)

| Token | Light | Dark | Контраст |
|-------|-------|------|----------|
| `--color-danger` | `#8B3A3A` | `#C56666` | light 6.4:1 / dark 5.4:1 |
| `--color-danger-tint-bg` | `rgb(139 58 58 / 0.10)` | `rgb(197 102 102 / 0.16)` | danger-pill bg |

### Info — без brand-shift, но не cold-blue

| Token | Light | Dark | Контраст | Примечание |
|-------|-------|------|----------|-----------|
| `--color-info` | `#3B6C8C` | `#6BA5C9` | light 5.4:1 / dark 7.0:1 | warm-tinted blue (slate с тёплым отливом) |
| `--color-info-tint-bg` | `rgb(59 108 140 / 0.10)` | `rgb(107 165 201 / 0.16)` | info-pill bg |

**Примечание:** info в текущем `globals.css` buyer'а не задан — нужно добавить если используется. Сейчас seller использует `--color-info: #3B82F6` (cold-blue), что не вписывается — изменим на `#3B6C8C` при синхронизации.

### Telegram blue (не семантика — brand-сторонний)

| Token | Light | Dark |
|-------|-------|------|
| `--color-telegram` | `#2AABEE` | `#38BDF8` |

Telegram blue — это **бренд Telegram**, не наш семантический цвет. Используем строго на CTA «Написать в Telegram» / «Войти через Telegram». Не использовать как info-цвет.

---

## 7. Контрастные пары — таблица WCAG

### AA (4.5:1 для normal text) и AAA (7:1 для normal text)

| Foreground | Background | Ratio | Verdict | Где |
|-----------|------------|-------|---------|-----|
| `#1F1A12` text-primary | `#FBF7F0` bg | 14.5:1 | **AAA** | основной текст light |
| `#3D3525` text-body | `#FBF7F0` bg | 10.8:1 | **AAA** | body light |
| `#8A7D6A` text-muted | `#FBF7F0` bg | 3.6:1 | **AA Large only** | использовать только 14px+/bold |
| `#B5A88E` text-dim | `#FBF7F0` bg | 2.1:1 | **decorative only** | placeholders, не для текста-смысла |
| `#7C3F2E` brand | `#FBF7F0` bg | 6.5:1 | **AA Normal**, AAA Large | CTA, links |
| `#FBF7F0` brand-text-on-bg | `#7C3F2E` brand | 6.5:1 | **AA Normal**, AAA Large | text на CTA |
| `#F5EFE3` text-primary | `#16120D` bg | 15.1:1 | **AAA** | основной текст dark |
| `#D9CEB9` text-body | `#16120D` bg | 11.3:1 | **AAA** | body dark |
| `#A89B85` text-muted | `#16120D` bg | 6.0:1 | **AA Normal** | sub-text dark |
| `#A05A45` brand | `#16120D` bg | 5.4:1 | **AA Normal** | CTA dark |
| `#FFFFFF` brand-text-on-bg | `#A05A45` brand | 5.1:1 | **AA Normal** | text на dark CTA |
| `#4A6B45` success | `#FBF7F0` bg | 5.2:1 | **AA Normal** | success text light |
| `#9C7A2E` warning | `#FBF7F0` bg | 4.6:1 | **AA Normal** | warning text light |
| `#8B3A3A` danger | `#FBF7F0` bg | 6.4:1 | **AA Normal** | danger text light |

### Правила

1. **Body-text (normal, < 18px regular):** минимум 4.5:1.
2. **Large text (≥ 18px regular / ≥ 14px bold):** минимум 3:1, в нашем стандарте — стремимся к 4.5:1.
3. **Decorative / placeholders:** допустимо 2:1+, но **не передавать смысл цветом**.
4. **Interactive (кнопки, links):** минимум 3:1 для non-text component + 4.5:1 для текста внутри.
5. **`text-muted` `#8A7D6A` в light:** только в размере ≥14px / bold. Для < 14px normal — использовать `text-body` `#3D3525`.

---

## 8. Use cases — когда какой цвет

### CTA primary

```
background: --color-brand
color:      --color-brand-text-on-bg
border:     none
hover-bg:   --color-brand-hover
```

- «Создать магазин», «В корзину», «Оформить заказ», «Перейти в магазин»

### CTA secondary (soft / ghost)

```
background: --color-brand-muted
color:      --color-brand
border:     1px solid --color-brand-border
```

- «Подробнее», «Изменить», «Все товары»

### CTA tertiary (text-only link)

```
background: transparent
color:      --color-brand
text-decoration: underline-on-hover
```

### CTA Telegram (всегда отдельно)

```
background: --color-telegram
color:      #FFFFFF
```

- «Написать в Telegram», «Войти через Telegram»

### Status badge (success / warning / danger)

```
background: rgb(var(--color-{X}-rgb) / 0.10)    /* через successTint(0.10) etc */
color:      --color-{X}
border:     1px solid rgb(var(--color-{X}-rgb) / 0.25)
```

### Card

```
background: --color-surface
border:     1px solid --color-border
shadow:     none по умолчанию; --shadow-sm на hover (см. components-guide.md)
```

### Input

```
background: --color-surface (web-buyer) или --color-surface-sunken (seller CRM)
border:     1px solid --color-border
color:      --color-text-primary
placeholder: --color-text-dim
focus border: --color-brand
```

---

## 9. Do / Don't

### ✅ Do

1. **Используй `--color-brand` для wordmark Savdo** во всех апах (buyer/seller/admin/TMA).
2. **Светлый text-muted (`#8A7D6A`) только в ≥14px / bold.** Иначе — `--color-text-body`.
3. **Используй `successTint() / warningTint() / dangerTint()`** хелперы — они автоматически адаптируются к light/dark через RGB-channel CSS vars.
4. **Per-store branding (когда добавим)** перекрывает только `--color-brand` витрины — wordmark Savdo в footer/credit остаётся.
5. **Tint-фон на cream:** делай через `rgb(var(--color-X-rgb) / α)` с α ∈ {0.06, 0.10, 0.15}. Выше — становится «попугайски».

### ❌ Don't

1. **Не используй `#7C3AED` (heritage violet) как brand.** Только seller-CRM utility.
2. **Не используй generic shadcn-цвета** `#10B981 / #EF4444 / #F59E0B / #3B82F6` — они холодные на cream-bg.
3. **Не пиши inline-hex+alpha** `"rgba(251,191,36,.15)"` — используй `warningTint(0.15)`. Иначе токены не theme-aware.
4. **Не используй `--color-text-dim` как text-color** для содержательного контента. Только placeholders.
5. **Не используй pure white `#FFFFFF` как bg страницы.** Только как surface (карточки, modals). Bg страницы — всегда `#FBF7F0`.
6. **Не используй pure black `#000000`** нигде. Самый тёмный — `#16120D` (warm near-black).
7. **Не используй градиенты на CTA.** Только plain solid.

---

## 10. CSS-tokens — ready to paste

Полный набор `:root` + `[data-theme="dark"]`. Готов для копирования в `globals.css` любого нового приложения / лендинга. **Эталон — `apps/web-buyer/src/app/globals.css`.**

### `:root` (light)

```css
:root {
  /* ── Surface ─────────────────────────────────────────────────────────────── */
  --color-bg:                #FBF7F0;
  --color-surface:           #FFFFFF;
  --color-surface-muted:     #FBF7F0;
  --color-surface-elevated:  #FFFFFF;
  --color-surface-sunken:    #F4EEE0;
  --color-divider:           #EFE8DA;
  --color-border:            #EFE8DA;
  --color-border-strong:     #D8CFB8;
  --color-skeleton:          #EFE8DA;

  /* ── Text ────────────────────────────────────────────────────────────────── */
  --color-text-primary:      #1F1A12;
  --color-text-strong:       #1F1A12;
  --color-text-body:         #3D3525;
  --color-text-muted:        #8A7D6A;
  --color-text-dim:          #B5A88E;

  /* ── Brand (terracotta) ──────────────────────────────────────────────────── */
  --color-brand:             #7C3F2E;
  --color-brand-hover:       #6A3526;
  --color-brand-muted:       rgba(124,63,46,0.06);
  --color-brand-border:      rgba(124,63,46,0.15);
  --color-brand-text-on-bg:  #FBF7F0;

  /* ── Accent (alias to brand by default; seller-CRM overrides to violet) ───── */
  --color-accent:            var(--color-brand);
  --color-accent-hover:      var(--color-brand-hover);
  --color-accent-muted:      var(--color-brand-muted);
  --color-accent-border:     var(--color-brand-border);
  --color-accent-text-on-bg: var(--color-brand-text-on-bg);

  /* ── Semantic (warm-tinted, NOT shadcn-generic) ──────────────────────────── */
  --color-success:           #4A6B45;
  --color-warning:           #9C7A2E;
  --color-danger:            #8B3A3A;
  --color-info:              #3B6C8C;
  --color-telegram:          #2AABEE;

  /* ── Semantic RGB channels (для theme-aware tints через rgb(var(...)/α)) ─── */
  --color-success-rgb:       74, 107, 69;
  --color-warning-rgb:       156, 122, 46;
  --color-danger-rgb:        139, 58, 58;
  --color-info-rgb:          59, 108, 140;

  color-scheme: light;
}
```

### `[data-theme="dark"]`

```css
[data-theme="dark"] {
  /* ── Surface (warm near-black) ───────────────────────────────────────────── */
  --color-bg:                #16120D;
  --color-surface:           #221C16;
  --color-surface-muted:     #1E1812;
  --color-surface-elevated:  #2A231C;
  --color-surface-sunken:    #100E09;
  --color-divider:           rgba(245,239,227,0.08);
  --color-border:            rgba(245,239,227,0.12);
  --color-border-strong:     rgba(245,239,227,0.22);
  --color-skeleton:          rgba(245,239,227,0.06);

  /* ── Text ────────────────────────────────────────────────────────────────── */
  --color-text-primary:      #F5EFE3;
  --color-text-strong:       #F5EFE3;
  --color-text-body:         #D9CEB9;
  --color-text-muted:        #A89B85;
  --color-text-dim:          #7A6F5E;

  /* ── Brand (lifted terracotta) ───────────────────────────────────────────── */
  --color-brand:             #A05A45;
  --color-brand-hover:       #B36850;
  --color-brand-muted:       rgba(160,90,69,0.18);
  --color-brand-border:      rgba(160,90,69,0.42);
  --color-brand-text-on-bg:  #FFFFFF;

  /* ── Accent (alias) ──────────────────────────────────────────────────────── */
  --color-accent:            var(--color-brand);
  --color-accent-hover:      var(--color-brand-hover);
  --color-accent-muted:      var(--color-brand-muted);
  --color-accent-border:     var(--color-brand-border);
  --color-accent-text-on-bg: var(--color-brand-text-on-bg);

  /* ── Semantic (lifted lightness) ─────────────────────────────────────────── */
  --color-success:           #7A9B72;
  --color-warning:           #D9A95C;
  --color-danger:            #C56666;
  --color-info:              #6BA5C9;
  --color-telegram:          #38BDF8;

  /* ── Semantic RGB channels (dark — softer для dark bg) ───────────────────── */
  --color-success-rgb:       122, 155, 114;
  --color-warning-rgb:       217, 169, 92;
  --color-danger-rgb:        197, 102, 102;
  --color-info-rgb:          107, 165, 201;

  color-scheme: dark;
}
```

### Seller-CRM override (violet accent дополнительно)

```css
/* apps/web-seller/src/app/globals.css — дополнительно к brand-набору выше */
:root {
  --color-accent-violet:        #7C3AED;
  --color-accent-violet-muted:  rgba(124,58,237,0.08);
  --color-accent-violet-border: rgba(124,58,237,0.20);
}
[data-theme="dark"] {
  --color-accent-violet:        #A78BFA;
  --color-accent-violet-muted:  rgba(167,139,250,0.16);
  --color-accent-violet-border: rgba(167,139,250,0.32);
}
```

**Где использовать violet в seller:** filter chips «Segment: VIP», CRM-tags, internal links в admin-screens. **НЕ** на CTA, wordmark, status pills, primary actions.

### Tailwind v4 theme exposure

```css
@theme inline {
  --color-background: var(--color-bg);
  --color-foreground: var(--color-text-primary);
  --font-sans: var(--font-inter);
}
```

---

## 11. JS-tokens (для `styles.ts`)

Полный пример — `apps/web-buyer/src/lib/styles.ts`. Каждый новый apps/* должен иметь свой `lib/styles.ts`, повторяющий buyer-структуру **1-to-1** (плюс accent-violet в seller'е).

```ts
export const colors = {
  // Surface
  bg:              'var(--color-bg)',
  surface:         'var(--color-surface)',
  surfaceMuted:    'var(--color-surface-muted)',
  surfaceElevated: 'var(--color-surface-elevated)',
  surfaceSunken:   'var(--color-surface-sunken)',
  divider:         'var(--color-divider)',
  border:          'var(--color-border)',
  borderStrong:    'var(--color-border-strong)',
  skeleton:        'var(--color-skeleton)',
  // Text
  textPrimary:     'var(--color-text-primary)',
  textStrong:      'var(--color-text-strong)',
  textBody:        'var(--color-text-body)',
  textMuted:       'var(--color-text-muted)',
  textDim:         'var(--color-text-dim)',
  // Brand
  brand:           'var(--color-brand)',
  brandHover:      'var(--color-brand-hover)',
  brandMuted:      'var(--color-brand-muted)',
  brandBorder:     'var(--color-brand-border)',
  brandTextOnBg:   'var(--color-brand-text-on-bg)',
  // Accent (alias to brand by default)
  accent:          'var(--color-accent)',
  accentHover:     'var(--color-accent-hover)',
  accentMuted:     'var(--color-accent-muted)',
  accentBorder:    'var(--color-accent-border)',
  accentTextOnBg:  'var(--color-accent-text-on-bg)',
  // Semantic
  success:         'var(--color-success)',
  warning:         'var(--color-warning)',
  danger:          'var(--color-danger)',
  info:            'var(--color-info)',
  telegram:        'var(--color-telegram)',
} as const;

// Tints — для status-bg, rate-cards (используют RGB channels, theme-aware)
export const successTint = (α = 0.10) => `rgb(var(--color-success-rgb) / ${α})`;
export const warningTint = (α = 0.10) => `rgb(var(--color-warning-rgb) / ${α})`;
export const dangerTint  = (α = 0.10) => `rgb(var(--color-danger-rgb) / ${α})`;
export const infoTint    = (α = 0.10) => `rgb(var(--color-info-rgb) / ${α})`;
```

---

## 12. Validation checklist

Перед PR с новым цветом / новой палитрой:

- [ ] Цвет добавлен в `globals.css` для **обоих** `:root` и `[data-theme="dark"]`
- [ ] Цвет добавлен в `lib/styles.ts` как `var(--color-X)`
- [ ] Если semantic — добавлены `*-rgb` channels для обоих режимов
- [ ] Контраст проверен через [contrast-ratio.com](https://contrast-ratio.com) или devtools, AA минимум для интерактива
- [ ] Цвет работает на light AND dark — не «прыгает» в hue (warm в обоих)
- [ ] Если новый brand-color — есть обоснование (см. brand-book.md), terracotta остаётся primary
- [ ] Inline `rgba(... , .15)` не оставлен — использован tint-helper

---

## 13. История изменений палитры

| Дата | Изменение | Источник решения |
|------|-----------|------------------|
| 2026-05-20 | Зафиксирована terracotta + cream как материнская палитра. Heritage violet — только seller-CRM utility. | Аудит `analiz/audits/web-buyer-vs-seller-design-2026-05-20.md` |
| TBD | Per-store branding: продавец загружает HEX → перекрывает `--color-brand` на витрине, wordmark Savdo остаётся terracotta. | (запланировано) |
