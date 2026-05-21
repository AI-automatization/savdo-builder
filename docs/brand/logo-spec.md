# Savdo — Logo Specification

**Версия:** 1.0 · **Дата:** 2026-05-20

---

## 1. Что есть «логотип Savdo»

Текущее (на 2026-05-20) — wordmark «Savdo» Inter Semibold в `--color-brand`. В разных приложениях рядом с wordmark стоят разные иконки (ShoppingCart в buyer, ShoppingCart в seller — разные размеры и цвета). Эта несогласованность — главная brand-проблема, которую нужно решить.

Этот документ предлагает **пять концептов** логотипа от консервативного (просто wordmark) до художественного (mascot), с deg of commitment к brand-выражению. Финальный выбор — задача Азима + бизнес-решение.

---

## 2. Пять концептов

### 2.A — Polished Monogram «S» ⭐ (рекомендация)

**Идея:** одна буква **S**, нарисованная как geometric path — единая фигура, которая работает на favicon, app icon, watermark, OG-card.

**Визуальный язык:**
- Solid terracotta fill (`#7C3F2E` light / `#A05A45` dark).
- Можно с lift-radius (rounded corners 16% от bounding box) — для app-icon-friendliness.
- Внутренняя геометрия S — может намекать на «весы» (символ торговли) или на «рулон ткани» (бытовая торговля), не буквально.

**Pros:**
- Уникально, не похоже ни на одну UZ-платформу.
- Хорошо работает в малых размерах (16x16 favicon, 32x32 app tile).
- Перевешивает в иерархии иконка → wordmark на больших layouts.
- Не зависит от языка (на uz/ru вписывается одинаково).

**Cons:**
- Требует custom-illustration (Азим / контрактор-дизайнер).
- Меньше понятный «о чём проект» без context'а.

**Применение:**
- Favicon: 32x32, 16x16
- App icon (iOS/Android/PWA): 180x180, 512x512
- TG webapp icon: 256x256
- Маленький лого в footer / в email-подписи (24x24 — 48x48)
- В компании с wordmark: monogram (32px) + 12px gap + wordmark «Savdo» (24px)

### 2.B — Paper-plane + Shopping-bag Hybrid

**Идея:** упрощённый paper-plane (Telegram-семантика) объединён с shopping bag — одна композитная фигура.

**Визуальный язык:**
- 2-цветный: terracotta `#7C3F2E` (bag) + Telegram-blue `#2AABEE` (plane), либо monochrome terracotta.
- Stroke 2-3px, не fill.

**Pros:**
- Сразу понятно «Telegram + торговля» — semantic-loaded.
- Хорошо смотрится на marketing-сайте.

**Cons:**
- 2 цвета — сложнее в малых размерах.
- Telegram-blue появляется в brand-точке — может конфликтовать с правилом «Telegram blue только для CTA».
- Метафора может стать датированной если Telegram ребрендится.

### 2.C — Pure Wordmark «Savdo»

**Идея:** только текст «Savdo», без иконки. Wordmark становится самостоятельным знаком.

**Визуальный язык:**
- Inter Semibold 600.
- Terracotta `#7C3F2E`.
- Tracking `-0.015em`.
- Может быть custom-lettering вариант (Азим перерисует S как distinctive glyph — slight curve в S, плотнее в d), но это уже next-step.

**Pros:**
- Минимум усилий на старте (буквально CSS).
- Имя «Savdo» начинает само работать как знак.
- Хорошо на marketing (большой текст), в email-подписи.

**Cons:**
- Favicon 16x16 — wordmark «Savdo» нечитаем, нужен fallback на «S» monogram.
- Меньше memorability чем у визуальной марки.
- Trademark в UZ: «Savdo» — словарное слово, защитить сложно. Визуальный знак защищается легче.

### 2.D — Orientalist Mark (узбекский орнамент)

**Идея:** stylized мотив из узбекской орнаментики (ислими, гирих, риштан-керамика) сведённый в minimal-mark.

**Визуальный язык:**
- Geometric pattern, тонкие линии, симметрия.
- Terracotta + cream (двухцветный).

**Pros:**
- Максимум UZ-cultural embedding.
- Уникально на 100%.

**Cons:**
- Риск ориентализма / клише («мы для туристов»).
- Требует сильного иллюстратора чтобы получилось не cringe.
- Может ограничить brand «только UZ» — если когда-то выйдем в KZ/KG, придётся ребрендить.
- В малых размерах теряется детализация.

**Вердикт:** для текущего этапа — overkill. Можно использовать как декоративные элементы во второстепенных контекстах (footer ornament, illustration в onboarding), но не как primary mark.

### 2.E — Mascot («Лолабай», тётушка-продавщица)

**Идея:** иллюстрация торговки/продавца — character который становится лицом бренда. Появляется в onboarding, error-pages, push, marketing.

**Визуальный язык:**
- Иллюстрация: warm-tinted, не cartoonish, geometric character (без расовых стереотипов!).
- Mascot имеет имя — Лолабай, Эмиржон, или нейтральное «Savdo Baby».

**Pros:**
- Сильный эмоциональный якорь.
- Помогает с marketing-каналом (mascot в push'е → выше engagement).
- Уникально среди UZ-конкурентов (ни у кого нет mascot).

**Cons:**
- Очень дорого: нужен dedicated illustrator, 20-30 поз mascot'а для разных сценариев.
- Риск возрастной/гендерной/расовой неудачи.
- В корпоративных контекстах (email, OG-card) mascot может выглядеть детски.
- Не работает как logo на favicon.

**Вердикт:** mascot — это secondary brand-asset, не primary logo. Можно использовать ПОВЕРХ Polished Monogram (2.A) как marketing-character, но не вместо.

---

## 3. Финальная рекомендация

**Primary logo:** концепт **2.A — Polished Monogram S** (геометрическая S) + **wordmark «Savdo»** в Inter Semibold.

**Composition rules:**
1. **Lockup (горизонтальный):** monogram-S (left) + 12px gap + «Savdo» (right). Используется в headers, sidebars, marketing.
2. **Stacked (вертикальный):** monogram-S (top) + 4px gap + «Savdo» (bottom, под monogram). Используется в square layouts — share-cards, profile-pic, email-signature.
3. **Solo monogram:** только S — favicon, app icon, watermark.
4. **Solo wordmark:** только «Savdo» — там, где места мало для monogram (very narrow header, footer-line).

---

## 4. Proportions

### Monogram S

- **Bounding box:** square 1:1.
- **Stroke / fill:** solid terracotta fill, no gradient, no outline.
- **Inner geometry:** S занимает 70% bounding box (по высоте), padding 15% сверху и снизу.
- **App icon corner radius (если используется как app icon):** 22.5% (Apple HIG iOS) или 15% (Android adaptive icon mask handles это сам).
- **Aspect ratio:** strict 1:1. Никогда не растягивать в овал.

### Wordmark «Savdo»

- **Cap-height (S):** define как `1S` unit.
- **x-height (a, v, d, o):** ≈ `0.72S`.
- **Tracking:** `-0.01em`.
- **No descenders** (нет букв с нижними хвостами кроме «p» — но в «Savdo» их нет → wordmark остаётся в верхней половине line-box, что облегчает alignment).

### Lockup (horizontal)

```
[monogram-S 32x32]  [12px gap]  [wordmark "Savdo" 24px height]
```

Высота monogram должна быть **больше** высоты wordmark на ~30% — monogram становится визуальной точкой опоры, wordmark — подписью.

---

## 5. Clear space

**Clear space** = пустое пространство вокруг логотипа, в которое не должны заходить другие элементы.

- **Monogram solo:** clear space = `0.5x monogram size` со всех сторон. Пример: monogram 64x64 → 32px clear на каждую сторону.
- **Lockup (monogram + wordmark):** clear space = `1x cap-height of wordmark` со всех сторон. Пример: wordmark «S» cap-height = 18px → 18px clear.
- **Wordmark solo:** clear space = `0.5x cap-height`.

Это стандарт «8x высоты x-letter» из ТЗ адаптирован к нашим пропорциям (Inter довольно низкий, поэтому 0.5x-1x cap-height достаточно).

---

## 6. Минимальные размеры

| Сценарий | Min size | Что используется |
|----------|----------|------------------|
| Favicon | 16x16 | monogram-S |
| App icon iOS | 1024x1024 (source); 60x60 минимум display | monogram-S с lift-radius |
| App icon Android | 432x432 adaptive (108dp foreground + 108dp background) | monogram-S |
| TMA icon | 256x256 source | monogram-S |
| Web header (mobile) | 24x24 monogram + 18px wordmark | lockup |
| Web header (desktop) | 32x32 monogram + 24px wordmark | lockup |
| Email signature | 80x80 monogram + 32px wordmark stacked | stacked |
| Print (визитка) | min 12mm wide | lockup |
| OG-card 1200x630 | logo 200x200 monogram | solo monogram |

**Никогда:** monogram < 16px, wordmark < 14px.

---

## 7. Цветовые варианты

### 7.1 Standard (light bg)

| Element | Color |
|---------|-------|
| Monogram fill | `#7C3F2E` (terracotta light) |
| Wordmark text | `#7C3F2E` (terracotta light) |

### 7.2 Standard (dark bg)

| Element | Color |
|---------|-------|
| Monogram fill | `#A05A45` (terracotta dark) |
| Wordmark text | `#A05A45` (terracotta dark) |

**Альтернатива на dark:** `#F5EFE3` (warm-cream) — когда logo нужно максимально contrast'ить, в monochrome dark-marketing. Но **default — terracotta-dark**, не cream.

### 7.3 Inverse (на брендовом terracotta-фоне)

Когда лого размещается на сплошном terracotta-фоне (например, hero-section с full-bleed brand-color, или badge на product card):

| Element | Color |
|---------|-------|
| Monogram fill | `#FBF7F0` (cream — `--color-brand-text-on-bg`) |
| Wordmark text | `#FBF7F0` |

### 7.4 Monochrome white (для печати / однотонных контекстов)

Используется на тёмных фото-фонах, на промо-полиграфии где terracotta печать дорогая, или в Telegram dark mode когда нет места для контраста.

| Element | Color |
|---------|-------|
| Monogram fill | `#FFFFFF` 100% |
| Wordmark text | `#FFFFFF` 100% |

### 7.5 Monochrome black (для print BW)

Используется только для односторонней BW печати (накладные, чеки). Полностью `#000000`.

| Element | Color |
|---------|-------|
| Monogram fill | `#000000` 100% |
| Wordmark text | `#000000` 100% |

### 7.6 Outlined (resort, redshold)

В edge-cases когда нужен logo с прозрачным fill (например, watermark на фото).

| Element | Style |
|---------|-------|
| Monogram | stroke 2px terracotta, fill none |
| Wordmark | terracotta, normal |

**Использовать редко** — full-fill версия читается лучше.

---

## 8. Do / Don't

### ✅ Do

1. **Используй monogram + wordmark вместе** как primary lockup везде, где есть место.
2. **Сохраняй terracotta семейство** в обоих темах (light = `#7C3F2E`, dark = `#A05A45`).
3. **Используй monogram solo** для favicon, app icon, маленьких контекстов.
4. **Сохраняй clear space** — другие элементы не вторгаются в зону.
5. **Используй inverse cream** (`#FBF7F0`) когда фон — solid terracotta.
6. **На фото-фоне** добавляй subtle background plate (white rounded rectangle, opacity 90%) для контраста — не помещай logo прямо на сложный фон.

### ❌ Don't

1. **Не растягивай / не сжимай** — только uniform scale, аспект 1:1 для monogram, фиксированный для lockup.
2. **Не накладывай эффекты** — нет drop-shadow, нет outer-glow, нет inner-shadow, нет 3D-emboss.
3. **Не используй градиенты** — solid fill только.
4. **Не используй другой шрифт для wordmark** — только Inter Semibold.
5. **Не используй другой цвет для wordmark** — только terracotta или inverse cream / mono-white / mono-black.
6. **Не используй кавычки в wordmark** — «Savdo», не "Savdo" или 'Savdo'.
7. **Не пиши SAVDO** капс-локом — это лозунг, не wordmark.
8. **Не пиши savdo** lowercase — большая S обязательна.
9. **Не помещай logo на низкоконтрастный фон** — нужно ≥ 3:1 для logo vs bg.
10. **Не используй monogram вверх ногами / зеркально** — даже для creative-задач. Это перестаёт быть logo.
11. **Не комбинируй с другими wordmark-сами** — никаких «Savdo × Uzum», «Savdo for Telegram», «Savdo Pro» написанных в одну строку с logo. Это партнёрские lockups — отдельный документ.
12. **Не накладывай иконки внутрь monogram** — S остаётся чистой S.

---

## 9. Starter SVG (для assets/)

См. `assets/logo-wordmark.svg` и `assets/logo-monogram-s.svg`. Это **starter-файлы**, которые Азим / контрактор-дизайнер должен будет довести до production-quality (или заменить полностью). В коде savdo-builder сейчас monogram нигде не embed'ится как SVG — мы используем `<ShoppingCart>` lucide-icon как placeholder.

### Wordmark SVG (текстовый, fontable)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="120" height="36" viewBox="0 0 120 36">
  <text x="0" y="26" font-family="Inter, system-ui, sans-serif"
        font-size="28" font-weight="600" letter-spacing="-0.28"
        fill="#7C3F2E">Savdo</text>
</svg>
```

**Note:** этот SVG требует системного Inter. Для production нужно либо embed font (тяжёлый SVG), либо convert text to paths (потеряем editability).

### Monogram SVG (geometric S placeholder)

```svg
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <!-- Background plate with brand-radius (optional, for app icon usage) -->
  <rect x="0" y="0" width="64" height="64" rx="14" fill="#7C3F2E"/>
  <!-- Stylized geometric S in cream (inverse) -->
  <path d="M44 18 H24 a6 6 0 0 0 0 12 h16 a6 6 0 0 1 0 12 H20"
        stroke="#FBF7F0" stroke-width="6" stroke-linecap="round"
        stroke-linejoin="round" fill="none"/>
</svg>
```

Это **очень черновой** monogram — geometric stroked-S на brand-плашке. Reads OK на favicon, но для production Азим должен:
- Перерисовать S как proper path (не stroked, а filled custom-shape)
- Добавить subtle character (slight curve, optical-correction в верхнем и нижнем дуге)
- Решить — на плашке или без

---

## 10. Файл-формат стандарт

| Use case | Format | Min resolution |
|----------|--------|----------------|
| Web (header, footer) | SVG (inline или `<img>`) | vector |
| Favicon | SVG + ICO (32x32, 16x16) | ICO 32x32 |
| App icon iOS | PNG 1024x1024 | 1024 |
| App icon Android | PNG 432x432 adaptive | 432 |
| TMA icon | PNG 256x256 | 256 |
| Email signature | PNG 80x80 @ 2x (160x160) | 160 |
| OG-card | PNG 1200x630 (logo embedded) | 1200x630 |
| Print high-res | PDF vector / 300dpi PNG | 600dpi для печати > A5 |
| Telegram channel icon | PNG 640x640 | 640 (Telegram apllies circle mask) |

---

## 11. Trademark / legal

- **«Savdo»** — узбекское словарное слово, означает «торговля». **Не защищается** как самостоятельный word-mark в UZ без приставки / визуала.
- **Monogram S + wordmark composition** — может быть зарегистрирована как combined-mark в Узпатенте (узпатенте.uz). Это **TODO**.
- **Trademark класс:** 35 (реклама, бизнес-управление, торговые услуги), 42 (программное обеспечение).
- **На каждом носителе** где появляется logo первый раз в документе/странице — допустимо добавлять `™` или `®` (после регистрации). На каждом повторе — не нужно.

---

## 12. Checklist для нового logo-applique

Перед публикацией нового носителя (баннер, social-post, email, лендинг):

- [ ] Использован lockup (monogram + wordmark) ИЛИ обоснованно — solo monogram / solo wordmark
- [ ] Цвет terracotta `#7C3F2E` light / `#A05A45` dark ИЛИ inverse cream на brand-bg
- [ ] Clear space соблюдён
- [ ] Logo на правильном фоне (контраст ≥ 3:1)
- [ ] Pixel-perfect: SVG в web, ≥2x raster для print
- [ ] Без эффектов (тени, обводки, градиенты, 3D)
- [ ] Не растянут, не зеркален, не повернут
- [ ] Wordmark Inter Semibold, capital S «Savdo»

---

## 13. История

| Дата | Изменение |
|------|-----------|
| 2026-05-20 | v1. 5 концептов. Рекомендация — 2.A Polished Monogram S + Inter Semibold wordmark. Starter SVG в `assets/`. |
