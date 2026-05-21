# web-buyer vs web-seller — сравнительный дизайн-аудит

**Дата:** 2026-05-20
**Автор:** UI/UX-аудит (Claude, read-only)
**Скоуп:** только палитра / типографика / контраст / spacing / компоненты. Конструкция и layout остаются как есть — меняются только цвета и токены.
**Источники:**
- `apps/web-buyer/src/app/globals.css` (133 строки, 1 цельный токен-набор)
- `apps/web-buyer/src/lib/styles.ts` (118 строк, расширенный brand-набор)
- `apps/web-buyer/src/app/(shop)/page.tsx`, `(shop)/layout.tsx`, `(shop)/[slug]/page.tsx`
- `apps/web-buyer/src/components/store/ProductCard.tsx`, `layout/Header.tsx`, `home/RecentStores.tsx`
- `apps/web-seller/src/app/globals.css` (128 строк, два равноправных набора + `--app-bg` гра­диент)
- `apps/web-seller/src/lib/styles.ts` (100 строк, более скромный набор)
- `apps/web-seller/src/app/(dashboard)/layout.tsx`, `dashboard/page.tsx`, `products/page.tsx`, `settings/page.tsx`
- `apps/web-seller/src/app/(onboarding)/layout.tsx` (единственное место с blur-orbs)

---

## Verdict (TL;DR)

**web-buyer выигрывает на палитре и brand-целостности.** Terracotta `#7C3F2E` на тёплой кремовой подложке `#FBF7F0` — это запоминаемая, уникальная для UZ-рынка тема с правильным эмоциональным посылом «retail / bazaar / уют». Токены богаче (brand + accent-aliases, textBody/textStrong/textDim как 3 разных тона, brandMuted/brandBorder), компоненты дочище — карточка товара уже имеет финальные детали (variant-badge, wishlist-pill, out-of-stock overlay).

**web-seller выигрывает на функциональной плотности и информационной строгости** (sidebar 240px + topbar 56px + статус-pills с tinted-rgba — это законченный CRM-паттерн), но palette сырая: violet `#7C3AED` — generic SaaS-цвет «как у всех», а dark-режим включён по дефолту с фирменным градиентом `#1a0533→#0d1f4f→#0a2e1a` который выглядит как 2021-й dashboard. Light-режим seller'а (`#F4F5F7`, slate-текст) — нейтральный, без характера, лишь технически работает.

**Решение:** материнской палитрой бренда должен стать buyer (Soft Color Lifestyle). Seller подтягиваем к ней — без слома dashboard-конструкции, только цвета.

---

## Палитра

### web-buyer — Soft Color Lifestyle ✅

**Pros:**
- Уникальный brand-hue: terracotta `#7C3F2E` light / `#A05A45` dark. Не похоже ни на один UZ-маркетплейс (Uzum зелёный, OLX оранжевый-генерик).
- Полный набор brand-токенов: `brand / brand-hover / brand-muted / brand-border / brand-text-on-bg`. Можно собрать любую вариацию (CTA, soft button, badge, ring) из одного источника.
- Тёплая нейтраль `#FBF7F0 → #F4EEE0 → #EFE8DA` — это правильный bazaar-bg (а не cold gray).
- Dark-режим имеет «warm near-black» `#16120D` с brown-tint вместо стандартного slate. Это редкий уровень внимания к brand-tone в dark-моде.
- Semantic-цвета в muted-варианте: `#4A6B45 / #9C7A2E / #8B3A3A` — не «попугайские», вписываются в кремовый бэк.

**Cons:**
- `--color-accent` — алиас на brand. Когда понадобится второй акцент (например, sale-badge), будет нечем разделить.
- Только один pre-store override planned, но per-store branding пока не реализован.

### web-seller — Slate + Violet ⚠️

**Pros:**
- `--app-bg` градиент `#1a0533 → #0d1f4f → #0a2e1a` действительно эффектный на полноэкранном dashboard, даёт «премиум CRM» ощущение.
- Полный info-канал (`--color-info` синий) — корректно отделён от accent (violet) и success.
- Onboarding-сцена с radial-orbs (`--onboarding-orb-1`, blur 60px) — единственная действительно «liquid glass» точка во всём апе.

**Cons:**
- Violet `#7C3AED` — клишированный SaaS-цвет (Linear / Vercel / Notion premium). Никакой brand-уникальности.
- Light-режим (`#F4F5F7 + #0F172A текст`) выглядит как «дефолт shadcn» — функционально, бренда нет.
- Двойственность: в light brand = `#7C3AED`, в dark brand = `#7C3AED` но accent = `#A78BFA`. Wordmark «Savdo» прыгает в насыщенности между темами.
- Нет brand-muted / brand-border (только accent-*). Когда нужен «soft button» в brand-цвете — приходится тянуть `accent-muted`, что концептуально не то же самое.
- Dark — default через `defaultTheme="dark"`. Это спорно: продавец на телефоне днём на улице получает чёрный фон, который никак не читается под солнцем.

---

## Типографика

### web-buyer ✅

**Pros:**
- Inter с `subsets: ['latin','cyrillic']`, font-feature `'cv11', 'ss01'` — настроенная кириллица + character variants. Это уже выше среднего.
- Иерархия `textStrong / textPrimary / textBody / textMuted / textDim` — 5 уровней, что позволяет точно расставлять акценты в карточке (title strong, цена strong, sub-text muted, hint dim).
- Phrasing-капс «— ПЕРЕЙТИ В МАГАЗИН» с `tracking-[0.18em]` — это узнаваемая lifestyle-маркетинговая микро-деталь.
- Размеры строго в `text-[11px]…text-2xl` — без `font-size: 13px` инлайнов вразнобой.

**Cons:**
- Веса сводятся к `font-bold / font-semibold / font-medium / regular` — без extra-bold для display-h1.
- Hero h1 `text-2xl sm:text-3xl` — на десктопе мелковато для лендинга.

### web-seller ⚠️

**Pros:**
- Sidebar h2 + lucide icons stroke-1.75 — спокойная dashboard-ритмика.
- Capslocked labels `text-[11px] uppercase tracking-widest` в Field — индустриальный CRM look.

**Cons:**
- `font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` — системный стек без Inter. На Android кириллица будет читаться хуже buyer'а.
- Нет `font-feature-settings`. Нет `cv11/ss01`.
- Иерархия только `textPrimary / textMuted / textDim` — 3 уровня против 5 у buyer'а. Когда нужна разница между body-text и hint-text, упирается в одно и то же `--color-text-muted`.
- Вес «брэнд» Savdo в sidebar — `font-bold` 16px, идентично рядовому label. Логотип не выделен типографически.

---

## Контраст / accessibility (WCAG AA)

### web-buyer
- Light: `#1F1A12 / #FBF7F0` → ≈ 14.5:1 (AAA). `#8A7D6A / #FBF7F0` (textMuted) → ≈ 3.6:1 — **на грани AA для normal text**, но проходит для 14px+/bold (AA Large).
- Dark: `#F5EFE3 / #16120D` → ≈ 15.1:1 (AAA). `#A89B85 / #16120D` → ≈ 6.0:1 (AA).
- Brand `#7C3F2E / #FBF7F0` (CTA) → ≈ 6.5:1 — норм для текста на кнопке.

### web-seller
- Light: `#0F172A / #F4F5F7` → ≈ 14.2:1 (AAA). `#475569 / #F4F5F7` → ≈ 5.5:1 (AA).
- Dark: `#F1F5F9 / #0F172A` → ≈ 13.5:1 (AAA). `#94A3B8 / #0F172A` (textMuted) → ≈ 6.3:1 (AA).
- Accent `#7C3AED / #F4F5F7` → ≈ 5.0:1 (AA Large только!) — **проблема:** ссылки «Все заказы →» в `colors.accent` на белом surface не дотягивают до AA для normal text.
- Dark accent `#A78BFA / #0F172A` → ≈ 8.0:1 (AAA).

**Итог:** buyer textMuted чуть слабее в light (3.6:1 — нужно использовать только в 14px+/bold), seller имеет проблему с accent-цветом для текстовых ссылок в light-режиме. На dark обе ОК.

---

## Layout / spacing rhythm

### web-buyer ✅
- Hero `gap-8` between sections, card `p-4 sm:p-5`, h-`[44px]` inputs — стабильная сетка 4px-baseline.
- BottomNavBar mobile + Header sticky — mobile-first приоритет очевиден.
- Hover lift `hover:-translate-y-0.5` на quick-links — единый pattern.

### web-seller ⚠️
- Sidebar 240px, top-bar 56px, main `p-4 md:p-6` — стандарт.
- Metrics grid `grid-cols-2 xl:grid-cols-4 gap-4` — нормально.
- **Но:** `px-5 py-3.5` секция-header против `px-4 py-3` orders-row — нет единого baseline (5/3.5 vs 4/3). Buyer аккуратнее.
- Capslocked labels в Field `tracking-widest` — это «дорого», но сочетается с slate-плоскостью, ощущается legacy.

---

## Glass / blur эффекты

### web-buyer
Реальных backdrop-filter в buyer **нет** (grep по `backdrop-blur|blur(` находит только `inputRef.current?.blur()` — это DOM-метод, не CSS).
**Это правильно** для retail-shop темы — кремовый bg сам по себе тёплый, ему не нужен glass-overlay.

### web-seller
Blur используется **только в onboarding** — `filter: blur(60px)` на radial-orbs (`<OnboardingLayout>`). Это уместный premium-вход.
Внутри dashboard glass нигде нет — что хорошо, потому что на градиентном `--app-bg` любой полупрозрачный card стал бы кашей.

**Вывод:** оба ведут себя сдержанно, никто не страдает glass-overuse. Это редко и хорошо.

---

## Компоненты

### Карточки / списки

**web-buyer ProductCard:** ✅
- Variant-count badge (top-left), wishlist heart (top-right, `bg: rgba(255,255,255,0.85)`), out-of-stock overlay, slider-dots, collage-grid 2×2, lift-on-hover, active-scale.
- Использует `colors.surfaceSunken` для image-area — мягкий, не белый.

**web-seller dashboard-cards / orders-rows:** ⚠️
- Metric-карточка простая (icon + value + label), без штрихов кроме `card` базы.
- Status-pill с `rgba(251,191,36,.15)` inline-hex — `.15` opacity жёстко прописана в JSX, не через `successTint()/warningTint()` хелперы которые уже есть в `styles.ts`. **Дубль логики, токен-system недоиспользован.**

### Кнопки / CTA

**web-buyer:** один canonical `colors.brand` CTA (terracotta) + secondary с `colors.brandMuted` background. Чёткая иерархия. Hover = `opacity-90`, active = `scale-[0.97]`.

**web-seller:** `colors.accent` (violet) для CTA, `colors.surfaceMuted` для secondary. Hover = `opacity-90`, action `hover:opacity-80` в нав-айконах. Inconsistency: где-то 80%, где-то 90%.

### Badges / status

**web-buyer:** wishlist-badge сам по себе как самостоятельный «kiln-fired» элемент (brandTextOnBg фон + brand-цвет текста + brandBorder).

**web-seller:** status-pills `STATUS_COLORS[o.status] + "22"` (hex+alpha строкой) — устаревший приём, плохо переносится между темами. У buyer для этого уже есть `dangerTint(0.13)/warningTint/successTint`.

### Inputs

**web-buyer:** `background: surface, border: 1px solid border`. Поле `savdo.uz/<slug>` с разделителем — finished detail.

**web-seller:** `background: surfaceSunken` (на тон ниже) — inset look. Это норм для CRM, но в светлом режиме `#E4E7EB` визуально близок к border. Контраст input vs background слабее, чем у buyer.

---

## Tone & personality

- **buyer** — мягкий retail-shop, тёплая bazaar-эстетика, покупатель сразу чувствует «уютное место чтобы потратить деньги». Эмоция = trust + warmth.
- **seller** — строгий dashboard, продавец чувствует «инструмент». Эмоция = control + speed.

**Это правильное разделение** — разные аудитории, разные эмоции. **Но название и логотип должны быть единым brand-якорем.** Сейчас:
- buyer logo: 80×80 rounded `bg: brand` (terracotta) + ShoppingCart white + shadow `rgba(124,63,46,0.15)`.
- seller logo: 32×32 `bg: accent` (violet) + ShoppingCart white + текст «Savdo» в `colors.brand` (violet `#7C3AED`).

Один и тот же wordmark «Savdo» получает разные оттенки и разные иконки-плашки. Это **враг brand recognition** — пользователь, переходящий из buyer в seller (а онбординг ровно это и делает: BUYER → SELLER), видит другой цвет логотипа и теряет якорь.

---

## Что унифицировать (только цвета, БЕЗ изменения конструкции)

1. **Единый `--color-brand` = terracotta `#7C3F2E` (light) / `#A05A45` (dark) в обоих апах.**
   - В seller заменить `--color-brand: #7C3AED` (light и dark) на buyer-значения.
   - Логотип/wordmark `Savdo` в обоих апах берёт `colors.brand` — будет одинаковым.

2. **Сохранить violet как `--color-accent` в seller** (отдельно от brand). Тогда у seller получается «dashboard accent» (violet) и «brand mark» (terracotta) — разделение, которое имеет смысл: violet работает как CRM-status, terracotta как идентичность платформы.

3. **Перенести `brand-muted / brand-border / brand-text-on-bg` токены в seller'овский `styles.ts`** — чтобы wordmark/logo-pill могли быть собраны через те же токены.

4. **Light-палитра seller'а должна быть кремовой, не slate.**
   - Сейчас seller light: `bg: #F4F5F7 / surface: #FFFFFF / text: #0F172A`.
   - Предлагается: `bg: #FBF7F0 / surface: #FFFFFF / text: #1F1A12` (mirror buyer).
   - Текст-muted в seller light заменить на `#8A7D6A` (как у buyer) — теплее, в тон bg.

5. **Dark-режим seller'а сохранить как «brand-dark» вариант** — но `--app-bg` градиент перекрасить из purple→navy→green в **тёплую вариацию** на основе brand:
   - Например `linear-gradient(135deg, #1F1208 0%, #2A1810 40%, #16120D 100%)` — терракотово-near-black, drama сохраняется, идентичность бренда — да.

6. **Семантические `dangerTint() / warningTint() / successTint()` хелперы — единственный источник tinted-фонов в обоих апах.** Запретить inline-hex с alpha типа `"rgba(251,191,36,.15)"`. Сейчас seller их использует только частично — buyer уже консистентен.

7. **Status-pill компонент вынести в shared (если есть `packages/ui`)** — общий чип `{ status: 'pending'|'success'|'danger', label }`, чтобы buyer и seller рендерили заказы одинаково.

---

## Рекомендация для бренда

**Материнская палитра = web-buyer Soft Color Lifestyle (terracotta + cream).**

Обоснование:
- Это единственная из двух палитр, которая **имеет brand-character** (а не SaaS-template).
- Тёплая семантика правильна для UZ-аудитории: retail / bazaar / гостеприимство — это культурно близко, а violet — нет.
- На лендинге, лого, marketing site terracotta сразу даёт визуальную дифференциацию от Uzum (зелёный) и OLX (оранж-yellow). Никто на рынке UZ не использует terracotta.
- Dark-вариант buyer'а (`warm near-black + lifted terracotta`) — это редкий, узнаваемый dark-look. Перенесём его в seller как «brand-dark», и оба апа станут визуальной семьёй.

Seller остаётся «строгим инструментом» — оставляем slate-плотность, dashboard-конструкцию и violet как функциональный accent, но **brand-якоря (logo, wordmark, primary CTA, status-success/warning тинты) перекрашиваем в семейство buyer'а**.

---

## 5 быстрых wins (концретные файлы — Азим применит сам)

### Win 1 — Единый brand-цвет логотипа Savdo
**Файл:** `apps/web-seller/src/app/globals.css`
**Строки 29, 74:** `--color-brand: #7C3AED;` → `--color-brand: #7C3F2E;` (light), `#A05A45` (dark).
**Эффект:** wordmark «Savdo» в sidebar станет таким же, как на buyer-homepage. Brand recognition при переходе buyer↔seller — восстановлена.

### Win 2 — Перенести buyer-токены `brandMuted / brandBorder / brandTextOnBg` в seller
**Файл:** `apps/web-seller/src/app/globals.css` — добавить в `:root` и `[data-theme="dark"]`:
```
--color-brand-muted:     rgba(124,63,46,0.06);   /* light */
--color-brand-border:    rgba(124,63,46,0.15);
--color-brand-text-on-bg:#FBF7F0;
```
И в `apps/web-seller/src/lib/styles.ts` добавить соответствующие ключи.
**Эффект:** sidebar-logo-pill (сейчас `bg: colors.accent`) можно перевести на `colors.brand`, и кнопка «Beta» рядом с лого станет в brand-семействе.

### Win 3 — Light-палитра seller'а → кремовая
**Файл:** `apps/web-seller/src/app/globals.css`, секция `:root` (строки 14-34):
- `--color-bg: #F4F5F7;` → `#FBF7F0;`
- `--color-surface-muted: #ECEEF1;` → `#FBF7F0;`
- `--color-surface-sunken: #E4E7EB;` → `#F4EEE0;`
- `--color-text-primary: #0F172A;` → `#1F1A12;`
- `--color-text-muted: #475569;` → `#8A7D6A;`
- `--color-text-dim: #94A3B8;` → `#B5A88E;`
**Эффект:** seller light-mode перестаёт выглядеть как «shadcn default», начинает чувствоваться частью одной с buyer семьи. Конструкция не меняется — только тон.

### Win 4 — Dark `--app-bg` градиент перекрасить
**Файл:** `apps/web-seller/src/app/globals.css`, строка 88:
```
--app-bg: linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%);
```
→
```
--app-bg: linear-gradient(135deg, #1F1208 0%, #2A1810 40%, #16120D 100%);
```
Также `--onboarding-bg` (строка 91) перекрасить из navy-purple в warm-brown.
**Эффект:** signature CRM-look сохраняется (градиент остаётся), но семейство цвета совпадает с buyer dark-mode.

> **Контекст / прецедент:** в session 55 (09.05.2026, commit `b894589`) Азим
> уже сделал ровно такую миграцию для **web-buyer dark theme** — legacy violet
> `#A78BFA` заменён на lifted terracotta `#A05A45`, bg `#0F0F12` (cool slate) →
> `#16120D` (warm near-black). Этот Win 4 — распространение того же решения на
> seller, а не дубль buyer-работы. Buyer-dark уже консистентен с brand-light,
> seller-dark пока остаётся «2021-й purple→navy→green» — нужно подтянуть.

### Win 5 — Заменить inline-hex tints на хелперы
**Файлы:**
- `apps/web-seller/src/app/(dashboard)/dashboard/page.tsx` — строки 117, 158, 232 (`"rgba(251,191,36,.15)"`, `"rgba(52,211,153,.15)"`, `+ "22"`).
- `apps/web-seller/src/app/(dashboard)/products/page.tsx` — строки 20-21 (`"rgba(52,211,153,.15)"`, `"rgba(251,191,36,.13)"`).
Заменить на `warningTint(0.15)`, `successTint(0.15)`, `dangerTint(0.13)` — они уже импортированы из `@/lib/styles`.
**Эффект:** все status-tinted фоны автоматически адаптируются к light/dark theme через RGB-channel vars. Сейчас в light-режиме `rgba(251,191,36,.15)` (amber-400) выглядит грязно на кремовом — после перехода на `warningTint()` подхватит light-friendly `#9C7A2E` оттенок.

---

## Что НЕ менять

- Конструкцию sidebar 240px + top-bar 56px — это правильный CRM.
- Bottom-nav buyer'а — это правильный retail mobile.
- Onboarding orbs с blur — это уместная единственная glass-точка.
- Inter/Cyrillic настройки buyer'а — оставить, но **продублировать в seller** как отдельный win за рамками этого спринта.
- Layout-сетку обоих апов (gap'ы, paddings) — не трогать.
