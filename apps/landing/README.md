# @savdo-builder/landing

Публичный лендинг MaxSavdo (`maxsavdo.uz`) — Next.js 15 + Tailwind v3.4.
Двуязычный (UZ по умолчанию, RU на `/ru`), SSR/SSG, output: standalone для Docker/Railway.

## Стек

- Next.js 15 (App Router, React 19)
- TailwindCSS 3.4 + brand-палитра (accent `#E8A552`)
- TypeScript strict
- lucide-react (иконки), clsx

## Запуск

```bash
# 1. Установка
npm install

# 2. Скопировать env
cp .env.example .env.local
# отредактировать NEXT_PUBLIC_API_URL, NEXT_PUBLIC_BOT_USERNAME, NEXT_PUBLIC_SITE_URL

# 3. Dev на :3010 (чтобы не конфликтовать с admin/api)
npm run dev

# 4. Production build
npm run build
npm start
```

## Переменные окружения

| Переменная | Назначение |
|------------|-----------|
| `NEXT_PUBLIC_API_URL` | Бэкенд (Railway), для FeaturedStores |
| `NEXT_PUBLIC_BOT_USERNAME` | Telegram-бот без `@`, для CTA-кнопок |
| `NEXT_PUBLIC_SITE_URL` | Канонический URL (sitemap, OG, robots) |

## Структура

```
src/
  app/            # App Router (UZ по умолчанию)
    page.tsx      # /
    ru/page.tsx   # /ru
    sitemap.ts    # SEO
    robots.ts
  components/     # Header, Hero, How, Features, FeaturedStores, Pricing, FAQ, Footer
  content/        # uz.ts, ru.ts — весь текст
  lib/            # i18n, api, seo, cn
  types/          # store.ts
```

## Деплой (Railway)

Сервис `landing` с Root Directory = `apps/landing`. Dockerfile в корне сервиса.
Watch patterns: `apps/landing/**`.

После мержа в `main` ветку — Railway редеплоит автоматически.

## Команды

- `npm run dev` — dev-сервер на 3010
- `npm run build` — production-сборка (standalone)
- `npm start` — запуск собранного приложения
- `npm run lint` — ESLint
- `npm run typecheck` — проверка типов без эмита
