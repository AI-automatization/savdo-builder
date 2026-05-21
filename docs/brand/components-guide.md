# Savdo — Components Guide

**Версия:** 1.0 · **Дата:** 2026-05-20
**Source of truth (код):** `apps/web-buyer/src/components/**`, `apps/web-buyer/src/lib/styles.ts`

> Document описывает базовые UI-компоненты, spacing scale, border-radius, shadows. На основе web-buyer (эталон). Все примеры берут CSS-vars из `palette.md`.

---

## 1. Spacing scale

Базируется на 4px-baseline (классический dense-density grid). Если визуально нужно «дышит» — выбирай следующий шаг, не половинный.

| Token | Value | Tailwind | Использование |
|-------|-------|----------|--------------|
| `space-1` | 4px | `p-1`, `gap-1`, `m-1` | inline icon/label gap |
| `space-2` | 8px | `p-2`, `gap-2` | tight component padding |
| `space-3` | 12px | `p-3`, `gap-3` | card-internal gap |
| `space-4` | 16px | `p-4`, `gap-4` | default card padding, section gap |
| `space-5` | 20px | `p-5`, `gap-5` | larger card padding |
| `space-6` | 24px | `p-6`, `gap-6` | section padding, hero gap |
| `space-8` | 32px | `p-8`, `gap-8` | between major sections |
| `space-12` | 48px | `p-12` | page-level vertical rhythm |
| `space-16` | 64px | `p-16` | landing hero, page top |

**Правила:**
- **Минимум 8px** между clickable элементами (для finger-friendly tap).
- **Минимум 16px** padding для cards и input fields.
- **Не использовать промежуточные** (5px, 7px, 10px). Stick к scale.

### Mobile vs Desktop

| Component | Mobile | Desktop |
|-----------|--------|---------|
| Page padding | `p-4` (16px) | `p-6` (24px) |
| Card padding | `p-4` | `p-5` (20px) |
| Section gap | `gap-6` | `gap-8` |
| Header height | 56px | 64px |
| Bottom-nav height | 64px | — (no bottom nav on desktop) |

---

## 2. Border-radius scale

| Token | Value | Tailwind | Использование |
|-------|-------|----------|--------------|
| `radius-xs` | 4px | `rounded` | input inner-tag, micro-chip |
| `radius-sm` | 6px | `rounded-md` | small badge, secondary chip |
| `radius-md` | 8px | `rounded-lg` | input field, button |
| `radius-lg` | 12px | `rounded-xl` | card, dropdown |
| `radius-xl` | 16px | `rounded-2xl` | hero cards, large containers |
| `radius-2xl` | 24px | `rounded-3xl` | onboarding-screens, marketing hero |
| `radius-pill` | 9999px | `rounded-full` | pill, badge, avatar, icon button |

**Правила:**
- **Card радиус — всегда 12px** (rounded-xl). Это базовая retail-warmth: не слишком sharp, не слишком squishy.
- **Button — 8px** (rounded-lg) или **pill** для status / chip.
- **Input — 8px** (rounded-lg) для текстовых полей; **9999px** для search-input в hero.
- **Mobile-app icon — 22.5%** of bounding box (Apple HIG iOS continuous corner).
- **Web-app icon plate (наш monogram) — 22%** (см. `logo-monogram-s.svg`, rx=14 на 64x64).

---

## 3. Elevation / shadows

В retail-warmth UI используем **минимальные тени**. Solid borders в качестве primary separation, тени — только для floating elements (popovers, dropdowns).

| Token | Value | Tailwind | Использование |
|-------|-------|----------|--------------|
| `shadow-none` | none | `shadow-none` | default cards, flat surface |
| `shadow-sm` | `0 1px 2px 0 rgba(31,26,18,0.04)` | `shadow-sm` | subtle hover lift on cards |
| `shadow-md` | `0 2px 8px -2px rgba(31,26,18,0.06), 0 4px 16px -4px rgba(31,26,18,0.04)` | `shadow-md` | dropdowns, popovers |
| `shadow-lg` | `0 4px 16px -4px rgba(31,26,18,0.10), 0 8px 32px -8px rgba(31,26,18,0.06)` | `shadow-lg` | modals, sheets |
| `shadow-brand` | `0 4px 12px -2px rgba(124,63,46,0.18)` | custom | active CTA glow (рare) |

**Правила:**
- **Default cards — no shadow.** Только border `1px solid var(--color-border)`.
- **Hover на cards** — `shadow-sm` + `translate-y-[-2px]` (lift-effect, web-buyer уже использует).
- **Modals / popovers** — `shadow-lg`.
- **Dark mode shadows** — те же значения, но shadows почти не видны на тёмном фоне (это нормально, dark UI relies на surface-elevation через color, не через shadow).
- **Не использовать `shadow-2xl`** — слишком тяжело для retail-warmth tone.

---

## 4. Buttons

### 4.1 Primary CTA — terracotta fill

```html
<button
  class="px-4 py-2.5 rounded-lg font-semibold text-sm transition-all active:scale-[0.97]"
  style="background: var(--color-brand); color: var(--color-brand-text-on-bg); border: none;"
>
  Создать магазин
</button>
```

**Размеры:**
- **Default:** `px-4 py-2.5` (16px / 10px), font-semibold, text-sm (14px). Height ≈ 40px.
- **Large:** `px-6 py-3.5` (24px / 14px), font-semibold, text-base (16px). Height ≈ 48px. Использовать для hero / marketing.
- **Small:** `px-3 py-1.5` (12px / 6px), font-medium, text-xs (12px). Height ≈ 28px.

**States:**
| State | Стиль |
|-------|-------|
| Default | `background: brand` |
| Hover | `background: brandHover` |
| Active | `transform: scale(0.97)` |
| Focus | `outline: 2px solid brand; outline-offset: 2px` |
| Disabled | `opacity: 0.5; cursor: not-allowed` |
| Loading | spinner inside + disable interactions |

### 4.2 Secondary CTA — soft button

```html
<button
  class="px-4 py-2.5 rounded-lg font-semibold text-sm"
  style="background: var(--color-brand-muted); color: var(--color-brand); border: 1px solid var(--color-brand-border);"
>
  Подробнее
</button>
```

### 4.3 Tertiary — text-only link

```html
<button
  class="px-2 py-1 font-medium text-sm hover:underline"
  style="color: var(--color-brand);"
>
  Все заказы →
</button>
```

### 4.4 Telegram CTA — отдельный паттерн

```html
<button
  class="px-4 py-2.5 rounded-lg font-semibold text-sm flex items-center gap-2"
  style="background: var(--color-telegram); color: #FFFFFF; border: none;"
>
  <svg>...telegram icon...</svg>
  Написать в Telegram
</button>
```

**Никогда** не использовать `--color-brand` для Telegram CTA — это разные семантики.

### 4.5 Icon button

```html
<button
  aria-label="Избранное"
  class="w-9 h-9 rounded-full flex items-center justify-center hover-soft"
>
  <Heart size={18} />
</button>
```

- **Hit area minimum:** 36x36px (`w-9 h-9`). На mobile — 44x44 предпочтительно.
- **hover-soft** — utility class из `globals.css` (theme-aware soft hover).
- **Wishlist heart variant** (active) — fill цветом brand, см. `apps/web-buyer/src/components/store/ProductCard.tsx` (handleHeartClick).

### 4.6 Destructive button

```html
<button
  class="px-4 py-2.5 rounded-lg font-semibold text-sm"
  style="background: var(--color-danger); color: #FFFFFF; border: none;"
>
  Удалить
</button>
```

**Применение редкое** — для permanent-delete операций. Для cancel — soft secondary, не destructive.

---

## 5. Badges & status pills

### 5.1 Status pill — semantic

```html
<!-- Success -->
<span
  class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
  style="background: rgb(var(--color-success-rgb) / 0.10); color: var(--color-success); border: 1px solid rgb(var(--color-success-rgb) / 0.25);"
>
  Доставлен
</span>

<!-- Warning -->
<span style="background: rgb(var(--color-warning-rgb) / 0.10); color: var(--color-warning); border: 1px solid rgb(var(--color-warning-rgb) / 0.25);">
  Ожидает
</span>

<!-- Danger -->
<span style="background: rgb(var(--color-danger-rgb) / 0.10); color: var(--color-danger); border: 1px solid rgb(var(--color-danger-rgb) / 0.25);">
  Отменён
</span>
```

**Используйте хелперы:** `successTint(0.10)`, `warningTint(0.10)`, `dangerTint(0.10)`. Они theme-aware (RGB channels разные в light/dark).

### 5.2 Brand badge — терракотовый

```html
<span
  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
  style="background: var(--color-brand-text-on-bg); color: var(--color-brand); border: 1px solid var(--color-brand-border);"
>
  <Layers size={10} />
  3
</span>
```

(Из `ProductCard.tsx` — variant-count badge.)

### 5.3 Counter badge — на icon

```html
<span
  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
  style="background: var(--color-brand); color: var(--color-brand-text-on-bg);"
>
  5
</span>
```

(Cart badge, notification badge.)

---

## 6. Cards

### 6.1 Default card

```html
<div
  class="rounded-xl p-4 sm:p-5"
  style="background: var(--color-surface); border: 1px solid var(--color-border);"
>
  Content
</div>
```

- `radius-lg` (12px).
- `p-4` mobile, `p-5` desktop.
- Solid border, no shadow.

### 6.2 Hoverable card (clickable)

```html
<div
  class="rounded-xl p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm active:scale-[0.98]"
  style="background: var(--color-surface); border: 1px solid var(--color-border);"
>
  Content
</div>
```

### 6.3 Muted card (sunken / sub-section)

```html
<div
  class="rounded-xl p-4"
  style="background: var(--color-surface-muted); border: 1px solid var(--color-border);"
>
  Content
</div>
```

### 6.4 Product card — full pattern

См. `apps/web-buyer/src/components/store/ProductCard.tsx` (line 55-167). Ключевые элементы:
- Image area: `aspect-square` + `bg: surfaceSunken` + `rounded-md`.
- Badge layer: variant-count (top-left), wishlist heart (top-right), out-of-stock overlay.
- Info area: `pt-2` + title `text-[12px]` + price strong.

---

## 7. Inputs

### 7.1 Text input

```html
<input
  type="text"
  placeholder="Название магазина"
  class="w-full h-[44px] px-3 rounded-lg text-base outline-none transition-colors"
  style="
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  "
/>
```

**States:**
- Default: border `--color-border`.
- Focus: border `--color-brand` (`1px solid` + outline `2px solid brand-muted`).
- Error: border `--color-danger` + helper text in danger.
- Disabled: `opacity: 0.5`.

**Heights:**
- **Default:** 44px (mobile-friendly tap area).
- **Compact:** 36px (dense tables / sub-forms).

### 7.2 Search input (pill)

```html
<input
  placeholder="Поиск товаров..."
  class="w-full h-10 px-4 rounded-full text-sm outline-none"
  style="
    background: var(--color-surface-muted);
    border: 1px solid var(--color-border);
    color: var(--color-text-primary);
  "
/>
```

### 7.3 Label

```html
<label
  class="block text-sm font-medium mb-1.5"
  style="color: var(--color-text-primary);"
>
  Название магазина
</label>
```

### 7.4 Helper / error text

```html
<p
  class="text-xs mt-1.5"
  style="color: var(--color-text-muted);"
>
  Используйте только латиницу, цифры и дефис
</p>

<!-- Error -->
<p style="color: var(--color-danger);">
  Адрес `lola-shop` уже занят
</p>
```

### 7.5 Special: slug input с разделителем

См. `apps/web-buyer` — UI паттерн `savdo.uz/<slug>` с разделителем. Структура:

```html
<div class="flex h-[44px] rounded-lg overflow-hidden" style="border: 1px solid var(--color-border);">
  <span class="px-3 flex items-center text-sm" style="background: var(--color-surface-muted); color: var(--color-text-muted);">
    savdo.uz/
  </span>
  <input
    class="flex-1 px-3 outline-none text-sm"
    style="background: var(--color-surface); color: var(--color-text-primary);"
  />
</div>
```

---

## 8. Tooltip

См. `apps/web-buyer/src/components/tooltip.tsx`. Минимальный паттерн:

```html
<div
  class="absolute z-50 px-2 py-1 rounded-md text-xs whitespace-nowrap pointer-events-none"
  style="background: var(--color-text-primary); color: var(--color-bg);"
>
  Tooltip text
</div>
```

- Inverted: background = text-primary, color = bg.
- Маленький, без shadow (на dark tooltip — shadow не нужна).
- Анимация: `opacity 0→1 / scale 0.95→1` в 150ms.

---

## 9. Loading / skeleton

### 9.1 Skeleton block

```html
<div
  class="rounded-md animate-pulse"
  style="background: var(--color-skeleton); height: 24px; width: 60%;"
></div>
```

### 9.2 Spinner

```html
<svg class="animate-spin h-4 w-4" style="color: var(--color-brand);" viewBox="0 0 24 24">
  <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" fill="none" stroke-dasharray="44" stroke-dashoffset="22"></circle>
</svg>
```

**Не используем** complex multi-color spinners — solid brand-color, простое вращение.

---

## 10. Empty states

```html
<div class="py-12 px-6 text-center">
  <div class="mb-3 inline-flex items-center justify-center w-16 h-16 rounded-full"
       style="background: var(--color-surface-muted);">
    <ShoppingBag size={28} style={{ color: 'var(--color-text-muted)' }} />
  </div>
  <h3 class="text-base font-semibold mb-1" style="color: var(--color-text-primary);">
    Пока пусто
  </h3>
  <p class="text-sm mb-4" style="color: var(--color-text-muted);">
    Откройте каталог и выберите что-нибудь
  </p>
  <a class="text-sm font-medium" style="color: var(--color-brand);">
    Перейти в каталог →
  </a>
</div>
```

---

## 11. Navigation patterns

### 11.1 Header (web-buyer) — см. `apps/web-buyer/src/components/layout/Header.tsx`

Структура:
- Sticky top, z-40
- Background `--color-surface`, border-bottom `--color-divider`
- Logo «Savdo» left → search center → nav icons right
- Mobile: bottom-nav вместо profile

### 11.2 Bottom navigation (mobile)

См. `apps/web-buyer/src/components/layout/BottomNavBar.tsx`. Структура:
- Fixed bottom, 64px height
- 5 icons: Home / Wishlist / Cart / Orders / Profile
- Active state: `--color-brand` color + bold label
- Inactive: `--color-text-muted`

### 11.3 Sidebar (web-seller dashboard)

Структура (240px wide, fixed left):
- Top: logo «Savdo» (32px monogram + wordmark)
- Nav items с icons (lucide stroke 1.75)
- Active: `--color-brand-muted` background + `--color-brand` text
- Inactive: `--color-text-muted`

---

## 12. Patterns specific to savdo

### 12.1 Telegram CTA pattern

Всегда видна на витрине buyer'а. Sticky/fixed bottom на mobile, в hero на desktop.

```html
<a
  class="flex items-center gap-2 px-5 py-3 rounded-full font-semibold shadow-md"
  style="background: var(--color-telegram); color: #FFFFFF;"
  href="https://t.me/{seller_username}"
>
  <TelegramIcon /> Написать в Telegram
</a>
```

### 12.2 Price display

```html
<span class="text-base font-bold tabular-nums" style="color: var(--color-text-strong);">
  1 250 000
</span>
<span class="text-xs font-normal ml-1" style="color: var(--color-text-muted);">
  сум
</span>
```

### 12.3 Wishlist heart toggle

Stateful pattern, см. `ProductCard.tsx` line 119-138:

```html
<button
  onClick={toggle}
  aria-pressed={inWishlist}
  class="w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-90"
  style={{
    background: 'rgba(255,255,255,0.85)',
    color: inWishlist ? colors.brand : colors.textBody,
  }}
>
  <Heart size={16} fill={inWishlist ? "currentColor" : "none"} />
</button>
```

### 12.4 Store-slug edit

Two-part input pattern (prefix readonly + slug editable), см. §7.5.

### 12.5 Status pill — order states

5 status'ов order'а:

| State | Color | Label |
|-------|-------|-------|
| `pending` | warning | Ожидает |
| `confirmed` | info | Подтверждён |
| `shipped` | brand | В пути |
| `delivered` | success | Доставлен |
| `cancelled` | danger | Отменён |

Все через `*Tint(0.10)` + соответствующий semantic-color text.

---

## 13. Чек-лист «бренд-консистентный компонент»

- [ ] Использует token'ы из `var(--color-*)`, не hardcoded HEX
- [ ] Radius — из scale (4/6/8/12/16/24/9999)
- [ ] Spacing — из scale (4/8/12/16/20/24/32/48/64)
- [ ] Tap-area минимум 36x36, желательно 44x44 на mobile
- [ ] Hover state есть для clickable элементов
- [ ] Focus state с outline (`outline: 2px solid brand`)
- [ ] Active state с scale (0.97) или background-change
- [ ] Disabled с `opacity: 0.5 + cursor: not-allowed`
- [ ] ARIA-label для icon-only buttons
- [ ] Контраст body-text vs background ≥ 4.5:1 (см. `palette.md`)
- [ ] Если semantic — использует tint-helper, не inline hex+alpha
- [ ] Анимации respect `prefers-reduced-motion`

---

## 14. Что НЕ изобретать заново

Если нужен компонент — сначала проверить:
1. `apps/web-buyer/src/components/**` — эталонная реализация
2. `apps/web-buyer/src/lib/styles.ts` — готовые `card`, `pill`, `ctaPrimary`, `ctaSoft`, `inputStyle`
3. `packages/ui` — shared components (если уже есть нужное)

**Не дублируй паттерны** из buyer'а — экспортируй (или скопируй 1-to-1 с теми же tokens).

---

## 15. История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | v1. Spacing 4/8/12/16/20/24/32/48/64. Radius 4/6/8/12/16/24/9999. Shadows минимальные. На основе web-buyer. |
