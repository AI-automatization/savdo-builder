# Buyer Design — «Soft Color Lifestyle» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Переписать визуальный слой `apps/web-buyer` под спеку «Soft Color Lifestyle» — отстройка от Qlay и AI-template'ов.

**Architecture:** Все визуальные изменения через CSS variables в `globals.css` + типизированные токены в `lib/styles.ts`. Бэкенд / hooks / query keys / API клиенты не трогаем — меняется только presentation layer. Brand-color пока хардкодом (терракота `#7C3F2E`); selector в `web-seller` — postMVP.

**Tech Stack:** Next.js 16 App Router · Tailwind v4 + DaisyUI · TanStack Query · Inter (через next/font, заменяет Geist) · Lucide React (уже в стеке)

**Spec:** [`docs/superpowers/specs/2026-05-05-buyer-design-differentiation-design.md`](../specs/2026-05-05-buyer-design-differentiation-design.md)

**Verification protocol:** Локальный `pnpm build` и `pnpm dev` запрещены (ПК Азима зависает). Каждая задача завершается push'ем в ветку `web-buyer` → проверка на Railway URL. Если TS-ошибка — Railway покажет в build log.

---

## File map

### Меняем
- `apps/web-buyer/src/app/globals.css` — переписать `:root` токены, добавить brand-палитру (Task 1)
- `apps/web-buyer/src/lib/styles.ts` — расширить `colors`, добавить новые presets, удалить `glass*` deprecated (Task 1)
- `apps/web-buyer/src/app/layout.tsx` — заменить Geist на Inter (Task 1)
- `apps/web-buyer/src/components/layout/Header.tsx` — Task 2
- `apps/web-buyer/src/components/layout/BottomNavBar.tsx` — Task 2
- `apps/web-buyer/src/app/(shop)/page.tsx` — homepage с recent stores (Task 3)
- `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` — storefront landing (Task 3)
- `apps/web-buyer/src/components/home/RecentStores.tsx` — Task 3
- `apps/web-buyer/src/components/store/ProductCard.tsx` — Task 4
- `apps/web-buyer/src/components/store/ProductsWithSearch.tsx` — Task 4
- `apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx` — Task 4
- `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx` — Task 5
- `apps/web-buyer/src/app/(minimal)/cart/page.tsx` — Task 6
- `apps/web-buyer/src/app/(minimal)/checkout/page.tsx` — Task 7
- `apps/web-buyer/src/app/(shop)/chats/page.tsx` — Task 8
- `apps/web-buyer/src/components/chat/ChatComposerModal.tsx` — Task 8
- `apps/web-buyer/src/app/(shop)/orders/page.tsx` — Task 9
- `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx` — Task 9
- `apps/web-buyer/src/app/(shop)/profile/page.tsx` — Task 10
- `apps/web-buyer/src/app/(shop)/wishlist/page.tsx` — Task 10
- `apps/web-buyer/src/app/(shop)/notifications/page.tsx` — Task 10

### НЕ трогаем
- `apps/api/**` — домен Полата
- `packages/db`, `packages/types` — Полат
- `apps/web-seller`, `apps/admin`, `apps/mobile-*` — отдельные домены
- Все `hooks/*`, `lib/api/*` — логика остаётся, меняется только presentation
- Dark theme в `globals.css` — оставляем как есть до отдельной итерации (см. спеку)

---

## Task 1 — Foundation tokens + Inter font

**Files:**
- Modify: `apps/web-buyer/src/app/globals.css`
- Modify: `apps/web-buyer/src/lib/styles.ts`
- Modify: `apps/web-buyer/src/app/layout.tsx`

- [ ] **Step 1.1: Заменить `:root` light tokens в `globals.css`**

В `apps/web-buyer/src/app/globals.css` замени блок `:root { ... color-scheme: light; }` (строки 12-38) на:

```css
:root {
  /* ── Light — Soft Color Lifestyle ─────────────────────────────────────── */
  /* Neutral base */
  --color-bg:                #FBF7F0;
  --color-surface:           #FFFFFF;
  --color-surface-muted:     #FBF7F0;
  --color-surface-elevated:  #FFFFFF;
  --color-surface-sunken:    #F4EEE0;
  --color-divider:           #EFE8DA;
  --color-border:            #EFE8DA;
  --color-border-strong:     #D8CFB8;
  --color-text-primary:      #1F1A12;
  --color-text-muted:        #8A7D6A;
  --color-text-dim:          #B5A88E;
  --color-text-body:         #3D3525;
  --color-text-strong:       #1F1A12;

  /* Brand — terracotta default (per-store override planned) */
  --color-brand:             #7C3F2E;
  --color-brand-hover:       #6A3526;
  --color-brand-muted:       rgba(124,63,46,0.06);
  --color-brand-border:      rgba(124,63,46,0.15);
  --color-brand-text-on-bg:  #FBF7F0;

  /* Accent — alias for brand to keep existing components working */
  --color-accent:            var(--color-brand);
  --color-accent-hover:      var(--color-brand-hover);
  --color-accent-muted:      var(--color-brand-muted);
  --color-accent-border:     var(--color-brand-border);
  --color-accent-text-on-bg: var(--color-brand-text-on-bg);

  /* Semantic */
  --color-success:           #4A6B45;
  --color-warning:           #9C7A2E;
  --color-danger:            #8B3A3A;
  --color-telegram:          #2AABEE;
  --color-skeleton:           #EFE8DA;

  color-scheme: light;
}
```

- [ ] **Step 1.2: Обновить body-стили в `globals.css`**

Замени блок с `body {...}` (строки 76-82) на:

```css
body {
  background: var(--color-bg);
  color: var(--color-text-body);
  font-family: var(--font-inter), -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  font-feature-settings: 'cv11', 'ss01';
  transition: background-color 200ms ease, color 200ms ease;
}
```

И в `@theme inline` блок (строки 69-74) — замени `--font-sans` строку:

```css
@theme inline {
  --color-background: var(--color-bg);
  --color-foreground: var(--color-text-primary);
  --font-sans: var(--font-inter);
}
```

(удали строку `--font-mono: var(--font-geist-mono);` если она там — больше не нужна).

- [ ] **Step 1.3: Подключить Inter в `layout.tsx`**

Открой `apps/web-buyer/src/app/layout.tsx`. Замени импорт Geist на Inter:

```tsx
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-inter',
  display: 'swap',
});
```

В `<html>` теге замени `className={geistSans.variable}` (или похожее) на `className={inter.variable}`. Если рядом импортирован `Geist_Mono` — удали его и его applyation. Все остальные подключения (theme provider, query provider) оставляем как есть.

- [ ] **Step 1.4: Расширить `lib/styles.ts`**

В `apps/web-buyer/src/lib/styles.ts` в `export const colors` объекте добавь после существующих токенов (после `accentTextOnBg` строки):

```ts
  // Brand (canonical names; accent* остаются как aliases)
  brandHover:      'var(--color-brand-hover)',
  brandMuted:      'var(--color-brand-muted)',
  brandBorder:     'var(--color-brand-border)',
  brandTextOnBg:   'var(--color-brand-text-on-bg)',
  // Type — extended
  textBody:        'var(--color-text-body)',
  textStrong:      'var(--color-text-strong)',
```

В этом же файле удали все 3 deprecated блока (`glass`, `glassDim`, `glassDark` — строки 105-127). Если что-то ещё их импортирует — Railway покажет в build log при пуше; поправим ad-hoc.

- [ ] **Step 1.5: Commit + push**

```bash
git add apps/web-buyer/src/app/globals.css apps/web-buyer/src/lib/styles.ts apps/web-buyer/src/app/layout.tsx
git commit -m "feat(web-buyer): foundation tokens — Soft Color Lifestyle palette + Inter font"
git push origin main
git checkout web-buyer
git merge main --no-edit
git push origin web-buyer
git checkout main
```

Проверь Railway URL для buyer — должен сменить весь визуальный фон на тёплый off-white, цвет акцента — терракота. Если Railway упал на TS-ошибке (deprecated glass импорт) — открой failing файл и замени `glass` → `card`, `glassDim`/`glassDark` → `cardMuted`. Затем ещё один коммит.

---

## Task 2 — Header + BottomNavBar

**Files:**
- Modify: `apps/web-buyer/src/components/layout/Header.tsx`
- Modify: `apps/web-buyer/src/components/layout/BottomNavBar.tsx`
- Modify (если нужно): `apps/web-buyer/src/components/icons.tsx`

- [ ] **Step 2.1: Header — переписать**

В `Header.tsx` ключевые изменения:
- Padding строки логотипа: `px-4 py-3` (увеличить вертикальный padding до 14-16px)
- Логотип: `style={{ color: colors.brand }}`, `font-weight: 700`, `letter-spacing: -0.02em` (уже есть — проверь)
- Search input: убрать жёлтую обводку, поставить `border:1px solid colors.border`, `borderRadius:6px`, `background:colors.surface`
- Все NavIconLink — `color:colors.textBody` дефолтно, на hover `background:colors.surfaceMuted`
- Badge стилей: `background:colors.brand`, `color:colors.brandTextOnBg`
- Удалить `bordered={false}` пропсы у `<ThemeToggle>` если больше не нужны — оставить toggle как есть
- Profile иконка остаётся справа после ThemeToggle (как в bf1f4b8)

Замени все `colors.accent*` ссылки на `colors.brand*` (новые алиасы) в этом файле. Это nop-замена — accent остался алиасом — но коммит будет читабельнее.

- [ ] **Step 2.2: BottomNavBar — переписать**

В `BottomNavBar.tsx`:
- Активный таб: `color:colors.brand` (вместо `colors.accent`)
- Неактивный: `color:colors.textMuted`
- Иконки текущие (`IcoShop`, `IcoCart` и т.д. из `@/components/icons`) — оставляем как есть
- Badge: `background:colors.brand`, `color:colors.brandTextOnBg`
- Padding-top контейнера: 10-12px, padding-bottom: использовать `env(safe-area-inset-bottom)` (уже есть)
- Border-top: `1px solid colors.divider`
- Background: `colors.surface`

- [ ] **Step 2.3: Commit + push**

```bash
git add apps/web-buyer/src/components/layout/
git commit -m "feat(web-buyer): redesign Header + BottomNavBar to Soft Color Lifestyle"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

Проверь на Railway: header теперь тёплый, бордер мягкий бежевый, badge'ы терракотовые.

---

## Task 3 — Storefront landing (homepage + store page)

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/page.tsx` — homepage (список магазинов / recent stores)
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/page.tsx` — конкретный магазин
- Modify: `apps/web-buyer/src/components/home/RecentStores.tsx`

- [ ] **Step 3.1: Storefront `[slug]/page.tsx` — hero + sections**

Это самая большая правка. Структура:

1. **Hero block** — replace existing hero. Mobile: photo 200px + brand-color block stacked vertically. Desktop: `grid-template-columns:6fr 4fr`, photo слева, brand-block справа (см. спеку §Storefront landing → Hero).

```tsx
// Mobile + desktop responsive hero
<section className="overflow-hidden">
  <div className="md:grid md:grid-cols-[6fr_4fr]">
    {/* photo */}
    <div className="relative h-[200px] md:h-auto md:min-h-[340px] overflow-hidden">
      {store.coverImageUrl ? (
        <Image src={store.coverImageUrl} alt={store.name} fill className="object-cover" priority />
      ) : (
        <div style={{ background: colors.surfaceSunken }} className="w-full h-full" />
      )}
    </div>
    {/* brand block */}
    <div
      className="px-6 py-8 md:px-8 md:py-10 flex flex-col justify-center"
      style={{ background: colors.brand, color: colors.brandTextOnBg }}
    >
      <div className="text-[10px] tracking-[0.2em] uppercase opacity-70 mb-3">— {store.name}</div>
      <h1 className="text-2xl md:text-4xl font-bold leading-tight tracking-tight mb-3">
        {store.tagline ?? store.name}
      </h1>
      {store.description && (
        <p className="text-sm opacity-85 leading-relaxed mb-5 line-clamp-3">{store.description}</p>
      )}
      <div className="flex gap-2.5">
        <button
          className="flex-1 md:flex-initial px-5 py-3 text-xs font-bold rounded"
          style={{ background: colors.brandTextOnBg, color: colors.brand }}
        >
          Все {store.productCount ?? ''} товара →
        </button>
        <button
          className="px-5 py-3 text-xs font-semibold rounded border"
          style={{ borderColor: 'rgba(251,247,240,0.4)', color: colors.brandTextOnBg }}
        >
          💬 Чат
        </button>
      </div>
    </div>
  </div>
</section>
```

(Адаптируй имена полей под реальную модель `Store` из `types`. Если `tagline` не существует — фолбэк на `name`. Если `productCount` не приходит — используй `products.length` если они уже подгружены.)

2. **Sections** — пишутся ниже hero. Editorial label паттерн:

```tsx
function SectionHeader({ label, link }: { label: string; link?: { text: string; href: string } }) {
  return (
    <div className="flex justify-between items-baseline px-4 md:px-6 mb-3 md:mb-4">
      <div className="text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
        — {label}
      </div>
      {link && (
        <Link href={link.href} className="text-xs font-semibold" style={{ color: colors.brand }}>
          {link.text}
        </Link>
      )}
    </div>
  );
}
```

3. **Divider между секциями** — `<hr style={{ border: 'none', borderTop: '1px solid ' + colors.divider }} className="mx-4 md:mx-6" />`

4. **Product grid** — 2 columns on mobile, 4 on desktop, gap 10px mobile / 14px desktop:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 px-4 md:px-6">
  {products.map(p => <ProductCard key={p.id} product={p} />)}
</div>
```

5. **Categories chip-row** — горизонтальный scroll на mobile:
```tsx
<div className="flex gap-2 overflow-x-auto scrollbar-none px-4 md:px-6 pb-1">
  {categories.map(c => (
    <Link key={c.id} href={`/${slug}?category=${c.slug}`}
      className="flex-shrink-0 px-4 py-2 text-xs font-semibold rounded"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      {c.name} <span style={{ color: colors.textMuted, fontWeight: 400 }}>· {c.count}</span>
    </Link>
  ))}
</div>
```

- [ ] **Step 3.2: Homepage `(shop)/page.tsx` — список recent stores**

Если homepage сейчас рендерит «недавние магазины» через `<RecentStores />`, оставь логику но обнови визуал:
- Заголовок страницы: «— Магазины» editorial label
- Карточка магазина: photo cover + название (sub-head 18px/600) + brand-color индикатор (маленький круг)
- Без бордеров, минималистично

Если homepage пока пустая или редиректит — оставь редирект, добавь editorial-метку «— Все магазины» в плейсхолдере.

- [ ] **Step 3.3: RecentStores компонент**

В `components/home/RecentStores.tsx`:
- Карточка: borderless, photo aspect 4:3, скругление 6px
- Имя магазина под фото — `text-sm font-semibold`, цвет `colors.textStrong`
- Счётчик товаров — `text-[11px]`, цвет `colors.textMuted`

- [ ] **Step 3.4: Commit + push**

```bash
git add apps/web-buyer/src/app/\(shop\)/page.tsx apps/web-buyer/src/app/\(shop\)/\[slug\]/page.tsx apps/web-buyer/src/components/home/
git commit -m "feat(web-buyer): redesign storefront — hero + sections + product grid"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

Открой Railway URL: `/{любой_слаг_магазина}` — должен быть hero с фото слева/брендблоком справа на desktop, стек на mobile.

---

## Task 4 — ProductCard + product list controls

**Files:**
- Modify: `apps/web-buyer/src/components/store/ProductCard.tsx`
- Modify: `apps/web-buyer/src/components/store/ProductsWithSearch.tsx`
- Modify: `apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx`

- [ ] **Step 4.1: ProductCard — borderless atom**

Полная замена визуала. Структура:
```tsx
<Link href={...} className="block group">
  <div className="relative aspect-square overflow-hidden rounded-md mb-2">
    <Image src={product.imageUrl} alt={product.name} fill className="object-cover" sizes="(max-width:768px) 50vw, 25vw" />
    {/* Heart overlay */}
    <button onClick={(e) => { e.preventDefault(); /* toggle wishlist */ }}
      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition"
      style={{ background: 'rgba(255,255,255,0.85)' }}
    >
      <Heart size={14} fill={inWishlist ? colors.brand : 'none'} stroke={inWishlist ? colors.brand : colors.textBody} />
    </button>
  </div>
  <div className="text-[12px] md:text-[13px] leading-snug" style={{ color: colors.textBody }}>
    {product.name}
  </div>
  <div className="text-[13px] font-bold mt-0.5" style={{ color: colors.textStrong }}>
    {formatPrice(product.priceMinor)}
  </div>
</Link>
```

Ключевое: НИКАКИХ бордеров на самой карточке, цена в `colors.textStrong` (НЕ brand). Hover на desktop добавь:
```tsx
<div className="... transition-transform group-hover:-translate-y-0.5">
```

Сохрани все existing props и логику (`useToggleWishlist`, optimistic toggle и т.д.) — меняется только разметка.

- [ ] **Step 4.2: ProductsWithSearch — обновить контейнер**

Только wrapper-стили, логика та же:
- Search input: `background:colors.surface`, `border:1px solid colors.border`, `borderRadius:6px`, `padding:9px 12px`
- Sort/filter buttons: outline style — `border:1px solid colors.border`, `color:colors.textMuted`, активный — `background:colors.textStrong`, `color:colors.brandTextOnBg`
- Grid обернуть в `grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5`

- [ ] **Step 4.3: CategoryAttributeFilters — chip styling**

Filter chips: padding `8px 14px`, `border-radius:4px`, `background:colors.surface`, `border:1px solid colors.border`. Active: `background:colors.textStrong`, `color:colors.brandTextOnBg`. Counter «· N» с `colors.textMuted`.

- [ ] **Step 4.4: Commit + push**

```bash
git add apps/web-buyer/src/components/store/
git commit -m "feat(web-buyer): redesign ProductCard + filters — borderless, dark price"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

Открой любой storefront — карточки без бордеров, ♡ белый кружок справа сверху, цена тёмная.

---

## Task 5 — Product detail page

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/[slug]/products/[id]/page.tsx`

- [ ] **Step 5.1: Layout split desktop / vertical mobile**

Desktop split: `grid grid-cols-1 md:grid-cols-[7fr_5fr] gap-6 md:gap-8 p-4 md:p-6`. Galery слева, info справа. Description + related — full-width ниже split (вне грид-контейнера).

Gallery:
```tsx
<div>
  <div className="aspect-square overflow-hidden rounded-lg mb-2.5">
    <Image src={selectedImage} alt={...} width={600} height={600} className="w-full h-full object-cover" />
  </div>
  <div className="grid grid-cols-4 gap-2">
    {images.map((src, i) => (
      <button key={i} onClick={() => setSelectedImage(src)}
        className="aspect-square overflow-hidden rounded-md transition"
        style={{ outline: i === activeIdx ? `2px solid ${colors.textStrong}` : 'none', outlineOffset: '-1px', opacity: i === activeIdx ? 1 : 0.65 }}>
        <Image src={src} alt="" width={150} height={150} className="w-full h-full object-cover" />
      </button>
    ))}
  </div>
</div>
```

Mobile gallery: full-bleed `<Image>` 1:1 + dots-pagination + counter top-right (используй существующий swiper или добавь простой `useState` слайдер).

- [ ] **Step 5.2: Info column**

```tsx
<div>
  <div className="text-[10px] tracking-[0.2em] uppercase" style={{ color: colors.textMuted }}>
    — {product.category?.name ?? 'Товар'}
  </div>
  <h1 className="text-2xl md:text-3xl font-bold leading-tight tracking-tight mt-2.5 mb-2"
      style={{ color: colors.textStrong }}>{product.name}</h1>
  <div className="text-xl md:text-2xl font-bold mb-1" style={{ color: colors.textStrong }}>
    {formatPrice(product.priceMinor)} сум
  </div>
  <div className="text-xs mb-6" style={{ color: colors.textMuted }}>
    {product.stock > 0 ? `В наличии · ${product.stock} шт` : 'Нет в наличии'}
  </div>

  {/* variants — cycle через product.variants */}
  <VariantPicker ... />

  {/* CTA row */}
  <div className="flex gap-2.5 mb-3.5">
    <QtyStepper value={qty} onChange={setQty} />
    <button onClick={addToCart} disabled={product.stock === 0}
      className="flex-1 px-4 py-3.5 text-sm font-bold rounded"
      style={{ background: colors.brand, color: colors.brandTextOnBg }}>
      В корзину · {formatPrice(product.priceMinor * qty)}
    </button>
  </div>
  <button onClick={openChat}
    className="w-full px-4 py-3 text-sm font-semibold rounded border"
    style={{ borderColor: colors.brand, color: colors.brand, background: 'transparent' }}>
    💬 Спросить у продавца
  </button>

  {/* seller card */}
  <SellerCard store={product.store} className="mt-6" />
</div>
```

- [ ] **Step 5.3: VariantPicker — color circles + size pills**

Если `product.variants` имеет `color` опции — рисуй круги 36-40px с двойной обводкой на selected. Если `size` — таблетки 4px radius, selected — fill `colors.textStrong` color `colors.brandTextOnBg`. Обе группы внутри `<div className="mb-4">` с лейблом «Цвет: **{выбранный}**» сверху.

(Использовать существующий variant logic из `lib/variants.ts` — не переписывать, только обёртку.)

- [ ] **Step 5.4: Mobile sticky bottom CTA**

На mobile вынести qty-stepper + «В корзину» в sticky-bottom:
```tsx
<div className="md:hidden sticky bottom-0 border-t flex gap-2.5 p-3"
     style={{ background: colors.surfaceMuted, borderColor: colors.divider }}>
  <QtyStepper ... />
  <button ...>В корзину · {price}</button>
</div>
```

«Спросить у продавца» при этом остаётся inline (выше sticky bar) на mobile.

- [ ] **Step 5.5: Description + related products**

Ниже split — description block с editorial label «— Описание» + body text. Затем 1px divider. Затем «Из этого магазина» с product grid (4 cards desktop, 2 mobile).

- [ ] **Step 5.6: Commit + push**

```bash
git add apps/web-buyer/src/app/\(shop\)/\[slug\]/products/
git commit -m "feat(web-buyer): redesign product detail — gallery+info split, sticky CTA"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Task 6 — Cart page

**Files:**
- Modify: `apps/web-buyer/src/app/(minimal)/cart/page.tsx`

- [ ] **Step 6.1: Layout — store-strip + items + summary**

```tsx
{/* Store strip */}
<div className="flex items-center gap-2.5 px-4 py-3 border-b" style={{ background: colors.surface, borderColor: colors.divider }}>
  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
       style={{ background: colors.brand }}>
    {storeName[0]}
  </div>
  <div className="flex-1">
    <div className="text-[13px] font-semibold" style={{ color: colors.textStrong }}>{storeName}</div>
    <div className="text-[10px]" style={{ color: colors.textMuted }}>отвечает за час</div>
  </div>
  <Link href={`/chats?storeId=${storeId}`} className="text-[11px] font-semibold" style={{ color: colors.brand }}>
    💬 Чат
  </Link>
</div>

{/* Free delivery progress */}
<div className="mx-4 mt-2.5 p-2.5 rounded-md" style={{ background: colors.brandMuted }}>
  <div className="text-[11px]" style={{ color: colors.textBody }}>
    {remaining > 0 ? <>До бесплатной доставки <strong style={{ color: colors.brand }}>{formatPrice(remaining)} сум</strong></> : '✓ Бесплатная доставка'}
  </div>
  {remaining > 0 && (
    <div className="mt-1.5 h-1 rounded" style={{ background: colors.divider }}>
      <div className="h-full rounded" style={{ width: `${Math.min(100, progress)}%`, background: colors.brand }} />
    </div>
  )}
</div>
```

Free-delivery threshold пока хардкодом константой `FREE_DELIVERY_MIN_MINOR = 600_000_00` (или чем имеет смысл) сверху файла. Реальную величину/формулу — отдельной задачей позже.

- [ ] **Step 6.2: Cart items**

Каждый item — на mobile inline без card-фона; на desktop в white card 6px radius с padding 16px.

```tsx
<div className="flex gap-3 py-3.5 border-b md:border-b-0 md:bg-white md:rounded-md md:p-4 md:mb-2"
     style={{ borderColor: colors.divider, opacity: item.outOfStock ? 0.55 : 1 }}>
  <div className="w-[72px] h-[72px] md:w-[88px] md:h-[88px] flex-shrink-0 rounded-md overflow-hidden">
    <Image src={item.product.imageUrl} alt="" width={150} height={150} className="object-cover w-full h-full" />
  </div>
  <div className="flex-1 flex flex-col">
    <div className="text-xs" style={{ color: colors.textStrong }}>{item.product.name}</div>
    <div className="text-[10px] mt-0.5" style={{ color: item.outOfStock ? colors.danger : colors.textMuted }}>
      {item.outOfStock ? 'Нет в наличии' : variantString(item)}
    </div>
    <div className="mt-auto flex justify-between items-center pt-2">
      {item.outOfStock ? (
        <div className="flex gap-2">
          <button className="px-2.5 py-1 text-[10px] font-semibold rounded border" style={{ borderColor: colors.brand, color: colors.brand }}>Уведомить</button>
          <button onClick={() => remove(item.id)} className="text-[10px]" style={{ color: colors.textMuted }}>Удалить</button>
        </div>
      ) : (
        <>
          <QtyStepper value={item.qty} onChange={(q) => update(item.id, q)} compact />
          <div className="text-[13px] font-bold" style={{ color: item.outOfStock ? colors.textMuted : colors.textStrong, textDecoration: item.outOfStock ? 'line-through' : 'none' }}>
            {formatPrice(item.lineTotal)}
          </div>
        </>
      )}
    </div>
  </div>
</div>
```

- [ ] **Step 6.3: Summary + sticky CTA**

Mobile: summary внутри страницы перед sticky CTA. Desktop: sticky right sidebar (`md:sticky md:top-5` в правой колонке split-layout `md:grid md:grid-cols-[7fr_5fr]`).

```tsx
<div style={{ background: colors.surface }} className="p-5 rounded-lg">
  <div className="text-[10px] tracking-[0.18em] uppercase mb-3.5" style={{ color: colors.textMuted }}>— Итого</div>
  <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}><span>Подытог</span><span>{formatPrice(subtotal)}</span></div>
  <div className="flex justify-between text-xs mb-1.5" style={{ color: colors.textMuted }}><span>Доставка</span><span>{formatPrice(delivery)}</span></div>
  <div className="flex justify-between text-base font-bold pt-2.5 mt-1.5"
       style={{ color: colors.textStrong, borderTop: `1px dashed ${colors.divider}` }}>
    <span>К оплате</span><span>{formatPrice(total)}</span>
  </div>
  <Link href="/checkout" className="block w-full mt-4 py-3.5 text-center text-sm font-bold rounded"
        style={{ background: colors.brand, color: colors.brandTextOnBg }}>
    Оформить заказ →
  </Link>
</div>
```

На mobile — последний `<Link>` оборни в `sticky bottom-0` контейнер с padding и `border-top`.

- [ ] **Step 6.4: Commit + push**

```bash
git add apps/web-buyer/src/app/\(minimal\)/cart/
git commit -m "feat(web-buyer): redesign cart — store-strip, free-delivery, OOS-fallback"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Task 7 — Checkout page

**Files:**
- Modify: `apps/web-buyer/src/app/(minimal)/checkout/page.tsx`

- [ ] **Step 7.1: 3-step single-screen layout**

```tsx
<div className="md:grid md:grid-cols-[7fr_5fr] md:gap-6 md:p-6 p-4">
  <div className="space-y-3">
    <h1 className="text-2xl font-bold tracking-tight mb-5" style={{ color: colors.textStrong }}>Оформление</h1>
    <CheckoutStep n={1} title="Контакты" status="filled">
      <div className="text-sm" style={{ color: colors.textBody }}>{user.name} · {user.phone}</div>
    </CheckoutStep>
    <CheckoutStep n={2} title="Доставка">
      <AddressPicker addresses={addresses} selected={selectedAddress} onSelect={setSelectedAddress} />
    </CheckoutStep>
    <CheckoutStep n={3} title="Оплата">
      <PaymentPicker selected={paymentMethod} onSelect={setPaymentMethod} />
    </CheckoutStep>
  </div>

  <OrderSummary items={items} subtotal={subtotal} delivery={delivery} total={total} onSubmit={placeOrder} />
</div>
```

`CheckoutStep` — локальный helper компонент в этом же файле:

```tsx
function CheckoutStep({ n, title, status, children }: { n: number; title: string; status?: 'filled'; children: React.ReactNode }) {
  return (
    <div className="p-4 md:p-5 rounded-lg" style={{ background: colors.surface }}>
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: colors.brand }}>{n}</div>
        <div className="text-sm font-bold" style={{ color: colors.textStrong }}>{title}</div>
        {status === 'filled' && (
          <button className="ml-auto text-xs font-semibold" style={{ color: colors.brand }}>Изменить</button>
        )}
      </div>
      <div className="pl-9">{children}</div>
    </div>
  );
}
```

- [ ] **Step 7.2: AddressPicker — address cards**

```tsx
<div className="space-y-2.5">
  {addresses.map(addr => (
    <button key={addr.id} onClick={() => onSelect(addr.id)}
      className="w-full text-left p-3.5 rounded-md transition"
      style={{ background: colors.surface, border: `${selected === addr.id ? 2 : 1}px solid ${selected === addr.id ? colors.brand : colors.border}` }}>
      <div className="text-xs font-semibold" style={{ color: colors.textStrong }}>{addr.label}</div>
      <div className="text-[11px] mt-0.5" style={{ color: colors.textBody }}>{addr.line1}</div>
      <div className="text-[10px] mt-1.5" style={{ color: colors.textMuted }}>Курьер · {addr.deliveryEstimate}</div>
    </button>
  ))}
  <button className="w-full p-2.5 rounded-md text-xs"
    style={{ background: 'transparent', border: `1px dashed ${colors.textMuted}`, color: colors.textMuted }}>
    + Новый адрес
  </button>
</div>
```

- [ ] **Step 7.3: PaymentPicker — radio cards**

3 опции: «Наличные курьеру» (default selected), «Картой курьеру» (UzCard / Humo), «Online (Payme/Click)» disabled с `Скоро` badge.

```tsx
const methods = [
  { id: 'cash',   label: 'Наличные курьеру', sub: 'оплата при получении', disabled: false },
  { id: 'card',   label: 'Картой курьеру',   sub: 'UzCard / Humo POS-терминал', disabled: false },
  { id: 'online', label: 'Online (Payme / Click)', sub: 'Скоро', disabled: true },
];

<div className="space-y-2 md:grid md:grid-cols-3 md:gap-2.5 md:space-y-0">
  {methods.map(m => (
    <button key={m.id} disabled={m.disabled} onClick={() => onSelect(m.id)}
      className="text-left p-3.5 rounded-md transition disabled:opacity-55 disabled:cursor-not-allowed"
      style={{ background: colors.surface, border: `${selected === m.id ? 2 : 1}px ${m.disabled ? 'dashed' : 'solid'} ${selected === m.id ? colors.brand : colors.border}` }}>
      <div className="text-xs font-semibold flex items-center gap-1.5" style={{ color: m.disabled ? colors.textMuted : colors.textStrong }}>
        {m.label}
        {m.disabled && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold" style={{ background: colors.brandMuted, color: colors.brand }}>Скоро</span>}
      </div>
      <div className="text-[10px] mt-0.5" style={{ color: colors.textMuted }}>{m.sub}</div>
    </button>
  ))}
</div>
```

- [ ] **Step 7.4: OrderSummary**

Sticky-right на desktop, в потоке внизу на mobile. Содержит mini-items (48px thumb + name + variant + price), subtotal/delivery/total breakdown, submit button «Подтвердить заказ · {total}» в brand-color, disclaimer.

- [ ] **Step 7.5: Commit + push**

```bash
git add apps/web-buyer/src/app/\(minimal\)/checkout/
git commit -m "feat(web-buyer): redesign checkout — 3-step single-screen"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Task 8 — Chat list + thread

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/chats/page.tsx`
- Modify: `apps/web-buyer/src/components/chat/ChatComposerModal.tsx`

- [ ] **Step 8.1: Chat list page**

```tsx
<div>
  <div className="px-4 py-3.5 border-b" style={{ borderColor: colors.divider }}>
    <h1 className="text-lg font-bold" style={{ color: colors.textStrong }}>Чаты</h1>
  </div>

  {/* search */}
  <div className="px-4 py-2.5">
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-md" style={{ background: colors.surface, border: `1px solid ${colors.border}` }}>
      <Search size={14} style={{ color: colors.textMuted }} />
      <input placeholder="Поиск магазинов" className="flex-1 bg-transparent outline-none text-xs" />
    </div>
  </div>

  {/* filter chips */}
  <div className="px-4 pb-2 flex gap-1.5">
    <Chip active>Все · {chats.length}</Chip>
    <Chip>Непрочитанные · {unreadCount}</Chip>
  </div>

  {/* list */}
  {chats.map(chat => (
    <Link key={chat.id} href={`/chats/${chat.id}`}
      className="flex gap-3 px-4 py-3 border-b transition"
      style={{ background: chat.unreadCount > 0 ? colors.brandMuted : 'transparent', borderColor: colors.divider }}>
      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
           style={{ background: chat.store.brandColor ?? colors.brand }}>
        {chat.store.name[0]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div className="text-[13px] font-bold" style={{ color: colors.textStrong }}>{chat.store.name}</div>
          <div className="text-[10px]" style={{ color: colors.textMuted }}>{formatTime(chat.lastMessageAt)}</div>
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <div className="text-xs truncate font-semibold" style={{ color: colors.textBody }}>{chat.lastMessage}</div>
          {chat.unreadCount > 0 && (
            <div className="ml-2 min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
                 style={{ background: chat.store.brandColor ?? colors.brand }}>
              {chat.unreadCount}
            </div>
          )}
        </div>
      </div>
    </Link>
  ))}
</div>
```

(Если в `Store` модели нет `brandColor` — пока хардкодом терракота. Поле будет добавлено в Phase 2.)

- [ ] **Step 8.2: Chat thread (composer modal или separate page)**

Если в текущем коде чат-тред открывается модалкой — обновляй `ChatComposerModal`. Если отдельной страницей — найди файл (мог называться `chats/[id]/page.tsx` или ChatThreadView).

Bubbles:
```tsx
{messages.map(msg => {
  const mine = msg.authorId === currentUserId;
  return (
    <div key={msg.id} className={`max-w-[75%] ${mine ? 'self-end' : 'self-start'}`}>
      <div className="px-3 py-2 text-[13px] leading-snug"
           style={{
             background: mine ? colors.brand : colors.surface,
             color: mine ? colors.brandTextOnBg : colors.textStrong,
             borderRadius: mine ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
             border: mine ? 'none' : `1px solid ${colors.divider}`,
           }}>
        {msg.text}
      </div>
      <div className={`text-[9px] mt-1 ${mine ? 'text-right' : ''}`} style={{ color: colors.textMuted }}>
        {formatTime(msg.createdAt)} {mine && '· ✓✓'}
      </div>
    </div>
  );
})}
```

Pinned product context (если `chat.pinnedProduct` существует):
```tsx
<div className="flex gap-2.5 items-center px-4 py-2.5 border-b"
     style={{ background: colors.brandMuted, borderColor: colors.brandBorder }}>
  <Image src={chat.pinnedProduct.imageUrl} alt="" width={40} height={40} className="rounded" />
  <div className="flex-1 min-w-0">
    <div className="text-[11px] truncate" style={{ color: colors.textBody }}>{chat.pinnedProduct.name}</div>
    <div className="text-[11px] font-bold" style={{ color: colors.brand }}>{formatPrice(chat.pinnedProduct.priceMinor)}</div>
  </div>
  <Link href={`/${slug}/products/${chat.pinnedProduct.id}`} className="text-[10px] font-semibold" style={{ color: colors.brand }}>
    Открыть →
  </Link>
</div>
```

Composer:
```tsx
<div className="sticky bottom-0 flex items-center gap-2 p-2.5 border-t"
     style={{ background: colors.surface, borderColor: colors.divider }}>
  <button className="w-8 h-8 flex items-center justify-center" style={{ color: colors.textMuted }}>📎</button>
  <input ... className="flex-1 px-3 py-2.5 rounded-full text-xs" style={{ background: colors.surfaceMuted }} />
  <button onClick={send} className="w-9 h-9 rounded-full flex items-center justify-center text-white"
          style={{ background: colors.brand }}>→</button>
</div>
```

- [ ] **Step 8.3: Commit + push**

```bash
git add apps/web-buyer/src/app/\(shop\)/chats/ apps/web-buyer/src/components/chat/
git commit -m "feat(web-buyer): redesign chat list + thread — brand-color avatars, pinned product"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Task 9 — Order list + detail

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/orders/page.tsx`
- Modify: `apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx`

- [ ] **Step 9.1: Order list — clean rows**

Простая страница: header «Заказы», список карточек заказов:

```tsx
{orders.map(order => (
  <Link key={order.id} href={`/orders/${order.id}`}
    className="block p-4 mb-2 rounded-md transition"
    style={{ background: colors.surface }}>
    <div className="flex justify-between items-baseline mb-1">
      <div className="text-[13px] font-semibold" style={{ color: colors.textStrong }}>Заказ #{order.shortId}</div>
      <StatusPill status={order.status} />
    </div>
    <div className="text-[11px]" style={{ color: colors.textMuted }}>{order.itemCount} товара · {formatDate(order.createdAt)}</div>
    <div className="text-sm font-bold mt-1" style={{ color: colors.textStrong }}>{formatPrice(order.total)} сум</div>
  </Link>
))}
```

`StatusPill` компонент рисует badge с цветом из таблицы статусов (success / brand / warning / muted). Используй коды статусов из `docs/V1.1/05_error_taxonomy.md` если есть, иначе локальный switch.

- [ ] **Step 9.2: Order detail — status hero + timeline**

```tsx
{/* Status hero */}
<div style={{ background: colors.brand, color: colors.brandTextOnBg }} className="px-4 py-4">
  <div className="text-[10px] tracking-[0.15em] uppercase opacity-70 mb-1.5">— Статус</div>
  <div className="text-lg font-bold mb-1">{statusLabel(order.status)}</div>
  <div className="text-[11px] opacity-85">{etaLabel(order)}</div>
</div>

{/* Timeline */}
<div className="px-4 py-4" style={{ background: colors.surface }}>
  {timeline.map((step, i) => (
    <div key={step.id} className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="w-[18px] h-[18px] rounded-full flex items-center justify-center text-white text-[9px]"
             style={{ background: step.completed || step.current ? colors.brand : colors.divider }}>
          {step.completed ? '✓' : step.current ? '●' : ''}
        </div>
        {i < timeline.length - 1 && (
          <div className="w-px flex-1 min-h-[18px]"
               style={{ background: step.completed ? colors.brand : colors.divider }} />
        )}
      </div>
      <div className="flex-1 pb-3">
        <div className="text-xs font-semibold" style={{ color: step.current ? colors.brand : (step.completed ? colors.textStrong : colors.textMuted) }}>
          {step.label}
        </div>
        {step.timestamp && <div className="text-[10px]" style={{ color: colors.textMuted }}>{formatDateTime(step.timestamp)}</div>}
      </div>
    </div>
  ))}
</div>

{/* Seller card + items + summary + bottom actions */}
```

Bottom actions: «Помощь» (outline) + «Повторить заказ» (brand-color).

- [ ] **Step 9.3: Commit + push**

```bash
git add apps/web-buyer/src/app/\(shop\)/orders/
git commit -m "feat(web-buyer): redesign orders — list + status hero + timeline"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Task 10 — Profile + Wishlist + Notifications

**Files:**
- Modify: `apps/web-buyer/src/app/(shop)/profile/page.tsx`
- Modify: `apps/web-buyer/src/app/(shop)/wishlist/page.tsx`
- Modify: `apps/web-buyer/src/app/(shop)/notifications/page.tsx`

- [ ] **Step 10.1: Profile**

```tsx
<div>
  {/* user card */}
  <div className="px-4 py-4 flex items-center gap-3.5" style={{ background: colors.surface }}>
    <div className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl"
         style={{ background: colors.brand }}>{user.name[0]}</div>
    <div className="flex-1">
      <div className="text-[15px] font-bold" style={{ color: colors.textStrong }}>{user.name}</div>
      <div className="text-[11px]" style={{ color: colors.textMuted }}>{user.phone}</div>
    </div>
    <Link href="/profile/edit" className="text-[11px] font-semibold" style={{ color: colors.brand }}>Изменить</Link>
  </div>

  {/* stats row */}
  <div className="grid grid-cols-3 gap-px" style={{ background: colors.divider }}>
    <Stat label="Заказов" value={stats.orders} />
    <Stat label="В избранном" value={stats.wishlist} />
    <Stat label="Магазинов" value={stats.stores} />
  </div>

  {/* menu sections */}
  <SectionLabel>Доставка и оплата</SectionLabel>
  <MenuRow icon="📍" label="Мои адреса" sub={`${addresses.length} сохранённых`} href="/profile/addresses" />
  <MenuRow icon="💳" label="Способы оплаты" sub="Online скоро" href="/profile/payments" />

  <SectionLabel>Настройки</SectionLabel>
  <MenuRow icon="🔔" label="Уведомления" trailing={<Toggle checked={settings.notifications} />} />
  <MenuRow icon="🌓" label="Тёмная тема" sub="Авто" href="/profile/theme" />
  <MenuRow icon="🌐" label="Язык" sub="Русский" href="/profile/language" />

  <div className="px-4 py-6">
    <button onClick={logout} className="w-full py-3 text-xs font-semibold rounded border"
            style={{ borderColor: colors.danger, color: colors.danger }}>
      Выйти
    </button>
  </div>
</div>
```

`Stat`, `SectionLabel`, `MenuRow`, `Toggle` — локальные helper components в файле, с минимальной разметкой по образцу спеки.

- [ ] **Step 10.2: Wishlist**

Ре-используй `<ProductCard>` из Task 4. Page структура простая: header «Избранное · {count}» + grid 2-col mobile / 4-col desktop. Если пусто — editorial empty state «— Пока пусто» + CTA «Перейти к магазинам».

- [ ] **Step 10.3: Notifications**

Простой список с editorial label для группировки по дате («— Сегодня», «— Вчера», «— На прошлой неделе»). Каждый item: иконка + текст + время + dot если непрочитано (brand color).

- [ ] **Step 10.4: Commit + push**

```bash
git add apps/web-buyer/src/app/\(shop\)/profile/ apps/web-buyer/src/app/\(shop\)/wishlist/ apps/web-buyer/src/app/\(shop\)/notifications/
git commit -m "feat(web-buyer): redesign profile, wishlist, notifications"
git push origin main
git checkout web-buyer && git merge main --no-edit && git push origin web-buyer && git checkout main
```

---

## Финальная задача — Smoke walkthrough

После всех 10 задач — пройди по продакшен URL'у buyer'а на Railway по сценарию:

- [ ] Открой главную → видно тёплый фон, новый header
- [ ] Кликни магазин → hero с фото слева/брендблоком справа на desktop
- [ ] Кликни товар → gallery + info split, sticky CTA на mobile
- [ ] Добавь в корзину → корзина с store-strip, free-delivery hint
- [ ] Перейди в checkout → 3 шага, address-cards, payment с «Online · Скоро»
- [ ] Открой /chats → список с brand-color avatars
- [ ] Открой /orders → list со status pill
- [ ] Открой /profile → stats row + меню с editorial labels

Если всё ок — закрываем feature, обновляем `analiz/done.md` и `MEMORY.md`.

---

## Самопроверка плана

**Spec coverage:**
- ✅ Foundation (палитра, типография, spacing, radii) → Task 1
- ✅ Storefront landing → Task 3
- ✅ Product detail → Task 5
- ✅ Cart + Checkout → Tasks 6 + 7
- ✅ Connection (chat, orders, profile) → Tasks 8 + 9 + 10
- ✅ Header + BottomNav (упомянуто в спеке как часть базовой системы) → Task 2

**Что НЕ покрыто планом** (по решению спеки — out of scope):
- Brand-color picker в seller-онбординге
- Тёмная тема для buyer
- Замена эмодзи на Lucide
- A/B тестирование

**Известные ограничения:**
- Нет TDD-стиля «test first» — UI без unit-тестов в текущем стеке. Verification идёт через Railway build (TS-check) + ручной smoke walkthrough.
- Free-delivery threshold захардкожен константой в Task 6 — реальное значение/правило придёт отдельной задачей.
- `Store.brandColor` поле может ещё не быть в backend — Task 8 фолбэчит на терракоту через `?? colors.brand`.
