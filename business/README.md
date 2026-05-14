# Savdo — Business Folder

Брендбук, дизайн-токены, логотипы, маркетинговые шаблоны для проекта Savdo.

## Структура

```
business/
├── BRAND.md           Миссия, audience, tone of voice, don'ts
├── COLORS.md          Полная палитра (4 контекста) + WCAG контраст
├── TYPOGRAPHY.md      Шрифты + scale + line-height + don'ts
├── USAGE.md           Где какой бренд применять (touchpoints matrix)
├── LOGOS/             SVG-логотипы (5 вариантов)
│   ├── savdo-mark.svg          Primary (gradient)
│   ├── savdo-wordmark.svg      Mark + text
│   ├── savdo-buyer.svg         Buyer sub-brand (orchid)
│   ├── savdo-seller.svg        Seller sub-brand (cyan, storefront)
│   ├── savdo-admin.svg         Admin (shield)
│   ├── savdo-mark-mono.svg     Mono (currentColor)
│   └── README.md
└── SOCIAL/            Шаблоны для соцсетей и SEO
    ├── TELEGRAM.md
    ├── INSTAGRAM.md
    └── OG_META.md
```

## Quick Start

### Для marketing-команды
1. Прочитай [BRAND.md](BRAND.md) — миссия + tone of voice
2. Возьми лого из [LOGOS/](LOGOS/) под нужный контекст
3. Используй palette из [COLORS.md](COLORS.md) (НЕ хардкодь HEX в материалах)
4. Шаблоны постов — в [SOCIAL/](SOCIAL/)

### Для разработки
- Все цвета **уже синхронизированы** с `apps/*/src/...index.css`/`globals.css`
- Меняешь brand color → сначала меняй в `index.css` / `globals.css`, потом отражай тут
- Логотипы импортируй через `<img>` или Next.js `<Image>` из `/public/logos/`
  (нужно скопировать `business/LOGOS/*.svg` → `apps/*/public/logos/`)

### Для дизайнера
- Figma library не делаем — палитра в CSS-vars, лого в SVG
- Если нужен .ai / .sketch — open-источник SVG → можно импортировать

## Sub-brand принципы

Savdo использует **3 design-системы для разных аудиторий**:
- **TMA Buyer (Liquid Glass dark, orchid)** — нативный Telegram, retail
- **TMA Seller (Liquid Glass dark, cyan via data-role)** — деловой
- **Web Buyer (Soft Color Lifestyle, terracotta)** — warm landing/SEO
- **Web Seller + Admin (Liquid Authority, violet/indigo)** — рабочий tool

См. [BRAND.md §6](BRAND.md) — обоснование намеренного разделения.

## Не путать с

- `design/` — design audit reports + Figma exports (нет в этом проекте)
- `docs/design/liquid-authority.md` — спецификация Liquid Authority design system
- `apps/admin/src/index.css` — actual source of truth для admin tokens
- `apps/tma/src/index.css` — actual source of truth для TMA tokens
- `packages/design-tokens/` — **не используем** (намеренно: брендов разных аудиторий
  by design не должно быть в одном пакете)

## Контакт

- **Brand questions:** Полат
- **Implementation:** Полат (TMA / Admin / API) + Азим (web-buyer / web-seller)
- **Marketing material:** TBD (after launch)
