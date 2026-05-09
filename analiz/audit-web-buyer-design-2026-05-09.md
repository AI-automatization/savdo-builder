# Web-buyer Design Audit — Soft Color Lifestyle

> **Дата:** 2026-05-09
> **Спека:** `docs/superpowers/specs/2026-05-05-buyer-design-differentiation-design.md`
> **Tokens:** `apps/web-buyer/src/app/globals.css` (light) + `apps/web-buyer/src/lib/styles.ts`
> **Health overall:** 7.5/10 — token discipline значительно лучше, чем у seller'а на момент его аудита: 0 legacy-violet hardcodes в основных страницах, 0 backdrop-blur, вся нейтральная палитра и brand-tokens полностью tokenized через CSS vars. Снижают оценку: один целиком сломанный компонент (emoji-picker), drift радиусов в checkout/OTP (rounded-2xl вместо 4px на кнопках), отсутствие pinned product context в чате, статичный dot в timeline вместо pulsing, stats row без brand-color на цифрах.
> **Findings:** 25 total — 3 P1 / 14 P2 / 8 P3

---

## TL;DR

Основная палитра «Soft Color Lifestyle» успешно внедрена: hero, CTA, карточки, summary-блоки, order detail — всё использует `colors.brand` / `colors.textStrong` / `colors.surface` через токены. Три острые проблемы: (1) `emoji-picker` — отдельная «чёрная вселенная» с violet glassmorphism прямо внутри светлого интерфейса, (2) edit-bubble в чате — invisible white-on-white (та же болезнь что в seller, не долечена), (3) pinned product context в чат-thread — по спеке «ключевой differentiator vs Qlay», но его нет. Радиусный drift в checkout OTP — быстрый однострочный фикс. Рекомендация по волнам: P1-001 (emoji) → P1-002 (chat edit) → P2-типография-heading → P2-stats-brand → P2-timeline-pulse → P1-003 (pinned context) → остальные P2 + P3 в один backlog-проход.

---

## Strengths

- Token система (`globals.css` + `lib/styles.ts`) — образцовая: все CSS vars, 1:1 зеркало, `accent` как alias для `brand` не ломает старые компоненты. Zero `dark:` Tailwind-классов — theme через CSS vars сохранено.
- Hero storefront: 6fr/4fr desktop split, 200px mobile full-bleed, editorial label «— Магазин · Город», две CTA-кнопки — точно по спеке `§Storefront landing → Hero`.
- ProductCard — borderless, `rgba(255,255,255,0.85)` heart overlay 32px top-right, цена через `colors.textStrong` (не brand) — именно как описано в спеке «почему цена тёмная».
- Sticky CTA на mobile — присутствует на product detail (line 763), cart (line 492), checkout (line 831) — критерий успеха №5 выполнен.
- Chat list + thread — bubbles с `border-radius:"14px 14px 4px 14px"` (buyer) и `"14px 14px 14px 4px"` (seller) точно по спеке. Composer — `rounded-full` input (≈999px) + 36px brand-circle send. Date dividers есть.
- Order detail: StatusHero с brand-fill background, editorial label «— Статус», timeline с 5 шагами, completed/current/upcoming states — все реализованы.
- Free-delivery progress bar в корзине — `rgba(brand,0.06)` карточка, 4px bar, корректный текст при 0 остатке — точно по спеке `§Cart`.
- OTP flow в checkout: правильный copy «Код отправлен в Telegram на...» — не «из SMS» (исправлено в отличие от seller'а). Критерий №0 выполнен.
- Checkout «Online · Скоро» badge — `brandMuted` bg + `brand` text, line 641-649. Критерий успеха №6 выполнен.
- Inter font с `cyrillic` subset, `display: 'swap'` — точно по спеке `§Типография`.

---

## Findings

### P1 — must fix

**P1-001 — EmojiPicker полностью на чужой тёмной теме (`apps/web-buyer/src/components/emoji-picker.tsx:84-133`)**
- Что: весь компонент использует hardcoded тёмную violet-тему: кнопка-триггер `color: '#A78BFA'` (light) / `'rgba(255,255,255,0.55)'` (inactive), панель `background: 'rgba(15,23,42,0.96)'` + `backdropFilter: 'blur(18px)'`, border `rgba(167,139,250,0.30)`, active tab `rgba(167,139,250,0.22)`. В light-теме это выглядит как инородный тёмный glassmorphism-попап.
- Спек требует: §Foundation — «❌ glassmorphism / backdrop-blur». Иконография — эмодзи как low-cost initial state, без особых требований к styling пикера, но общие правила no-glassmorphism и no-violet обязательны.
- Сейчас: `backdropFilter:'blur(18px)'` на line 99, `#A78BFA` на line 84, `rgba(15,23,42,0.96)` dark bg на line 97.
- Fix: заменить панель на `background: colors.surface`, `border: 1px solid colors.border`, убрать `backdropFilter`, tab active — `colors.brandMuted`. Кнопка-триггер: `color: colors.textMuted`, active `color: colors.brand`.

**P1-002 — Chat edit-bubble: white-on-white в light-теме (`apps/web-buyer/src/app/(shop)/chats/page.tsx:384-403`)**
- Что: когда buyer редактирует сообщение прямо внутри bubble, textarea и кнопки используют `rgba(255,255,255,0.95)` как фон, `rgba(255,255,255,0.5)` как border, `rgba(255,255,255,0.18)` как фон кнопки «Отмена» — всё поверх `colors.brand` (терракота). В light-теме терракота достаточно светлая, что белый фон на ней читается, но кнопка «Отмена» с `rgba(255,255,255,0.18)` фактически невидима. Идентичный баг существовал в seller (WS-DESIGN-P1-003), здесь не исправлен.
- Спек требует: не прописывает edit-mode явно, но общий принцип token-only стилизации. Bubble edit — внутри brand-fill context, поэтому `brandTextOnBg`-совместимые цвета.
- Сейчас: строки 384 (`rgba(255,255,255,0.95)`), 385 (`rgba(255,255,255,0.5)`), 394 (`rgba(255,255,255,0.18)`), 403 (`#FFFFFF`).
- Fix: `rgba(255,255,255,0.95)` → `colors.surface` (или `rgba(251,247,240,0.95)` — `brandTextOnBg` с opacity), отмена-кнопка → `rgba(251,247,240,0.25)` + `color: colors.brandTextOnBg`, сохранить → `colors.brandTextOnBg` bg + `colors.brand` text.

**P1-003 — Отсутствует pinned product context strip в chat thread (`apps/web-buyer/src/app/(shop)/chats/page.tsx`)**
- Что: спека называет chat «★ key differentiator vs Qlay» и явно описывает полосу «`rgba(brand,0.06)` + 40px thumb + название + цена + `Открыть →`» когда чат открыт из карточки товара. В `ChatView` (line 111-510) и в `ChatsView` (line 513-686) этой полосы нет вообще. `ChatComposerModal` передаёт `contextType/contextId`, но после создания треда эта информация в UI не отражается.
- Спек требует: §Chat thread — «Pinned product context (когда чат открыт из карточки товара): полоса `rgba(brand,0.06)` с 40px thumb + название + цена + `Открыть →`».
- Сейчас: `ChatView` рендерит header, messages, composer — pinned strip отсутствует.
- Fix: добавить условный блок под `thread header` в `ChatView`, показывающий полосу если `thread.contextType === 'PRODUCT'` — fetching product preview по `thread.contextId`.

---

### P2 — должны быть исправлены до полной готовности

**P2-001 — Page headings слишком маленькие: `text-lg` (18px) вместо 22-30px**
- `apps/web-buyer/src/app/(shop)/orders/page.tsx:309` — «Заказы» `text-lg font-bold`
- `apps/web-buyer/src/app/(shop)/profile/page.tsx:258` — «Профиль» `text-lg font-bold`
- `apps/web-buyer/src/app/(shop)/notifications/page.tsx:195` — «Уведомления» `text-lg font-bold`
- `apps/web-buyer/src/app/(shop)/chats/page.tsx:558` — «Чаты» `text-lg font-bold`
- Спек требует: §Типография — heading 22-30px / 700 / -0.01em для названий страниц.
- Fix: заменить `text-lg` → `text-2xl` (24px, внутри диапазона 22-30px) во всех 4 местах. Добавить `tracking-tight` (≈-0.01em).

**P2-002 — Stats row на Profile: числа в `textStrong`, а не в `colors.brand` (`apps/web-buyer/src/app/(shop)/profile/page.tsx:31-33`)**
- Что: компонент `Stat` рендерит значение через `style={{ color: colors.textStrong }}`. По спеке «— профиль: Stats row: 3 metrics — большие числа в brand-color, label meta-color».
- Спек требует: §Profile — «большие числа в brand-color».
- Fix: в `Stat` (line 30-35) заменить `colors.textStrong` → `colors.brand` для числового значения. Label остаётся `colors.textMuted`.

**P2-003 — Timeline current-step dot не пульсирует (`apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:183-189`)**
- Что: current step рендерит `●` текстовый символ в brand-circle без анимации. Спека говорит «pulsing brand-color dot on current step».
- Спек требует: §Order detail → Timeline — «**В пути** (current, pulsing brand-color)».
- Fix: добавить `animate-pulse` к div с кружком на `current` шаге (line 183-188).

**P2-004 — Storefront sections: нет «Все NN →» link рядом с editorial labels (`apps/web-buyer/src/app/(shop)/[slug]/page.tsx:245-250`)**
- Что: секция «— Товары» имеет только левый editorial label без правой ссылки. Спека описывает паттерн: «Editorial-метка слева + ссылка-`Все NN →` справа в brand-color, font-weight 600».
- Спек требует: §Sections — «ссылка-«Все NN →» справа в brand-color, font-weight 600».
- Fix: добавить рядом с editorial label ссылку «Все {products.length} →» в `style={{ color: colors.brand, fontWeight: 600 }}` справа. Также отсутствует паттерн горизонтальных dividers между секциями (1px `colors.divider`).

**P2-005 — Checkout OTP gate: кнопки с `rounded-2xl` (24px), spec = 4px (`apps/web-buyer/src/app/(minimal)/checkout/page.tsx:217,248`)**
- Что: «Получить код» и «Подтвердить» в inline OTP gate (внутри checkout) используют `rounded-2xl`.
- Спек требует: §Border radius — «4px — Кнопки, chip'ы категорий, размер-таблетки, mini-карточки».
- Сейчас: `className="w-full py-3.5 rounded-2xl ..."` на lines 217 и 248.
- Fix: `rounded-2xl` → `rounded` (4px) на обеих кнопках.

**P2-006 — OtpGate компонент: `rounded-xl` на inputs и кнопках, `rounded-2xl` на контейнере (`apps/web-buyer/src/components/auth/OtpGate.tsx:48,62,72,84`)**
- Что: иконка-контейнер `rounded-2xl` (16px), карточка `rounded-2xl`, input и кнопки `rounded-xl` (12px) — все выше spec max для кнопок (4px).
- Спек требует: §Border radius — кнопки 4px, карточки 6px, large surfaces 8px.
- Fix: `rounded-2xl` → `rounded-lg` (8px) для card-контейнера и иконки, `rounded-xl` → `rounded` (4px) для input и кнопок.

**P2-007 — CategoryAttributeFilters panel: `rounded-2xl` (16px) (`apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx:143`)**
- Что: раскрывающаяся панель фильтров использует `rounded-2xl`. Это large surface container.
- Спек требует: §Border radius — large surface containers = 8px.
- Fix: `rounded-2xl` → `rounded-lg` (8px).

**P2-008 — Chat container outer wrapper: `rounded-2xl` (`apps/web-buyer/src/app/(shop)/chats/page.tsx:548`)**
- Что: `ChatsView` outer div использует `rounded-2xl overflow-hidden` — large surface container.
- Спек требует: large surface containers = 8px.
- Fix: `rounded-2xl` → `rounded-lg` (8px).

**P2-009 — HeaderSearch dropdown: тяжёлая тень `0 12px 32px rgba(0,0,0,0.18)` (`apps/web-buyer/src/components/layout/HeaderSearch.tsx:84`)**
- Что: `boxShadow: '0 12px 32px rgba(0,0,0,0.18)'` — spread 32px, значительно превышает `shadow-hover: 0 4px 12px rgba(31,26,18,0.08)`.
- Спек требует: §Shadows — «Минимальные. Никакого heavy soft-blur.» `--shadow-sticky: 0 -2px 8px` как максимум для sticky.
- Fix: заменить на `boxShadow: '0 4px 12px rgba(31,26,18,0.08)'` (shadow-hover token).

**P2-010 — CategoryAttributeFilters boolean toggle thumb: `bg-white` (hardcoded) (`apps/web-buyer/src/components/store/CategoryAttributeFilters.tsx:309`)**
- Что: `className="absolute top-0.5 w-5 h-5 rounded-full bg-white..."` — thumb не adaptируется к dark theme (даже если сейчас dark theme деferred, это создаёт регрессию при введении dark).
- Fix: `bg-white` → `style={{ background: colors.surface }}` (inline style).

**P2-011 — ProductsWithSearch: product grid на md — 3 колонки (`apps/web-buyer/src/components/store/ProductsWithSearch.tsx:67`)**
- Что: `grid-cols-2 md:grid-cols-3 lg:grid-cols-4` — на планшете 768-1023px показывает 3 колонки, хотя спека говорит Mobile = 2, Desktop = 4. Средней точки в спеке нет.
- Спек требует: §Product grid — «Mobile: 2 колонки» / «Desktop: 4 колонки» (1024-1280px).
- Сейчас: 768px+ = 3 col — не соответствует ни desktop (4), ни mobile (2).
- Fix: `md:grid-cols-3` → `md:grid-cols-4` либо сохранить 2 col до `lg:grid-cols-4` через `grid-cols-2 lg:grid-cols-4`. Первый вариант проще.

**P2-012 — Hardcoded `#FFFFFF` в danger-action кнопках (`apps/web-buyer/src/app/(shop)/chats/page.tsx:262,294`, `orders/[id]/page.tsx:497`, `profile/page.tsx:235`)**
- Что: кнопки «Удалить» / «Выйти» / «Да, отменить» используют `color: "#FFFFFF"` вместо токена. Для `colors.danger` (error-red `#8B3A3A`) white text корректен по контрасту, но вне token system.
- Fix: `color: "#FFFFFF"` → `color: colors.brandTextOnBg` (`#FBF7F0`) — это off-white, также проходит контраст с error-red.

**P2-013 — Profile avatar spinner: `text-white` Tailwind (`apps/web-buyer/src/app/(shop)/profile/page.tsx:158`)**
- Что: `<Loader2 className="animate-spin text-white">` на brand-bg overlay — паттерн из WS-DESIGN-P1-004 seller'а.
- Fix: заменить `text-white` → `style={{ color: colors.brandTextOnBg }}`.

**P2-014 — Отсутствует «Повторить заказ» action на order detail (`apps/web-buyer/src/app/(shop)/orders/[id]/page.tsx:422-503`)**
- Что: спека §Order detail bottom actions: «`Помощь` (outline) + `Повторить заказ` (brand-color)». В коде только «Чат по заказу» (brand) + «Открыть в Telegram» + «Отменить заказ» (danger). «Повторить заказ» полностью отсутствует.
- Спек требует: §Order detail — «Bottom actions: «Помощь» (outline) + «Повторить заказ» (brand-color)».
- Fix: добавить кнопку «Повторить заказ» под primary CTA для `DELIVERED` статуса (re-add items to cart).

---

### P3 — polish / nice to have

**P3-001 — ThemeToggle menu shadow `0 10px 24px rgba(0,0,0,0.12)` (`apps/web-buyer/src/components/theme-toggle.tsx:90`)**
- `boxShadow: '0 10px 24px rgba(0,0,0,0.12)'` — depth 10px/spread 24px выше spec shadow-hover max. Заменить на `0 4px 12px rgba(31,26,18,0.08)`.

**P3-002 — Homepage logo block: `boxShadow: '0 4px 16px rgba(124,63,46,0.18)'` (`apps/web-buyer/src/app/(shop)/page.tsx:51`)**
- Depth 4px правильно, spread 16px немного выше `--shadow-hover` (12px). Это brand-color shadow на brand block — спека не запрещает brand-tinted shadows явно, но принцип minimal shadows применим. Заменить на `0 4px 12px rgba(124,63,46,0.15)`.

**P3-003 — Buyer message timestamp: `rgba(255,255,255,0.70)` inline literal (`apps/web-buyer/src/app/(shop)/chats/page.tsx:416`)**
- `color: isBuyer ? "rgba(255,255,255,0.70)" : colors.textMuted` — первый вариант не tokenized. Заменить на `colors.brandTextOnBg` с opacity (или добавить `brandTextOnBgMuted: 'rgba(var(--color-brand-text-on-bg-raw),0.7)'` в styles.ts).

**P3-004 — «Распродажа · N» special chip не реализован (`apps/web-buyer/src/app/(shop)/[slug]/page.tsx:202-241`)**
- Спека §Categories chip-row: «Special chip «Распродажа · N» — counter в brand-color, weight 600». В category chip row нет детекции «sale» категории / флага. Пока нет sale-flag в API — зафиксировать как postMVP.

**P3-005 — Message context-menu shadow `0 8px 24px rgba(0,0,0,0.12)` (`apps/web-buyer/src/app/(shop)/chats/page.tsx:440`)**
- Spread 24px при depth 8px — граничный случай. Допустимо, но по принципу minimal shadows снизить до `0 4px 12px rgba(31,26,18,0.08)`.

**P3-006 — OtpGate icon container: `rounded-2xl` (16px) (`apps/web-buyer/src/components/auth/OtpGate.tsx:48`)**
- Декоративный иконка-box — можно оставить, но лучше `rounded-xl` (12px) или `rounded-lg` (8px) для соответствия с large surface rule = 8px.

**P3-007 — ProductsWithSearch search input: `rounded-xl` (12px) (`apps/web-buyer/src/components/store/ProductsWithSearch.tsx:48`)**
- Spec не прописывает радиус для search inputs явно, но паттерн системы = max 8px для container surfaces. `rounded-xl` → `rounded-md` (6px) или `rounded-lg` (8px).

**P3-008 — Unread badge в chat list: `text-white` Tailwind (`apps/web-buyer/src/app/(shop)/chats/page.tsx:99`)**
- `className="... text-white ..."` на `colors.brand` background. Заменить на `style={{ color: colors.brandTextOnBg }}`.

---

## Page-by-page health

| Page / Component | P1 | P2 | P3 | Worst issue |
|---|----|----|----|---|
| `(shop)/layout.tsx` | 0 | 0 | 0 | Clean |
| `(shop)/page.tsx` (homepage) | 0 | 0 | 1 | Logo shadow 16px spread |
| `[slug]/page.tsx` (storefront) | 0 | 1 | 0 | Sections без «Все →» link |
| `[slug]/products/[id]/page.tsx` | 0 | 1 | 0 | OTP gate в checkout с `rounded-2xl` |
| `(minimal)/cart/page.tsx` | 0 | 0 | 0 | Clean |
| `(minimal)/checkout/page.tsx` | 0 | 2 | 0 | OTP кнопки `rounded-2xl` |
| `(shop)/chats/page.tsx` | **2** | 3 | 2 | edit bubble white-on-white, pinned product отсутствует |
| `(shop)/orders/page.tsx` | 0 | 1 | 0 | heading `text-lg` |
| `(shop)/orders/[id]/page.tsx` | 0 | 2 | 0 | timeline no pulse, missing «Повторить заказ» |
| `(shop)/profile/page.tsx` | 0 | 2 | 0 | stats в textStrong, spinner text-white |
| `(shop)/wishlist/page.tsx` | 0 | 0 | 0 | Clean |
| `(shop)/notifications/page.tsx` | 0 | 1 | 0 | heading `text-lg` |
| `Header.tsx` | 0 | 0 | 0 | Clean |
| `BottomNavBar.tsx` | 0 | 0 | 0 | Clean |
| `HeaderSearch.tsx` | 0 | 1 | 0 | dropdown shadow 32px spread |
| `ProductCard.tsx` | 0 | 0 | 0 | Clean (borderless ✓, heart ✓, цена textStrong ✓) |
| `ProductsWithSearch.tsx` | 0 | 1 | 1 | 3-col md breakpoint, `rounded-xl` search |
| `CategoryAttributeFilters.tsx` | 0 | 2 | 0 | panel `rounded-2xl`, toggle `bg-white` |
| `ChatComposerModal.tsx` | 0 | 0 | 0 | Clean |
| `OtpGate.tsx` | 0 | 1 | 1 | `rounded-xl` inputs/buttons, `rounded-2xl` icon |
| `emoji-picker.tsx` | **1** | 0 | 1 | Dark violet glassmorphism theme (P1-001) |
| `theme-toggle.tsx` | 0 | 0 | 1 | shadow depth |
| `RecentStores.tsx` | 0 | 0 | 0 | Clean |

---

## Token discipline summary

- **Hardcoded hex/rgba: 14 distinct instances** (значительно лучше seller'а с 19)
  - Top offenders: `emoji-picker.tsx` (7 instances), `chats/page.tsx` (5 — edit bubble + timestamp + danger buttons), `profile/page.tsx` (1 — spinner), `page.tsx` homepage (1 — `#FFFFFF` на ShoppingCart icon).
  - `#FFFFFF` as literal: 6 instances (justified 4/wrong 2).
- **`backdrop-blur`: 1** — только `emoji-picker.tsx:99` (P1-001). Ноль в основных страницах.
- **`hover:bg-black/X` classes: 5** — `HeaderSearch.tsx` (×2), `CategoryAttributeFilters.tsx` (×1), `chats/page.tsx` (×2), `cart/page.tsx` (×1). Технически light-only безопасно, но нарушает token-only принцип.
- **`text-white` / `bg-white` Tailwind classes: 4** — `chats/page.tsx` (×3 на brand-colored avatars + unread badge), `profile/page.tsx` (×1 spinner).
- **`dark:` Tailwind: 0** ✓ token-through-CSS-vars система держится.

---

## End-of-doc notes

- **Dark theme drift — out of scope этого аудита.** Спека §Foundation явно говорит «Тёмная тема — отдельной итерацией». `[data-theme="dark"]` в `globals.css` сохраняет старые violet-токены — заморожено намеренно.
- **Brand-color picker в seller-онбординге** — постMVP feature, в этом аудите не рассматривается; все storefront'ы сейчас используют `#7C3F2E` (terracotta default).
- **«Распродажа» chip** (P3-004) — требует sale-flag в API от Полата; в текущем контракте категорий нет поля `isSale`.
- **«Повторить заказ»** (P2-014) — требует add-to-cart API с batch input; сейчас API принимает один item за раз — нужно обсудить с Полатом.
- **Emoji как inline-icons vs Lucide migration** — postMVP per спеке, не counting как finding.
- **Online-payment UI/UX** — «Скоро» badge реализован ✓, полная UI out of scope.
