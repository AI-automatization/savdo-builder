# Savdo — Brand Assets

**Версия:** 1.0 · **Дата:** 2026-05-20

> Здесь живут brand-файлы Savdo. Это **non-production**, справочные ассеты — production-копии живут в `apps/*/public/` каждого приложения. Этот каталог — master-исходник.

---

## 1. Что должно быть в `assets/`

```
assets/
├── README.md                          ← вы здесь
│
├── logo-wordmark.svg                  ✅ starter (создан 2026-05-20)
├── logo-monogram-s.svg                ✅ starter (создан 2026-05-20, с плашкой)
├── logo-monogram-s-flat.svg           ✅ starter (создан 2026-05-20, без плашки)
├── logo-lockup-horizontal.svg         ✅ starter (создан 2026-05-20)
├── logo-lockup-stacked.svg            ⏳ TODO — для квадратных layouts
│
├── logo-monogram-s-dark.svg           ⏳ TODO — dark-mode variant
├── logo-wordmark-dark.svg             ⏳ TODO — dark-mode variant
├── logo-monogram-s-inverse.svg        ⏳ TODO — cream-on-terracotta для brand-bg
├── logo-monogram-s-mono-white.svg     ⏳ TODO — pure white для photo-overlay
├── logo-monogram-s-mono-black.svg     ⏳ TODO — pure black для BW print
│
├── icons/
│   ├── favicon.ico                    ⏳ TODO — 16x16 + 32x32 multisize
│   ├── favicon.svg                    ⏳ TODO — vector
│   ├── apple-touch-icon.png           ⏳ TODO — 180x180
│   ├── icon-192.png                   ⏳ TODO — PWA
│   ├── icon-512.png                   ⏳ TODO — PWA + maskable
│   ├── app-icon-ios-1024.png          ⏳ TODO — iOS App Store source
│   └── app-icon-android-432.png       ⏳ TODO — Android adaptive
│
├── og-cards/
│   ├── og-default.png                 ⏳ TODO — 1200x630 main
│   ├── og-shop-template.psd           ⏳ TODO — Photoshop template для shops
│   └── og-marketing.png               ⏳ TODO — для marketing-постов
│
├── tg-assets/
│   ├── bot-avatar-640.png             ⏳ TODO — Telegram bot avatar
│   ├── channel-cover-1280x640.png     ⏳ TODO — Telegram channel cover
│   └── stickers/                      ⏳ TODO — 30 stickers, WebP
│
├── email/
│   ├── header-logo-160.png            ⏳ TODO — для email шаблонов
│   └── template-order-confirmed.html  ⏳ TODO — HTML email
│
├── print/
│   ├── business-card-front.pdf        ⏳ TODO — 96x56mm (with bleed)
│   ├── business-card-back.pdf         ⏳ TODO
│   └── letterhead.pdf                 ⏳ TODO — A4
│
└── fonts/                             ❌ НЕ НУЖНО хранить
    └── (Inter подключается через next/font/google, не embed)
```

---

## 2. Уже созданные (starter, требуют polish от дизайнера)

### `logo-wordmark.svg`

Простой текстовый SVG: «Savdo» в Inter Semibold, terracotta `#7C3F2E`, 160x48.

**Что нужно довести:**
- Зависит от системного Inter — для production embed font или convert to paths.
- Опционально: minor custom-lettering — slightly tighter `S` arc, или distinctive `d` ascender.

### `logo-monogram-s.svg`

Геометрический S на terracotta плашке 64x64 с `rx=14` (≈ 22% corner radius для iOS-friendly).

**Что нужно довести:**
- S сейчас — stroked-path (просто draw command). Для production нужно:
  - Custom filled path вместо stroke
  - Optical correction в верхнем и нижнем арках
  - Решить: с плашкой или без (этот вариант — с)
- Альтернатива: проконсультироваться с illustrator чтобы создать distinctive S, а не generic.

### `logo-monogram-s-flat.svg`

То же что выше, но **без плашки** — для размещения на cream background `#FBF7F0`.

### `logo-lockup-horizontal.svg`

Композиция: monogram (48x48 plate) + wordmark «Savdo» (32px height). 192x48 total.

---

## 3. Колоничные правила для всех ассетов

### Naming convention

```
logo-{type}-{variant}-{theme}.{ext}

type:     monogram | wordmark | lockup-horizontal | lockup-stacked
variant:  flat | with-plate | mono
theme:    (none для light) | dark | inverse | mono-white | mono-black
ext:      svg | png | pdf

Examples:
  logo-monogram-s.svg                       — default (light, with plate)
  logo-monogram-s-flat.svg                  — default (light, no plate)
  logo-monogram-s-flat-dark.svg             — dark mode, no plate
  logo-monogram-s-inverse.svg               — for brand-color background
  logo-wordmark.svg                         — default
  logo-lockup-horizontal.svg                — default
  logo-lockup-stacked-mono-white.svg        — stacked, monochrome white
```

### Format priority

1. **SVG** для всего vectoral (logo, icons).
2. **PNG** только для:
   - App store / Apple / Android (требуют PNG)
   - Email (некоторые клиенты не отображают SVG)
   - OG-cards (FB / Twitter spec PNG)
3. **PDF** для print only (визитки, листы).
4. **ICO** только для favicon multi-size.

### SVG quality rules

- **viewBox** обязателен.
- **role="img"** + **`<title>`** обязательны для accessibility.
- **fill / stroke** в `currentColor` где возможно — позволяет управлять цветом через CSS `color`.
- **HEX в SVG** только когда цвет неизменный (logo brand-color).
- **Без `<style>` тагов** внутри SVG — все style inline.
- **Без `width` / `height` атрибутов** в production-SVG, только viewBox. Размер задаётся через CSS.

### PNG export rules

- **Native @1x:** размер по spec (например, 192x192).
- **@2x:** не нужен если есть SVG. Нужен только для legacy email.
- **sRGB color profile** (не Adobe RGB).
- **No alpha для App Store icons** (Apple требует opaque).
- **Optimize** через `tinypng.com` или `imagemagick -strip` после export.

---

## 4. Где production-копии живут

Когда финальные ассеты готовы — копируются в нужные приложения:

| Asset | Production location |
|-------|---------------------|
| favicon.ico, favicon.svg | `apps/web-buyer/src/app/favicon.ico` + Next 16 metadata |
| apple-touch-icon.png | `apps/web-buyer/public/apple-touch-icon.png` |
| icon-192/512.png | `apps/web-buyer/public/icon-192.png` etc + manifest.json |
| og-default.png | `apps/web-buyer/src/app/opengraph-image.tsx` (generated) |
| Bot avatar | uploaded to @BotFather через `/setuserpic` |
| Email logo | inline в email шаблонах в `apps/api/src/email/**` |
| Telegram channel cover | uploaded manually to channel |

**Master-исходники** (vector, full-res PNG, PDF) — здесь, в `docs/brand/assets/`.
**Production-копии** (optimized, sized) — в `apps/*/public/` или генерируются через `next/og`.

---

## 5. Fonts

**Inter** подключается через `next/font/google` в каждом Next.js приложении:

```ts
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ['latin', 'cyrillic'], variable: '--font-inter' });
```

**НЕ храним font-файлы (.woff2 etc) в `assets/fonts/`** — Google Fonts CDN + Next.js self-hosting handles это автоматически.

Если когда-нибудь захотим self-host без `next/font`:
- Download Inter Variable woff2 from rsms.me/inter
- Place в `apps/web-buyer/public/fonts/Inter.var.woff2`
- Add `@font-face` в `globals.css`

---

## 6. Что **НЕ нужно** хранить в `assets/`

- **Source файлы дизайнера** (.ai, .fig, .sketch, .psd) — хранятся в **Figma / Adobe Cloud** дизайнером, не в git.
- **Скриншоты UI** — это `analiz/` или `design/`, не brand.
- **Иллюстрации товаров / маркетинг-фотки** — это marketing-storage (R2 / S3), не brand.
- **Mascot illustrations** (если когда-нибудь сделаем) — отдельный sub-folder `mascot/` или отдельный repo.

---

## 7. Версионирование

- Каждое **значимое обновление логотипа** — увеличиваем версию в названии: `logo-monogram-s-v2.svg`, или в Git commit.
- Старые версии **не удаляем сразу** — оставляем `_archive/` подпапку.
- Для backwards-compat: `apps/*/public/favicon.ico` всегда указывает на **текущую версию**, history через git.

---

## 8. Лицензии

- Все ассеты в этом каталоге — **собственность проекта Savdo**.
- Logo, wordmark, monogram — будут зарегистрированы в Узпатенте (см. `logo-spec.md` §11). Пока не зарегистрированы — © Savdo 2026.
- **Inter** — Open Font License (OFL), permissive — можем использовать commercial.
- **lucide-react icons** (используются в коде) — ISC license, permissive.
- **Telegram logo / brand** — собственность Telegram. Используем только как identifier «Войти через Telegram», следуем Telegram brand guidelines.

---

## 9. История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | v1. Структура каталога определена. Starter SVG для wordmark, monogram, lockup. Большинство icons / og-cards / print — TODO. |
