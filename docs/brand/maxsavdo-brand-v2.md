---
date: 2026-05-24
project: maxsavdo
status: 🟢 финальный
supersedes: docs/brand/brand-book.md (Soft Color Lifestyle v1)
related_adr: ADR-008
---

# 🖤 maxsavdo — Brand Book v2 (Dark Luxury Minimalist)

**Финальный бренд для `maxsavdo`. Заменяет Soft Color Lifestyle (terracotta/cream/violet).**

Source: brand book от 24.05.2026 — `docs/brand/assets/maxsavdo/brand-book-pages.jpg`, `brand-guidelines-book.jpg`, `logo-app-icon.jpg`.

---

## 1. Логотип

### Концепция

Монограмма **`M`** с интегрированной "handle"-петлёй сверху — стилизованная shopping bag. Wordmark **`MAXSAVDO`** с золотой "A" в центре как акцентом.

**Левая половина M** — белая/чистая (Pure White).
**Правая половина M** — золотая (Champagne Gold).
**Handle сверху** — золотая дуга.

### Файлы

| Asset | Путь |
|-------|------|
| App icon (rounded square, dark bg) | `docs/brand/assets/maxsavdo/logo-app-icon.jpg` |
| Brand book pages (полный гайдлайн) | `docs/brand/assets/maxsavdo/brand-book-pages.jpg` |
| Brand book mockup (cover + palette + typo) | `docs/brand/assets/maxsavdo/brand-guidelines-book.jpg` |

> **TODO:** создать SVG-исходники самим (AI-vectorize JPG или нарисовать в Figma).
> Тикет: `BRAND-LOGO-SVG-CREATE-001`.

### Правила использования

✅ **Можно:**
- На чёрном фоне — лого как есть (белая + золотая половина).
- На белом фоне — инвертировать белую половину в чёрную, золотая остаётся.
- Минимальный размер — `5.00 mm` (printable) / `48px` (digital).

❌ **Нельзя:**
- Менять пропорции / искажать.
- Менять цвета золотой части на другие.
- Размещать на пёстром/контрастном фоне без подложки.
- Использовать "S" монограмму из старого brand-book (deprecated).

---

## 2. Цветовая палитра

### Core (3 цвета)

| Имя | HEX | RGB | CSS var | Назначение |
|-----|-----|-----|---------|-----------|
| **Rich Black** | `#0F0F0F` | `15,15,15` | `--brand-black` | Primary background, primary text on light |
| **Champagne Gold** | `#E8A552` | `232,165,82` | `--brand-gold` | Accent, CTA, премиум-элементы, активные состояния |
| **Champagne Gold Light** | `#FFC574` | `255,197,116` | `--brand-gold-light` | Текст/акцент на тёмном фоне (лучше читается, чем базовый gold) |
| **Champagne Gold Hover** | `#D4922E` | `212,146,46` | `--brand-gold-hover` | Hover/pressed на светлом фоне; darken-состояние заполненных кнопок |
| **Pure White** | `#FFFFFF` | `255,255,255` | `--brand-white` | Light background, primary text on dark |

> ✅ **Обновлено 28.07.2026 (v3, канон = `apps/landing`).** Владелец подтвердил: после рескина
> лендинга (27.07.2026, коммит `661e9ec`) его палитра — новый канон для всего проекта, а не
> прежний eyedropper-пик от 25.05.2026. Rich Black `#0A0A0A → #0F0F0F`, Champagne Gold
> `#C9A876 → #E8A552`. Добавлена явная пара hover-состояний вместо одной "Light"-версии:
> **Hover `#D4922E`** (темнее — для заполненных кнопок на светлом фоне/базовое hover-состояние,
> сама формула из `apps/landing/tailwind.config.ts`) и **Light `#FFC574`** (светлее — только там,
> где accent-цвет используется как ТЕКСТ на тёмном фоне и обычный `#E8A552` даёт недостаточный
> контраст; посчитан сохранением исходной дельты осветления `C9A876→E8C898`, применённой к новому
> базовому golde). Синхронизировано в `apps/web-buyer`, `apps/web-seller`, `apps/tma`
> (`docs/design/maxsavdo-design-v2.md` §Цвет ссылается сюда же). `apps/landing` — источник, не
> трогался. Старое: Champagne Gold `#C9A876` (закрывало `BRAND-PALETTE-HEX-PICK-001`,
> 25.05.2026, Азим, visual eyedropper по brand-book JPG).

### Supporting (нейтрали)

| Имя | HEX | CSS var | Назначение |
|-----|-----|---------|-----------|
| Dark Surface | `#1A1A1A` | `--brand-surface-dark` | Cards / sections на dark theme |
| Mid Surface | `#2A2A2A` | `--brand-surface-mid` | Hover states, borders на dark |
| Border Subtle | `#3A3A3A` | `--brand-border-dark` | Тонкие разделители на dark |
| Light Surface | `#F8F8F8` | `--brand-surface-light` | Cards / sections на light theme |
| Border Light | `#E5E5E5` | `--brand-border-light` | Разделители на light |

### Functional (статусы UI)

| Имя | HEX | Назначение |
|-----|-----|-----------|
| Success | `#10B981` | OK, успех заказа |
| Warning | `#F59E0B` | Внимание, low stock |
| Error | `#EF4444` | Ошибка, отмена |
| Info | `#3B82F6` | Информационные баннеры |

> Эти подобраны как нейтральные supporting — не конкурируют с золотом.

---

## 3. Типографика

### Primary + Secondary Font: **Inter** ✅

Один шрифт на всё (headings + body + UI) — простота, минимальный bundle, нет конфликтов между уровнями типографики.

**Обоснование выбора (25.05.2026, Азим):**
- Wordmark `MAXSAVDO` в brand-book — geometric sans с триангулярной "A" (ближе к Outfit / Geist), но **Outfit / Geist не имеют Cyrillic в Google Fonts** → не подходят для ru/uz UI.
- **Inter** поддерживает Cyrillic + Cyrillic Ext + Latin Ext (нужно для узбекской латиницы) из коробки. Variable-font, weights 100-900.
- De-facto стандарт в современном e-commerce/SaaS (Linear, Vercel, Stripe, GitHub). Покупатели подсознательно ассоциируют с premium-продуктом.
- Wordmark в header будет SVG (не текст шрифта) → точное совпадение `Inter` с brand-book wordmark не требуется.

**Подключение:**
```ts
// apps/web-buyer/src/app/layout.tsx и apps/web-seller/src/app/layout.tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'latin-ext', 'cyrillic', 'cyrillic-ext'],
  variable: '--font-sans',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});
```

> ✅ Закрывает `BRAND-FONT-CHOOSE-001`.

### Scale (пока без подтверждения)

| Level | Size | Weight | Использование |
|-------|------|--------|---------------|
| Display | 48px | 700 | Hero |
| H1 | 32px | 700 | Заголовки страниц |
| H2 | 24px | 600 | Секции |
| H3 | 20px | 600 | Карточки |
| Body | 16px | 400 | Основной текст |
| Caption | 14px | 500 | Лейблы, подписи |
| Small | 12px | 400 | Microcopy |

---

## 4. Эстетика

**Dark Luxury Minimalist:**
- Чёрные/тёмные фоны как primary в hero / landing
- Золото — точечно для CTA и accent
- Много negative space (воздух)
- Sharp geometric shapes (мин. rounding)
- High contrast

**НЕ:**
- ~~Cream / terracotta backgrounds~~ (отменено — это был Soft Color Lifestyle)
- ~~Soft pastel violet~~ (тоже отменено)
- ~~Heavy decorative elements~~

---

## 5. Web-применение (maxsavdo monorepo)

### Tailwind config tokens (proposed)

```ts
// packages/ui/tailwind-tokens.ts (или inline в каждом app)
colors: {
  brand: {
    black: '#0F0F0F',
    gold: '#E8A552',
    white: '#FFFFFF',
    surface: {
      dark: '#1A1A1A',
      mid: '#2A2A2A',
      light: '#F8F8F8',
    },
    border: {
      dark: '#3A3A3A',
      light: '#E5E5E5',
    },
  },
}
```

### CSS variables (для runtime theme switch)

```css
:root[data-theme="dark"] {
  --bg-primary: #0F0F0F;
  --bg-surface: #1A1A1A;
  --text-primary: #FFFFFF;
  --text-secondary: #E8A552;
  --accent: #E8A552;
  --border: #3A3A3A;
}

:root[data-theme="light"] {
  --bg-primary: #FFFFFF;
  --bg-surface: #F8F8F8;
  --text-primary: #0F0F0F;
  --text-secondary: #E8A552;
  --accent: #E8A552;
  --border: #E5E5E5;
}
```

---

## 6. Что заменяется

| Старая система | Новая (maxsavdo v2) |
|----------------|----------------------|
| Soft Color Lifestyle (terracotta + cream) | **Dark Luxury Minimalist** (black + gold + white) |
| Violet brand color (`#7C3AED`) | **Champagne Gold** (`#E8A552`, было `#C9A876` до 28.07.2026) |
| Logo: монограмма "S" (старый бренд) | **Logo: монограмма "M" с bag handle** |
| Brand name: "Savdo" / "Savdo Builder" (старое) | **maxsavdo** |
| `docs/brand/brand-book.md` | **`docs/brand/maxsavdo-brand-v2.md`** (этот файл) |
| Старые `logo-monogram-s.svg`, `logo-lockup-horizontal.svg` | Заменить на maxsavdo SVG (`BRAND-LOGO-SVG-SOURCE-001`) |

---

## 7. Open questions

1. ~~**`BRAND-PALETTE-HEX-PICK-001`** — снять точный HEX champagne gold eyedropper'ом~~ ✅ закрыто 25.05.2026 (Champagne Gold `#C9A876`, + Champagne Gold Light `#E8C898` для highlights).
2. ~~**`BRAND-FONT-CHOOSE-001`** — выбрать шрифт из Google Fonts~~ ✅ закрыто 25.05.2026 (**Inter**, weights 300-700, full Cyrillic).
3. **`BRAND-LOGO-SVG-CREATE-001`** — создать SVG (AI-vectorize JPG или Figma). 🔴 P0, не закрыто.
4. **`BRAND-DARK-VS-LIGHT-DEFAULT-001`** — что default theme для web-buyer? Dark luxury или light?
5. **`BRAND-MIGRATION-PLAN-001`** — план миграции: сразу заменить везде или поэтапно (landing → buyer → seller → admin)?

---

## Связано

- [ADR-008 — Brand name `maxsavdo`](../adr/ADR-008_brand_name_maxsavdo.md)
- [Business plan v1](../decisions/business-plan-v1-2026-05-22.md)
- [Старый brand-book (deprecated)](./brand-book.md)
- [maxsavdo Design System v2](../design/maxsavdo-design-v2.md) — дизайн-система под этот бренд (актуальная)
- ~~`docs/design/liquid-authority.md`~~ — старая дизайн-система, deprecated 30.05.2026 (ревизия выполнена → design-v2)
