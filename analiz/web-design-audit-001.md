# [WEB-DESIGN-AUDIT-001] Дизайн-аудит web-buyer + web-seller

- **Дата:** 2026-05-04
- **Статус:** 🟡 Аудит — findings ниже. Фиксы НЕ применены, ждут согласия Полата (зона Азима).
- **Аудитор:** параллельная сессия Claude.
- **Критерии:** 1) Контраст WCAG AA 4.5:1, 2) Hit-area 44pt min, 3) Hierarchy ≤3 уровней, 4) Spacing на 4px-grid, 5) A11y (role/tabIndex/onKeyDown/aria-label/aria-hidden/reduced-motion).
- **Файлы scope:** `apps/web-buyer/src/**/*`, `apps/web-seller/src/**/*`, `packages/ui/*`.

---

## 1. Контраст WCAG AA

### web-buyer (light theme, bg `#FAFAF7`)
- ✅ `textPrimary #0F1115` — ~17:1, отлично.
- ✅ `textMuted #5C6470` — ~5.5:1.
- 🟡 `textDim #8A93A0` — **~3.0:1** на светлом. Для 14px+ small text **НЕ проходит AA 4.5:1**. Используется в: footer, prefix `savdo.uz/`, helper text, breadcrumbs `@slug · city`, `× quantity`, `mt-0.5 text-xs`. Допустимо только для UI-элементов 3:1 (иконки/бордеры), но регулярно встречается на body/helper text размера 11–13px.
- 🟡 `success #16A34A` — **~3.4:1** на светлом. Для не-bold 14px НЕ проходит. Видно в: «Бесплатно» в checkout (`text-sm`), «Скопировано»-badges, success дотах. Заменить на `#15803D` green-700 (~4.7:1).
- 🟡 `warning #D97706` — **~3.5:1** на светлом. Для 12px PENDING-badge не проходит. `#B45309` amber-700 (~5.5:1).
- ✅ `accent #7C3AED` — ~7:1.
- ✅ `danger #DC2626` — ~5.9:1.

### web-seller (dark theme, bg `#0F172A` / surface `#1E293B`)
- ✅ `textPrimary #F1F5F9` — ~12–16:1.
- ✅ `textMuted #94A3B8` — ~5.0–6.7:1.
- 🔴 `textDim #64748B` — **~3.1–4.2:1**. На surface `#1E293B` — **3.1:1**, на bg `#0F172A` — **4.2:1**. Для 14px small text НЕ проходит AA. Используется массово: header строк таблицы (`text-[11px] uppercase`), helper text «Нажми чтобы скопировать», timestamps, `text-xs mt-0.5`, mobile drawer хинты, settings labels uppercase. **Сотни вхождений** через `colors.textDim`. Поднять до `#94A3B8` либо ввести `textCaption` для 11px-uppercase.
- ✅ `accent`, `success`, `warning`, `danger` — все ≥5:1 на тёмном.

---

## 2. Hit-area (минимум 44×44pt)

### web-buyer 🔴 P0 на mobile (это buyer-storefront, mobile-first)
- 🔴 `BottomNavBar` link `px-3 py-1` (4px vertical padding) → итог ~40–42px. Под 44.
- 🔴 `Header.NavIconLink` `w-9 h-9` = **36×36px**. Cart, Bell, Profile, Chat, Orders.
- 🔴 `ProductPage` back-button и share-button `w-9 h-9` = **36×36px**.
- 🔴 `cart/page.tsx` quantity `+`/`−` buttons `w-7 h-7` = **28×28px**. Trash без обёртки = ~16px clickable.
- 🔴 `ProfilePage` «Изменить фото»: `inline-flex … text-xs` без min-h — ~16–20px клик.
- 🔴 `OrdersPage` filter pills `px-3.5 py-1.5` ≈ 28px высота.
- 🔴 `(shop)/[slug]/page.tsx` категории chips `px-4 py-1.5` ≈ 30px.
- 🔴 `ProductPage` image dot-buttons (8×8px) — невозможно попасть пальцем.
- 🟡 `ProductPage` thumbnail `w-16 h-16` = 64px ✅, но option-pill `px-3.5 py-1.5` ≈ 30px.

### web-seller 🟡 (desktop primary, mobile drawer)
- 🟡 Sidebar nav links `px-3 py-2.5` ≈ 36–40px. На mobile drawer — мало.
- 🔴 Sidebar bottom logout button `w-8 h-8` = **32×32px**. Copy-link `text-[11px] px-2 py-0.5` ≈ 22px.
- 🔴 Mobile hamburger `w-8 h-8` = **32×32px**.
- 🔴 Top header notif bell — голая svg `w-5 h-5` без обёртки `<button>` с padding = ~20px клик.
- 🔴 `ProductsPage` row actions: «Скрыть»/«Опубликовать» — текст без min-height; mobile copy buttons `p-1.5 -m-1.5` ≈ 28–32px (через negative margin).
- 🔴 `OrdersPage` action buttons `px-3 py-1.5` ≈ 28px.
- 🔴 `Settings.ToggleRow` switch — `w-10 h-[22px]` = **40×22px**. Сильно ниже 44.
- 🔴 `Settings` category Trash2 `size={14}` — пиксель-уровень клик.
- 🔴 `Settings` confirm/cancel inline (`padding: 3px 8px`) ≈ 22px.
- ✅ Login page input/button `h-11` = 44px.

---

## 3. Hierarchy

- ✅ web-buyer Home, ProductPage, Cart, Checkout, Orders, Profile — ≤3 уровней (header → секции → элементы).
- ✅ web-seller Dashboard, Products, Orders, Settings — структура 2-колонок/секций понятна.
- 🟡 `web-seller (dashboard)/layout.tsx` sidebar — много визуально похожих блоков (nav пункт + store-link card + user card + logout) на одном тоне `surfaceMuted` без явного разделителя. На mobile drawer — ощущение «стенки».
- 🟡 `Settings` page — 5 секций по 2 колонки, без визуального grouping (биллинг/контент/notify). Marginal.

---

## 4. Spacing на 4px-grid

- 🟡 Off-grid находки (Tailwind arbitrary values):
  - `BottomNavBar` `gap-[3px]` (3px), `min-w-[17px] h-[17px]` (badge).
  - `Header` badge `min-w-[16px] h-4 px-1`.
  - `ProductCard` slider dots `width: 10/5, height: 5`.
  - Cart `gap-2.5` (10px), `py-3.5` (14px) — массово в формах/CTA.
  - Profile avatar `mt-0.5` (2px).
  - Seller `minWidth: 18, padding: '0 3px', fontSize: 9, height: 14` в notif badge.
- **Итог:** не критично, но дизайн-система формально нарушена. При рефакторинге унифицировать на 4/8/12/16/20/24/32.

---

## 5. A11y

### Положительное
- ✅ `Header.NavIconLink` имеет `aria-label`.
- ✅ Sidebar `<Link>`/`<button>` с aria-label на иконочных.
- ✅ `Settings.ToggleRow` — `role="switch" aria-checked`.
- ✅ `Settings` Trash, Hamburger, Bell, ProductsPage actions — aria-label.
- ✅ Decorative cover image — `alt=""`.
- ✅ Все интерактивные элементы — `<Link>` или `<button>`. Нет «div=кнопка».

### Проблемы
- 🔴 **`prefers-reduced-motion: reduce` не реализован НИГДЕ.** В `web-seller/globals.css` есть `@keyframes fadeSlideIn` без media-guard. В компонентах массово `transition-all duration-300`, `animate-pulse`, `animate-spin`. Нужен глобальный CSS:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
  }
  ```
- 🔴 web-buyer Cart `+`/`−` quantity-buttons: только символ-текст без `aria-label="Уменьшить количество"` / «Увеличить».
- 🔴 web-buyer ProductPage image-dots — `<button>` без `aria-label="Перейти к фото 2"` и без `aria-current`.
- 🔴 web-seller Settings inline confirm/cancel (`<button><Check/>`, `<button><X/>`) — без aria-label.
- 🟡 Skeleton-загрузчики не имеют `role="status"` / `aria-busy="true"` — невидимы для AT.
- 🟡 web-seller `OrdersPage.CancelModal` — нет `role="dialog" aria-modal="true" aria-labelledby` на корне модалки. Focus-trap отсутствует.
- 🟡 web-seller `(dashboard)/layout.tsx` sidebar `<nav>` без `aria-label="Главная навигация"`.

---

## Приоритезация фиксов

### P0 (mobile UX broken)
1. **Hit-area BottomNavBar/Header NavIconLink/back/share/+−** в web-buyer → поднять до 44px (`w-11 h-11` + py-3). Это ломает мобильный buyer storefront — основной трафик.
2. **`prefers-reduced-motion` глобальный guard** в обоих globals.css.

### P1 (compliance / readability)
3. **Контраст `textDim`**: light → `#6B7280` (~4.6:1), dark → `#94A3B8` или ввести `textCaption` для uppercase 11px.
4. **`success #16A34A` → `#15803D`** в web-buyer для текстовых статусов.
5. **`aria-label` на quantity +/−**, image-dots, settings confirm/cancel.

### P2 (polish)
6. Spacing off-grid → унификация (после рефакторинга tokens).
7. Skeleton `role="status" aria-busy`.
8. Modal `role="dialog"` + focus-trap в `OrdersPage.CancelModal`.
9. Sidebar `<nav aria-label>`.

---

## Замечания по архитектуре (не P0)

- `packages/ui/tokens/colors.ts` содержит **4 варианта палитры** (variantA/B/C/D в `bloom`/`ember`) с активной `variantD`. Активные `colors`-объекты в обоих апп **не используют** `packages/ui/tokens` — каждый апп держит свою таблицу в `lib/styles.ts`. Если выберете единую палитру — синхронизировать токены.
- `web-buyer/lib/styles.ts` ещё содержит `glass` deprecated-токены — не везде стёрты (Phase 2-3 миграции).

---

## Что НЕ затронуто

- Не открывал dev-сервер (по протоколу — research first).
- Не запускал axe-core / Lighthouse — это требует браузер.
- Не правил код. Цифры контраста — приближённо по HEX-токенам.

---

## Что нужно от Полата перед фиксом

- 🟢 Можно ли поднять hit-area BottomNavBar/Header в web-buyer? Bottom nav вырастет ~64px → ~76px.
- 🟢 Согласовать сдвиг tokens (`textDim`, `success`) — проще раз поправить таблицу.
- 🟢 Зона Азима: фиксить мне самому или оставить как ping для него? (`CLAUDE.md` говорит web-* у Азима.)
