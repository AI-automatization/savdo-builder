# Savdo — Usage Map

Где какой бренд применять. Декомпозиция по touchpoints.

---

## 1. Logo Usage Matrix

| Touchpoint | Logo | Background | Notes |
|------------|------|------------|-------|
| **App icon (TMA WebApp)** | `savdo-mark.svg` | Brand gradient | Auto-rounded Telegram |
| **@savdo_builderBOT avatar** | `savdo-mark.svg` | Solid | 512×512 PNG |
| **Channel posts header** | `savdo-wordmark.svg` | White / cream | 240×64 |
| **TMA buyer header** | `savdo-buyer.svg` | `--tg-bg` (#0B0E14) | 32×32 |
| **TMA seller header** | `savdo-seller.svg` | `--tg-bg` (#0B0E14) | 32×32 |
| **web-buyer header** | `savdo-wordmark.svg` (warm tint) | `#FBF7F0` | 200×52 |
| **web-seller header** | `savdo-wordmark.svg` | `#FFFFFF` | 200×52 |
| **admin header / sidebar** | `savdo-admin.svg` + text «Admin Panel» | `var(--surface)` | 48×48 |
| **Email signature** | `savdo-wordmark.svg` | white | 180×48 |
| **Favicon** | `savdo-mark-mono.svg` (color: brand) | — | 16×16 / 32×32 |
| **Print / 1-color ad** | `savdo-mark-mono.svg` | — | currentColor=brand |
| **App Store / Google Play** | `savdo-mark.svg` (color, 1024×1024) | brand gradient bg | — |

---

## 2. Color Usage by Component

### Buttons (primary CTA)

| Контекст | Background | Text |
|----------|-----------|------|
| TMA buyer | `var(--tg-accent)` orchid | `#0b1220` |
| TMA seller | `var(--tg-accent)` cyan (через `data-role="SELLER"`) | `#0b1220` |
| web-buyer | `var(--color-brand)` terracotta | `var(--color-brand-text-on-bg)` |
| web-seller | `var(--color-accent)` violet | white |
| admin | `var(--primary)` indigo | white |

### Status badges (universal seller terms)

| Status | Color | Light variant |
|--------|-------|---------------|
| PENDING / ожидает | `--warning` (`#F59E0B` dark / `#D97706` light) | yellow-soft surface |
| CONFIRMED / подтверждён | `--success` (`#22C55E` / `#16A34A`) | green-soft |
| SHIPPED / доставляется | `--info` `#2563EB` | blue-soft |
| DELIVERED / доставлен | `--success` deeper | green-strong |
| CANCELLED / отменён | `--error` (`#EF4444` / `#DC2626`) | red-soft |

### Cards / surfaces

- **Glass effect** (TMA): `var(--tg-surface)` rgba white 5.5%, `backdrop-filter: blur(20px)`
- **Lifted surface** (web-buyer): `bg-white shadow-sm` на cream `#FBF7F0` bg
- **Flat surface** (admin, web-seller): solid `var(--surface)` без shadow

---

## 3. Naming Conventions

### Product naming
- **Главный продукт:** «Savdo» (без UZ постфикса в логах)
- **Под-аппы:** «Savdo TMA», «Savdo Web», «Savdo Admin» — для документации/internal
- **Marketing-копи:** «Savdo — продаём в Telegram», «Магазины Savdo»
- **URL:** `savdo.uz` (main), `admin.savdo.uz`, `api.savdo.uz`
- **Bot:** `@savdo_builderBOT` (long-form в meta), просто «бот Savdo» в копии

### Sub-brand naming
- **Не использовать** «Savdo Buyer» / «Savdo Seller» в публичной коммуникации
- Внутри: «buyer-side» / «seller-side» (technical)
- В материалах: «Покупатели» / «Продавцы» (audience-facing)

---

## 4. Mascots / Stickers (нет)

Savdo не использует mascot'ов. Вместо — Telegram-native эмодзи:
- 🛍 — общий retail
- 🏪 — магазин (storefront)
- 🛒 — корзина
- 📦 — заказ
- ✨ — новинка / скидка
- ✅ — подтверждение
- ⚠️ — внимание
- 🔥 — popular / hot deal (используем редко, не spam)

---

## 5. Photography / Illustrations

### Web-buyer (Soft Color Lifestyle)
- **Тон:** тёплые, мягкие, естественный свет
- **Фон:** beige `#FBF7F0` / cream
- **Сцены:** UZ-local — базары, чай, кухня, ремесло
- **НЕ:** stock-фотки иностранцев, корпоративные офисы

### Web-seller (Liquid Authority)
- **Тон:** clean, минимализм, focus на цифры
- **Фон:** white / light grey
- **Сцены:** product flatlay, dashboard скриншоты, store mockups

### TMA
- **Не используем фото-баннеры** — только product images от продавцов
- Empty states: emoji + 1 line text

---

## 6. Voice Examples

### ✅ Хорошо

- Buyer: «Откройте Telegram и закажите за 1 минуту»
- Seller: «3 минуты на регистрацию — и принимайте заказы»
- Admin: «STORE_VERIFIED action by admin#abc123 → audit_log id=xyz»

### ❌ Плохо

- Buyer: «Осуществить процедуру оформления заказа» (бюрократизм)
- Seller: «Easy onboarding в нашем awesome продукте» (англицизмы + хайп)
- Admin: «Сегодня было много апрувов 🎉» (эмодзи в audit log)

---

## 7. Legal / Compliance Material

| Документ | Где |
|----------|-----|
| Terms of Use | `/terms` (web-buyer) — на русском + узбекском |
| Privacy Policy | `/privacy` — PII handling (GDPR-style, UZ-applicable parts) |
| Public Offer (договор оферты) | `/offer` — после регистрации юр.лица |
| Refund Policy | `/refund` |

Все 4 страницы используют shared `<LegalPage>` компонент (Wave 11).

---

## 8. Future Sub-brands (NOT YET launched)

- **Savdo Pay** — встроенный платёжный шлюз (Phase 4, после открытия юр.лица)
- **Savdo Ads** — рекламная платформа для продавцов (Phase 5)
- **Savdo Pro** — премиум-функции для top-100 продавцов (Phase 5)

Эти sub-brands пока **не дизайним** — добавим когда product roadmap подтвердится.
