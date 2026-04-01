# apps/web-buyer — Buyer Storefront Rules

**Owner:** Азим
**Agent:** `web-developer`, `ui-builder`

---

## 🚨 ПРОЧИТАТЬ ПЕРВЫМ — Активные проблемы (01.04.2026)

> Перед любой задачей убедись что эти проблемы исправлены.

### ❌ [WEB-001] Дублирование `PaginationMeta` — вызывает TS2308

`PaginationMeta` объявлен в двух местах одновременно:
- `packages/types/src/api/orders.ts` — **источник истины, не трогать**
- `packages/types/src/common.ts` — **дубль, удалить**

**Как исправить:**
1. Открыть `packages/types/src/common.ts`
2. Удалить `export interface PaginationMeta { ... }` из этого файла
3. Убедиться что все импорты `PaginationMeta` ведут на `packages/types/src/api/orders.ts`
4. Проверить `tsc --noEmit` — ошибок быть не должно

### ❌ [WEB-002] `NEXT_PUBLIC_API_URL` не добавлен в Railway

Без этой переменной все API запросы в продакшне идут на `localhost`.

**Как исправить:**
- Railway Dashboard → сервис `savdo-builder-by` → Variables → добавить:
  ```
  NEXT_PUBLIC_API_URL=https://savdo-api-production.up.railway.app
  ```
- После добавления — передеплоить сервис

### ✅ [НЕ ПРОБЛЕМА] `GET /storefront/stores/:slug`

Этот endpoint **уже реализован** в backend (`apps/api/src/modules/products/products.controller.ts`).
Просить Полата добавить его — не нужно.

---

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
