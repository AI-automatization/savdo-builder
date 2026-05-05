# Buyer Design Differentiation — «Soft Color Lifestyle»

> **Дата:** 2026-05-05
> **Скоуп:** `apps/web-buyer` (web-seller — отдельной спекой позже)
> **Заменяет:** существующую систему «Liquid Authority» только в части `apps/web-buyer`
> **Цель:** отстройка визуальной идентичности от Qlay и общих AI-template'ов; создание шопинг-experience, который buyers захотят возвращаться

---

## Проблема

`web-buyer` сейчас визуально пересекается с Qlay (главным конкурентом 1:1) и с общими «дефолтами AI-генерируемых интерфейсов». Текущая система «Liquid Authority» оптимизирована под admin/dashboard ergonomics (Shopify Admin / Stripe), но buyer-storefront — это другой продукт: эмоциональный, фото-led, должен «хотеться листать».

Параллельно идёт работа над онлайн-оплатой (главным feature-gap'ом vs Qlay). Эта спека закрывает второй фронт — **визуальный pull**.

## Решение — «Soft Color Lifestyle»

Тёплая, фото-led эстетика в духе Sezane / Aimé Leon Dore / Anthropologie. Каждый магазин выбирает один из 8 кураторских brand-цветов на онбординге, и этот цвет проявляется в hero, аватарах, CTA, ссылках секций — давая каждому storefront ощущение «отдельного бренда», а не одного template.

### Что это явно не

- ❌ AI-дефолт: pastel-градиенты, glassmorphism / backdrop-blur, pill-кнопки везде, ✨-эмодзи
- ❌ Brutalism: hard-shadow offset borders, 2px borders, кислотные акценты
- ❌ Marketplace-grey (Qlay/Wildberries): нейтральная серая палитра, фото-карточки на фоне-доске

---

## Foundation

### Нейтральная база (фиксированная — не меняется между магазинами)

| Token | Hex | Использование |
|-------|-----|---------------|
| `--surface` | `#FBF7F0` | Основной фон страницы (тёплый off-white) |
| `--card` | `#FFFFFF` | Фон карточек, summary-блоков, inputs |
| `--divider` | `#EFE8DA` | Границы 1px, разделители секций |
| `--text-muted` | `#8A7D6A` | Метки, вторичный текст, плейсхолдеры |
| `--text-body` | `#3D3525` | Основной body-текст |
| `--text-strong` | `#1F1A12` | Заголовки, цена на product detail, name товара |

Тёмная тема — отдельной итерацией; в первой версии только light. Существующая dark-инфраструктура (commit `1e69621`) и `ThemeToggle` в Header сохраняются как есть — продолжают использовать старые dark-токены до тех пор, пока не будут спроектированы тёмные эквиваленты этой системы. Light-токены полностью замещаются новыми.

### Brand palette (curated — селлер выбирает 1 на онбординге)

| Имя | Hex | Personality |
|-----|-----|-------------|
| Терракота | `#7C3F2E` | **Default**. Тёплый, узбекский (тандыр, suzani) |
| Шоколад | `#6B4226` | Спокойный коричневый |
| Горчица | `#9C7A2E` | Тёплый жёлтый |
| Олива | `#5C7A3E` | Свежий зелёный |
| Хвоя | `#2F5E4F` | Глубокий зелёный |
| Морская волна | `#2C4A6E` | Глубокий синий |
| Слива | `#5E3A4E` | Винный плум |
| Уголь | `#1F2A2E` | Тёмная нейтральная (для «строгих» брендов) |

**Governance:** селлер выбирает из этих 8 на онбординге. Никакого free-input hex — это убивает целостность системы. Каждый цвет проверен на:
- контраст с `#FBF7F0` (фон) ≥ 4.5:1 — AA текст
- контраст с `#FFFFFF` (текст-on-color) ≥ 4.5:1
- тёплая или нейтральная гамма — никаких холодных pastel'ей

### Семантические цвета (фиксированные)

| Token | Hex | Когда |
|-------|-----|-------|
| `--success` | `#4A6B45` | подтверждённые статусы, "В наличии" |
| `--warning` | `#9C7A2E` | OOS-уведомления, "Мало осталось" |
| `--error` | `#8B3A3A` | "Нет в наличии", удаление, выход |

### Типография

- **Шрифт:** `Inter` — единственный. Уже в стеке, отлично читается на 3G через Telegram WebView, проверенная кириллица + узбекская латиница за 9 лет.
- **Geist отвергнут** — кириллица младше (2023), хуже отрендерена в Telegram WebView.

| Уровень | Размер | Вес | Letter-spacing | Использование |
|---------|--------|-----|----------------|---------------|
| `display` | 32-40px | 700 | -0.02em | Hero-заголовки storefront |
| `heading` | 22-30px | 700 | -0.01em | Названия товаров на product detail, заголовки страниц |
| `subhead` | 18-20px | 600 | -0.01em | Названия магазинов, секции профиля |
| `body` | 14px | 400 | 0 | Основной текст, описания |
| `body-sm` | 12-13px | 400 | 0 | Названия товаров на карточках, метаданные |
| `label` | 11px | 700 | 0.18em | UPPERCASE editorial-метки |
| `meta` | 10-11px | 400-600 | 0.05-0.1em | Подписи, статус-таймстампы |

**Editorial label trick:** маленькие uppercase-метки префиксятся ASCII-дефисом «—» — это даёт editorial-чувство без введения второго шрифта. Применяется для названий секций («— Новые поступления», «— По категориям», «— Описание»).

### Spacing (4px grid)

```
4px   xs    внутри компонентов
8px   sm    между tight-элементами (chip-row)
12px  md    padding small inputs
16px  base  между карточками в гриде, padding мобильных секций
24px  lg    padding desktop секций, gap внутри hero
32px  xl    padding desktop hero
40px  2xl   между логическими секциями страницы
```

### Border radius

| Radius | Использование |
|--------|---------------|
| `4px` | Кнопки, chip'ы категорий, размер-таблетки, mini-карточки |
| `6px` | Карточки товаров, summary-блоки, address-cards |
| `8px` | Hero-блоки, large surface containers |
| `999px` | Аватарки, status-pills, чат-композер input |

**Никаких 14-16px скруглений** — это уводит в Apple/Stripe/Vercel general look.

### Shadows

Минимальные. Никакого hard-shadow brutalist'а, никакого heavy soft-blur.

| Token | Value | Использование |
|-------|-------|---------------|
| `--shadow-card` | `0 1px 2px rgba(31,26,18,0.04)` | Дефолтные карточки (опционально) |
| `--shadow-hover` | `0 4px 12px rgba(31,26,18,0.08)` | Hover на product cards (desktop) |
| `--shadow-sticky` | `0 -2px 8px rgba(31,26,18,0.06)` | Sticky bottom CTA на mobile |

---

## Storefront landing

### Hero (главный экран магазина)

**Mobile (≤768px):**
- Фото 200px высотой full-bleed сверху
- Brand-color block ниже: editorial-метка «— Магазин Лили», h1 заголовок (24px/700), описание (12px), 2 кнопки (Все товары + Чат)
- Кнопки: primary inverted (off-white фон + brand-color текст), secondary outline (border:1px solid rgba(255,255,255,0.4))

**Desktop (≥1024px):**
- 2-колоночный hero, ratio **6fr photo : 4fr color** (CSS `grid-template-columns:6fr 4fr`)
- Левая колонка: full-bleed фото, минимум 340px высотой
- Правая колонка: brand-color block, padding 40px 32px, vertical-center контент
- Те же 2 CTA

### Product grid

- **Mobile:** 2 колонки, gap 10px, padding 16px
- **Desktop:** 4 колонки, gap 14px, padding 22px (1024-1280px); 5+ колонок на ультра-широких — постфактум

**Product card structure (атом всей системы — самый часто-показываемый элемент):**

- Borderless. Никакой обводки, никакого фона у самой карточки
- Photo aspect 1:1, скругление 6px, `object-fit:cover`
- Heart overlay top-right: 32px white pill (`rgba(255,255,255,0.85)`), `border-radius:50%`
- Под фото: название (12-13px, body color), цена (13px/700, **`--text-strong` — НЕ brand color**)
- Hover на desktop: `transform:translateY(-2px)`, опциональный `shadow-hover`

**Почему цена тёмная, а не brand-цвет:** на сетке из 8-12 карточек терракотовая цена x12 = визуальный шум. Brand-color «зарабатывается» — только hero block, CTA, section links, sale tags, hover states.

### Sections внутри storefront

Editorial pattern для каждой:

```
— НОВЫЕ ПОСТУПЛЕНИЯ                    Все 42 →
[product grid]
─────────── divider 1px #EFE8DA ───────────
— ПО КАТЕГОРИЯМ
[chip row]
```

- Editorial-метка слева (label типография), ссылка-«Все NN →» справа в brand-color, font-weight 600
- Между секциями — 1px divider `#EFE8DA`, 0 margin сверху/снизу
- Padding секций: 20-32px вертикально (mobile-desktop)

### Categories chip-row

- Mobile: горизонтальный scroll (`overflow-x:auto`)
- Desktop: flex wrap
- Chip: white фон, 1px `#EFE8DA` border, 4px radius, padding 8-10px × 14-18px
- Counter в формате «· 18» — meta-цвет
- Special chip «Распродажа · 4» — counter в brand-color, weight 600

---

## Product detail

### Mobile

Vertical stack:
1. Top bar: ← / название магазина / ♡ ⤴
2. Photo gallery — fullbleed 1:1, swipe, dots-pagination внизу, counter «1/4» top-right
3. Info block: editorial label («Керамика»), title 22px, цена 20px (`--text-strong`), stock «В наличии · 5 шт»
4. Variants: Цвет (круги 36px, выбранный с двойной обводкой), Размер (таблетки 4px radius, выбранный fill `--text-strong`)
5. Описание (editorial label «— Описание», body 13px line-height 1.55)
6. Seller card (avatar в brand-color + название + «отвечает за час» + → ссылка)
7. **Sticky bottom CTA**: qty stepper + «В корзину · 340 000» (brand-color fill)

### Desktop

Split layout:
- 7fr gallery (main image 1:1 + 4 thumbs row)
- 5fr info column со всеми блоками + 2 CTA stacked: primary «В корзину», secondary outline «💬 Спросить у продавца»
- Описание + related products — full-width ниже split

### Variant picker rules

- **Цвет:** круги 36-40px, gap 8-10px, выбранный обрамлён двойной обводкой (внутр. `--text-strong`, внеш. `--surface`, через `outline + outline-offset:-4px`)
- **Размер/опция:** таблетки 4px radius, выбранный — fill `--text-strong` (не brand-цвет, чтобы не конфликтовать с CTA)
- Лейбл вида «<span style="color:muted">Цвет:</span> **Терракотовый**» — динамически обновляется при выборе

### CTA hierarchy

- **Primary**: «В корзину · {price}» — brand-color fill, white text. Показывает финальную цену.
- **Secondary**: «💬 Спросить у продавца» — outline border 1px brand-color, brand-color text. Главное преимущество vs Qlay.

OOS-state: primary button disabled (`opacity:0.5`, `cursor:not-allowed`), вместо «В корзину» — «Уведомить когда появится».

---

## Cart + Checkout

### Cart

**Cart-store relationship (INV-C01):** один cart = один store. Top-bar показывает store-strip с brand-color avatar + название + «отвечает за час» + кнопка «💬 Чат с продавцом».

**Free-delivery progress bar:** под store-strip — карточка `rgba(brand,0.06)` с текстом «До бесплатной доставки 85 000 сум» + 4px progress bar. Когда достигнуто — карточка меняется на «✓ Бесплатная доставка».

**Item structure:**
- Mobile: 72×72 photo / title + variant meta + qty stepper + price справа в строке
- Desktop: 88×88 photo / title + variant + (qty stepper + удалить link) внутри white-card 6px radius
- OOS-item: затемнён (`opacity:0.55`), price line-through, кнопки «Уведомить когда появится» + «Удалить»

**Summary block:**
- Подытог / Доставка / **Итого** (с dashed border-top)
- Mobile: bottom над sticky CTA
- Desktop: sticky right sidebar 5fr со всеми action-кнопками

**Sticky CTA:** «Оформить заказ · {итого}» — brand-color, full-width

### Checkout

3 шага в **один экран** (не пошаговый wizard). Скорость и видимость scope > пошаговая «защита».

**Шаги (collapsible cards с цветным circle-индикатором):**

1. **Контакты** — pre-filled из аккаунта, expand-on-edit
2. **Доставка** — saved address-cards (выбранный с brand-color border 2px), кнопка «+ Новый адрес» (dashed border)
3. **Оплата** — 3 варианта:
   - **Наличные курьеру** (default selected)
   - **Картой курьеру** (UzCard / Humo POS)
   - **Online (Payme/Click)** — disabled с badge «Скоро» в brand-color

**Order comment** — optional input «Комментарий курьеру (необязательно)». Не блокирует submit.

**Submit:** «Подтвердить заказ · {итого}» — brand-color, sticky на mobile, в summary-sidebar на desktop. Disclaimer микро-текстом ниже.

---

## Connection (chat / orders / profile)

### Chat list

- Search-input + filter chips («Все · 4», «Непрочитанные · 2»)
- List items: 44px avatar (brand-color магазина) + название + last message preview + время + unread badge (brand-color магазина)
- Unread items: подсветка `rgba(brand,0.04)` фоном строки
- Read items: meta-color preview text

### Chat thread (★ differentiator vs Qlay)

- Top bar: ← / 36px brand-avatar / название + «● онлайн» / ⋯
- **Pinned product context** (когда чат открыт из карточки товара): полоса `rgba(brand,0.06)` с 40px thumb + название + цена + «Открыть →»
- Date dividers («Сегодня», «Вчера», dates)
- Bubbles:
  - **Buyer (отправляет)**: brand-color fill, white text, `border-radius:14px 14px 4px 14px` (tail bottom-right), align right
  - **Seller (получает)**: white фон, `--text-strong`, 1px `--divider`, `border-radius:14px 14px 14px 4px` (tail bottom-left), align left
- Image bubbles: те же скругления, photo внутри + caption ниже на white background
- Timestamps + read-receipts (✓✓ для buyer'a) micro-text под bubble
- **Composer:** sticky bottom, white фон, attach 📎 + input pill (`border-radius:18px`) + brand-color send-button (36px circle)

### Order detail

**Layout:**
1. Header: ← / Заказ #2841 / ⋯
2. **Status hero** — фон в brand-цвете, editorial-метка «— Статус», большой статус «В пути к вам», микро-текст «Прибудет завтра до 14:00»
3. **Timeline** — вертикальная линия с 5 dots (Заказ принят / Подтверждён / Передан курьеру / **В пути** (current, pulsing brand-color) / Доставлено)
4. Seller card с кнопкой «💬 Чат»
5. Items list (compact: 48px thumb + name + variant meta + price)
6. Summary (Подытог / Доставка / Итого + способ оплаты)
7. Bottom actions: «Помощь» (outline) + «Повторить заказ» (brand-color)

### Profile

- User-card: 56px brand-color initial-avatar + имя + телефон + «Изменить» link
- **Stats row**: 3 metrics (Заказов / В избранном / Магазинов) — большие числа в brand-color, label meta-color
- Меню секциями с editorial-labels:
  - «— Доставка и оплата»: Мои адреса / Способы оплаты («Online скоро»)
  - «— Настройки»: Уведомления (toggle в brand-color) / Тёмная тема / Язык
- Bottom: «Выйти» — outline error-color (`#8B3A3A`)

---

## Iconography

- **Текущее:** эмодзи как inline-icons (быстрый старт)
- **Целевое (postMVP):** Lucide React line-icons (уже в стеке для admin/seller). Замена эмодзи на Lucide делается отдельной итерацией; в этой спеке эмодзи оставлены как low-cost initial state

---

## Что НЕ входит в эту спеку

- Реализация brand-color picker'а в seller-онбординге (отдельная feature на стороне `web-seller`)
- Тёмная тема для buyer (вторая итерация после стабилизации light)
- A/B-тестирование старого vs нового дизайна (project-level decision)
- Перерисовка `web-seller` (отдельная спека)
- Замена эмодзи на Lucide (отдельная итерация)
- Локализация на узбекскую латиницу (предполагается что локализация уже работает)
- Online-оплата UI/UX (отдельная feature, эта спека только показывает «Скоро» badge)

---

## Критерии успеха

1. **Storefront не выглядит как Qlay** — внешний наблюдатель отличает один от другого с первого взгляда
2. **Storefront не выглядит как AI-template** — нет градиентов, glassmorphism, ✨, pastel
3. **Два магазина с разными brand-цветами выглядят как разные бренды**, не как два экземпляра одного template
4. **Mobile LCP < 2.5s на 3G** (требование из `apps/web-buyer/CLAUDE.md` сохраняется)
5. **Чат с продавцом виден buyer'у в 3 точках**: hero магазина, product detail, cart
6. **«Online оплата · Скоро» badge виден на checkout** — buyers знают что это в roadmap

---

## Implementation order (для следующей спеки)

Implementation plan будет создан отдельным шагом через `superpowers:writing-plans`. Предварительный порядок:

1. **Foundation tokens** — переписать `lib/styles.ts` под новую палитру + типографику + spacing/radii
2. **Header + BottomNav** — обновить под новую палитру, переработать иконки
3. **Storefront page** — hero + product grid + categories
4. **Product card** (атом — затрагивает store, wishlist, related)
5. **Product detail** — gallery + variants + sticky CTA
6. **Cart** — store-strip + free-delivery + items + summary
7. **Checkout** — 3-step single-screen
8. **Chat (list + thread)**
9. **Order detail**
10. **Profile + Wishlist + системные страницы**

Brand-color пока хардкодом `#7C3F2E` (terracotta default); selector в `web-seller` — postMVP.
