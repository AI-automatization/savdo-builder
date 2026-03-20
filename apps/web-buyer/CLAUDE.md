# apps/web-buyer — Buyer Storefront Rules

**Owner:** Азим
**Agent:** `web-developer`, `ui-builder`

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind + DaisyUI + TanStack Query

## Audience

Покупатели, приходящие по Telegram-ссылке. Mobile-first. Часто на медленном соединении.

## Rules

- Server Components по умолчанию, Client Components только где нужен интерактив
- `next/image` для всех изображений (обязательно)
- Кнопка "Написать в Telegram" — всегда видна
- Нет аутентификации при просмотре. OTP только для истории заказов
- Buyer identity flow: `docs/V1.1/03_buyer_identity.md`
- API URL: `process.env.NEXT_PUBLIC_API_URL`
- Типы запросов/ответов: только из `packages/types`
- Если endpoint не готов → мок + записать в `docs/contracts/`

## Performance

- LCP < 2.5s на 3G
- Lazy loading для изображений ниже fold
- Minimal JS bundle на storefront routes

## Analytics

Обязательно fire events на: `storefront_viewed`, `product_viewed`, `add_to_cart`, `checkout_started`, `order_created`
Список: `docs/V1.1/07_seller_onboarding_funnel.md`
