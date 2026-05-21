# Savdo — Application Examples

**Версия:** 1.0 · **Дата:** 2026-05-20

> Текстовые mockup-описания брендовых применений. Каждый раздел — это спецификация для дизайнера / разработчика: что должно быть на носителе, какие токены, какие размеры. Финальные графические файлы создаёт Азим.

---

## 1. App icon — iOS

### Specs

- **Source size:** 1024×1024 PNG, sRGB, no alpha (Apple ассеты не любят прозрачность на главной иконке).
- **Corner:** App Store автоматически применяет 22.5% continuous-corner mask. Не сглаживать углы вручную — пусть Apple маска работает.
- **Bleed:** контент icon'а не должен подходить ближе чем 8% от краёв (avoid edge clipping когда iOS чуть-чуть кропит).

### Design

```
┌─────────────────────────────┐
│                             │
│       ┌───────────┐         │
│       │           │         │
│       │   S       │         │  ← monogram S (cream #FBF7F0)
│       │           │         │
│       └───────────┘         │
│                             │
│      (terracotta plate)     │  ← #7C3F2E fill (light)
│                             │
└─────────────────────────────┘
```

- **Background:** solid `#7C3F2E` (terracotta light).
- **Foreground:** monogram S в `#FBF7F0` (cream), занимает ~50% width.
- **Без shadows, без gradients, без text.** Только monogram.

### Dark mode (iOS 18+)

iOS 18 поддерживает отдельный dark-icon. Для нас:
- **Background:** `#1F1208` (warm-coal, как warm-bg dark surface elevated).
- **Foreground:** monogram S в `#A05A45` (terracotta dark).

### Tinted mode (iOS 18+)

Apple применяет automatic tinting. Для совместимости:
- Тестировать на iOS 18 simulator
- Возможно нужен отдельный monochrome glyph-variant

### Sizes

App Store / Xcode требует 1024×1024 source. iOS генерирует:
- 180×180 (iPhone @3x)
- 167×167 (iPad Pro)
- 152×152 (iPad)
- 120×120 (iPhone @2x)
- 87×87 (Settings @3x)
- 80×80 (Spotlight @2x)
- 76×76 (iPad legacy)
- 60×60 (Settings @2x)
- 58×58 (Settings @2x compact)
- 40×40 (Notifications @2x)

Все генерируются из source 1024×1024 через Xcode asset catalog.

---

## 2. App icon — Android

### Specs

- **Source:** 432×432 adaptive icon (108dp foreground + 108dp background).
- **Foreground layer:** monogram S, размер 66dp в центре (24dp safe-padding со всех сторон).
- **Background layer:** solid `#7C3F2E`.
- **Mask:** Android system применяет dynamic mask (rounded square / squircle / circle / teardrop в зависимости от launcher).

### Design

```
Foreground layer (108dp):
┌──────────────────────────┐
│                          │
│  ┌────────────────────┐  │
│  │                    │  │
│  │   S (cream)        │  │   ← monogram S
│  │                    │  │
│  └────────────────────┘  │
│   (24dp safe padding)    │
└──────────────────────────┘

Background layer (108dp):
solid #7C3F2E (terracotta)
```

### Notification icon

Android рекомендует **monochrome white** для status-bar notification:
- 24×24 PNG, transparent background, `#FFFFFF` foreground
- Simplified monogram S (или просто white S letter)

---

## 3. Favicon — Web

### Specs

| File | Size | Format | Notes |
|------|------|--------|-------|
| `favicon.ico` | 32×32 (multi-size 16×16, 32×32) | ICO | classic favicon |
| `favicon.svg` | vector | SVG | modern (Chrome, Firefox, Safari 13+) |
| `apple-touch-icon.png` | 180×180 | PNG | iOS Safari "Add to Home" |
| `icon-192.png` | 192×192 | PNG | PWA manifest |
| `icon-512.png` | 512×512 | PNG | PWA manifest, install screen |

### Design

Все варианты — **solo monogram-S на terracotta plate** (см. `assets/logo-monogram-s.svg`).

### HTML head

```html
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="icon" type="image/x-icon" href="/favicon.ico" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="theme-color" content="#7C3F2E" media="(prefers-color-scheme: light)" />
<meta name="theme-color" content="#16120D" media="(prefers-color-scheme: dark)" />
```

---

## 4. PWA manifest

```json
{
  "name": "Savdo",
  "short_name": "Savdo",
  "description": "Telegram-native store builder for Uzbekistan",
  "start_url": "/",
  "display": "standalone",
  "orientation": "portrait",
  "background_color": "#FBF7F0",
  "theme_color": "#7C3F2E",
  "lang": "uz",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 5. Telegram OG-card (link preview)

### Specs

- **Size:** 1200×630 PNG (Telegram, FB, Twitter all support).
- **Aspect:** 1.91:1.
- **Max file size:** < 1MB (Telegram запрашивает быстро, тяжёлые файлы не показываются).

### Design — главная Savdo

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌──────────┐                                                  │
│   │   S      │   Savdo                       (160px lockup)     │
│   └──────────┘                                                  │
│                                                                 │
│   Telegram-магазин                                              │
│   за 60 секунд                          (h1, 72px, semibold)    │
│                                                                 │
│   Витрина, корзина, заказы — без                                │
│   регистрации клиентов                  (subtitle, 32px)        │
│                                                                 │
│                                                                 │
│   savdo.uz                              (footer, 24px, muted)   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
   ↑ background: #FBF7F0 (cream)
   text colors: brand #7C3F2E for headlines, textBody for subtitle
```

### Design — витрина продавца (dynamic)

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌─────────┐ ┌──────────────────────────────────┐             │
│   │         │ │   Lola Shop                      │             │
│   │  LOGO   │ │   Одежда • Тошкент               │             │
│   │  shop   │ │   45 товаров                     │             │
│   └─────────┘ └──────────────────────────────────┘             │
│                                                                 │
│   ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐           │
│   │  pic1 │ │  pic2 │ │  pic3 │ │  pic4 │ │  pic5 │           │
│   └───────┘ └───────┘ └───────┘ └───────┘ └───────┘           │
│                                                                 │
│   savdo.uz/lola-shop · powered by Savdo                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
   ↑ background: #FBF7F0
   shop logo and name from seller's data
   "powered by Savdo" — wordmark в brand-цвете, всегда снизу справа
```

### Implementation

Next.js Open Graph generation через `app/opengraph-image.tsx` (next/og). Шаблон в `apps/web-buyer/src/app/[slug]/opengraph-image.tsx` (если ещё нет — создать).

---

## 6. Push-уведомление (Telegram bot)

### Specs

- **Channel:** Telegram bot @savdo_builderBOT
- **Format:** plain text + optional inline keyboard
- **Length:** до 160 chars в первой строке (preview)
- **Emoji:** 1 максимум

### Шаблоны

#### Новый заказ (seller)

```
🛒 Новый заказ №142 — Aziza
2 товара на 320 000 сум

[Открыть заказ]  [Связаться с клиентом]
```

#### Заказ оплачен (seller)

```
✓ Заказ №142 оплачен — 320 000 сум через Click

[Подтвердить отправку]
```

#### Сообщение от клиента (seller)

```
💬 Aziza написала в магазине

«Здравствуйте, есть размер M?»

[Открыть чат]
```

#### Подтверждение заказа (buyer)

```
✓ Заказ №142 принят в Lola Shop
Продавец напишет вам в Telegram

[Открыть заказ]  [Чат с продавцом]
```

### Дизайн правила

- **Bot avatar:** monogram S terracotta plate, 640×640
- **Bot name:** `Savdo` (без «bot», «builder», «assistant»)
- **Bot bio:** `Telegram-магазин за 60 секунд · @savdo_team`

---

## 7. Email-шаблон

### Specs

- **Width:** 600px (стандарт email).
- **Format:** HTML с inline CSS (некоторые клиенты не понимают `<style>`).
- **Fallback:** plain-text version обязательна (для Telegram preview, для blind-clients, для GMail tabs).
- **Fonts:** system-stack fallback (Inter не загружается в email-клиентах надёжно).

### Шаблон — заказ принят (buyer)

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <title>Заказ №142 принят</title>
</head>
<body style="margin:0; padding:0; background:#FBF7F0; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">

  <!-- Container -->
  <table width="600" cellpadding="0" cellspacing="0" border="0" align="center" style="margin:0 auto; background:#FFFFFF; border:1px solid #EFE8DA; border-radius:12px; overflow:hidden;">

    <!-- Header with wordmark -->
    <tr>
      <td style="padding:24px 32px; border-bottom:1px solid #EFE8DA;">
        <span style="font-size:24px; font-weight:600; letter-spacing:-0.01em; color:#7C3F2E;">Savdo</span>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding:32px;">
        <h1 style="margin:0 0 16px; font-size:24px; font-weight:700; color:#1F1A12;">Заказ №142 принят</h1>
        <p style="margin:0 0 16px; font-size:16px; line-height:1.5; color:#3D3525;">
          Здравствуйте, Aziza.<br>
          Ваш заказ на <strong>320 000 сум</strong> принят в магазине <strong>Lola Shop</strong>. Продавец напишет вам в Telegram в ближайшее время.
        </p>

        <!-- Order items -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0; border-top:1px solid #EFE8DA;">
          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #EFE8DA;">
              <span style="font-size:14px; color:#3D3525;">Платье шёлковое, M × 1</span>
            </td>
            <td style="padding:12px 0; border-bottom:1px solid #EFE8DA; text-align:right;">
              <span style="font-size:14px; font-weight:600; color:#1F1A12;">220 000 сум</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0; border-bottom:1px solid #EFE8DA;">
              <span style="font-size:14px; color:#3D3525;">Сумка кожаная × 1</span>
            </td>
            <td style="padding:12px 0; border-bottom:1px solid #EFE8DA; text-align:right;">
              <span style="font-size:14px; font-weight:600; color:#1F1A12;">100 000 сум</span>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 0;">
              <span style="font-size:16px; font-weight:700; color:#1F1A12;">Итого</span>
            </td>
            <td style="padding:12px 0; text-align:right;">
              <span style="font-size:16px; font-weight:700; color:#1F1A12;">320 000 сум</span>
            </td>
          </tr>
        </table>

        <!-- CTA -->
        <a href="https://savdo.uz/orders/142" style="display:inline-block; padding:12px 24px; background:#7C3F2E; color:#FBF7F0; text-decoration:none; font-size:14px; font-weight:600; border-radius:8px;">
          Открыть заказ
        </a>

      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="padding:24px 32px; background:#FBF7F0; border-top:1px solid #EFE8DA;">
        <p style="margin:0; font-size:12px; line-height:1.5; color:#8A7D6A;">
          Это автоматическое письмо от <strong>Savdo</strong> — платформы Telegram-магазинов.<br>
          Вопросы: <a href="https://t.me/savdo_support" style="color:#7C3F2E; text-decoration:none;">@savdo_support</a>
        </p>
      </td>
    </tr>

  </table>

</body>
</html>
```

### Цветовые токены в email

- `#FBF7F0` — page bg
- `#FFFFFF` — content surface
- `#EFE8DA` — border
- `#7C3F2E` — brand (wordmark, CTA bg, links)
- `#FBF7F0` — CTA text
- `#1F1A12` — strong text (h1, prices)
- `#3D3525` — body text
- `#8A7D6A` — footer muted text

---

## 8. Печатные материалы — визитка

### Specs

- **Size:** стандарт UZ 90×50 mm.
- **Bleed:** 3 mm со всех сторон → finished art 96×56 mm.
- **Resolution:** 300 dpi (1063×590 px for 90×50 mm).
- **Color profile:** CMYK для печати (конверсия из sRGB).
- **Paper:** matte 250-300 gsm, no gloss.

### Дизайн — front

```
┌──────────────────────────────────────────┐
│                                          │
│    ┌────┐  Savdo                         │
│    │ S  │                                │ ← lockup, top-left
│    └────┘                                │
│                                          │
│                                          │
│                                          │
│                                          │
│                    Telegram-магазин      │ ← tagline, right
│                    за 60 секунд          │
│                                          │
└──────────────────────────────────────────┘
   background: #FBF7F0 (cream)
   logo: terracotta
   tagline: textBody #3D3525
```

### Дизайн — back

```
┌──────────────────────────────────────────┐
│                                          │
│   Polat Karimov                          │ ← name, h3
│   Founder                                │ ← role, muted
│                                          │
│   ────────────────────                   │ ← divider, brand-border
│                                          │
│   @polatkarimov                          │
│   polat@savdo.uz                         │
│   +998 77 123 4567                       │
│                                          │
│                              savdo.uz    │ ← bottom-right
└──────────────────────────────────────────┘
   background: #FBF7F0
   text: textBody
   "savdo.uz" — brand color
```

### Printing

- Цвет terracotta `#7C3F2E` → CMYK ~ `C:30 M:75 Y:80 K:50` (зависит от профиля принтера, request proof).
- НЕ использовать spot-color (Pantone) для terracotta пока — будет в v2 если печать станет регулярной.

---

## 9. Telegram channel cover

### Specs

- **Size:** 1280×640 PX (рекомендация Telegram для channel covers).
- **Format:** PNG / JPG.
- **Mobile crop:** Telegram кропит до 640×640 на mobile — важные элементы держать в центральном квадрате.

### Design

```
┌─────────────────────────────────────────────────────────────┐
│  (left padding 80px)                                        │
│                                                             │
│      ┌──────┐                                               │
│      │  S   │   Savdo                                       │
│      └──────┘                                               │
│                                                             │
│      Telegram-магазин за 60 секунд                          │
│                                                             │
│      savdo.uz · @savdo_team                                 │
│                                                             │
└─────────────────────────────────────────────────────────────┘
   background: #FBF7F0
   lockup: terracotta
```

### Mobile center-crop (640×640)

Лого + tagline должны помещаться в **center 640×640** square — Telegram кропит края на mobile.

---

## 10. Marketing landing — hero section

### Specs

- **Width:** full-bleed up to 1440px content max.
- **Height:** ~80vh на desktop, auto на mobile.

### Design

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│   ┌────┐  Savdo                                  [Войти]        │ ← header
│   └────┘                                                        │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ─ TELEGRAM-МАГАЗИН ЗА 60 СЕКУНД                               │ ← overline
│                                                                 │
│   Витрина, корзина, заказы                                      │ ← h1, 56px
│   без программистов                                             │
│                                                                 │
│   Поделитесь ссылкой в Telegram-канале — клиенты придут.        │ ← subtitle
│   Без регистраций, без комиссий.                                │
│                                                                 │
│   [Создать магазин]   [Посмотреть пример]                       │ ← CTA dual
│                                                                 │
│   Поддерживаем Click • Payme • Uzcard                           │ ← trust
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
   background: #FBF7F0
   overline: brand color, tracking 0.18em, 11px
   h1: textStrong #1F1A12, weight 700, size 56px
   subtitle: textBody #3D3525, 18px
   CTA primary: brand bg + cream text
   CTA secondary: brand-muted bg + brand text + brand-border
   trust line: textMuted #8A7D6A, 14px
```

### Copy framework — PAS (Problem / Agitation / Solution)

- **Problem (overline):** «Telegram-магазин» — обозначаем категорию.
- **Agitation (h1):** «без программистов» — снимаем барьер.
- **Solution (subtitle + CTA):** «за 60 секунд, без регистрации, без комиссий» + конкретное действие.

---

## 11. Sticker pack (Telegram)

### Specs

- **Format:** WebP / TGS (animated).
- **Size:** 512×512 max, transparent background.
- **Pack size:** 30 stickers max.

### Concept — «Savdo Daily Phrases»

Стикеры с короткими фразами retail-продавца, использующими brand-цвет:

1. «Здравствуйте!» / «Salom!» — терракотовый speech-bubble + лёгкая иллюстрация
2. «В наличии» / «Mavjud»
3. «Спасибо за заказ!» / «Buyurtmangiz uchun rahmat!»
4. «Доставим завтра» / «Ertaga yetkazib beramiz»
5. «Лимитка» / «Cheklangan miqdor»
6. «Скидка» / «Chegirma»
...

**Style:** flat illustration, terracotta + cream palette, no shadows. Avoid mascot для V1 (см. logo-spec — mascot решение TBD).

---

## 12. Чек-лист «правильное брендовое применение»

Перед публикацией / printing любого носителя:

- [ ] Logo использован правильно (lockup или solo, цвет terracotta или inverse)
- [ ] Clear space соблюдён
- [ ] Background — `#FBF7F0` (cream) или solid `#7C3F2E` (brand)
- [ ] Текст — token'ы из палитры (`#1F1A12` / `#3D3525` / `#8A7D6A`)
- [ ] Шрифт Inter (или system-fallback в email)
- [ ] Apostrof `ʻ` правильный в узбекских словах
- [ ] Сум через пробел: `320 000 сум`
- [ ] Эмодзи макс 1
- [ ] Voice & tone соответствует (см. `voice-and-tone.md`)
- [ ] Контраст AA (4.5:1) для текста
- [ ] PWA / OG / email — `theme-color #7C3F2E`

---

## 13. История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | v1. App icon, favicon, PWA manifest, OG-card, push, email, визитка, channel cover, landing hero, stickers. |
