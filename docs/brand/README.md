# Savdo — Brand Book

**Версия:** 1.0
**Дата:** 2026-05-20
**Статус:** v1 — материнская палитра зафиксирована (terracotta + cream)
**Источник палитры:** `apps/web-buyer/src/app/globals.css` (Soft Color Lifestyle)
**Связанные аудиты:** `analiz/audits/web-buyer-vs-seller-design-2026-05-20.md`

---

## Что такое Savdo

Savdo (узб. «торговля») — Telegram-native платформа для построения интернет-магазинов в Узбекистане. Продавец за 60 секунд создаёт витрину `savdo.uz/<slug>`, делится ссылкой в Telegram, принимает заказы. Покупатель открывает витрину прямо из Telegram или браузера, добавляет в корзину, пишет в TG-чат — никаких регистраций.

Brand-сердцевина — **тёплая bazaar-эстетика на тёплой кремовой подложке**. Это сознательное отличие от cold-slate UI большинства SaaS и от ярко-зелёного Uzum / оранжевого OLX.

---

## Как пользоваться этим brand book

### Кто читает что

| Роль | Обязательно к прочтению |
|------|------------------------|
| Дизайнер (Азим, новые контракторы) | весь brand book |
| Web-разработчик (Азим) | `palette.md` + `typography.md` + `components-guide.md` |
| Backend / API (Полат) | `brand-book.md` (positioning) + `voice-and-tone.md` для сообщений API/email |
| Marketing / SMM | `brand-book.md` + `voice-and-tone.md` + `application-examples.md` |
| QA / Support | `voice-and-tone.md` (как мы пишем error-сообщения) |

### Структура

```
docs/brand/
├── README.md                  ← вы здесь
├── brand-book.md              ← master: миссия, аудитория, позиционирование
├── palette.md                 ← цветовая система (light + dark, токены, контраст)
├── typography.md              ← шрифты, scale, двуязычие ru/uz
├── logo-spec.md               ← логотип, варианты, do/don't
├── voice-and-tone.md          ← как пишем (ru + uz примеры)
├── components-guide.md        ← компоненты, spacing, radius, shadows
├── application-examples.md    ← app icon, OG-card, push, email, визитка
└── assets/
    ├── README.md              ← что должно лежать в assets/
    ├── logo-wordmark.svg      ← starter SVG (текстовый)
    └── logo-monogram-s.svg    ← starter SVG (геометрический)
```

### Принципы изменений

1. **Палитра — single source of truth в `palette.md`.** Любое изменение → обновить файл и `apps/web-buyer/src/app/globals.css` + `apps/web-seller/src/app/globals.css` синхронно.
2. **Логотип — фиксированный wordmark.** Per-store branding (когда продавец загружает свой логотип) меняет CTA-цвет витрины, но wordmark `Savdo` в footer/credit остаётся в фирменном.
3. **Brand-цвет terracotta `#7C3F2E` (light) / `#A05A45` (dark) — не обсуждается без отдельного RFC.**
4. **Семантические цвета (success/warning/danger) — warm-tinted, не shadcn-generic.** Список в `palette.md`.
5. **Apostrof `ʻ` (U+02BB) — обязательный для узбекской латиницы.** Никогда `'` (U+0027) или `'` (U+2019).

---

## Quick reference

| Что | Значение |
|-----|----------|
| Primary brand | `#7C3F2E` (light) / `#A05A45` (dark) |
| Surface base | `#FBF7F0` (light) / `#16120D` (dark) |
| Text primary | `#1F1A12` (light) / `#F5EFE3` (dark) |
| Font | Inter (latin + cyrillic, `cv11 ss01`) |
| Border radius scale | 4 / 6 / 8 / 12 / 16 / 24 / 9999 |
| Spacing scale | 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 |
| Wordmark | «Savdo» — всегда capital S, всегда в `colors.brand` |
| Apostrof | `ʻ` U+02BB (Oʻzbekiston, foʻq) |

---

## История

- **2026-05-20** — v1. Зафиксирована материнская палитра buyer'а после аудита `web-buyer-vs-seller-design-2026-05-20.md`. Brand book создан с нуля.
