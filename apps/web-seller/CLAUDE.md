# apps/web-seller — Seller Dashboard Rules

**Owner:** Азим
**Agent:** `web-developer`, `ui-builder`

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind + DaisyUI + TanStack Query + React Hook Form

## Audience

Продавцы, управляющие магазином. Часто с телефона. До выхода mobile app — это основной инструмент.

## Rules

- Fully responsive + touch-friendly (приоритет мобильного вида)
- Auth: OTP flow через `/api/v1/auth/`
- Быстрые действия: добавить товар, обработать заказ, скопировать ссылку — в 1 клик
- Onboarding progress bar обязателен: `docs/V1.1/07_seller_onboarding_funnel.md`
- Типы: только из `packages/types`
- Если endpoint не готов → мок + записать в `docs/contracts/`

## Anti-patterns

- НЕ делать тяжёлую CRM-панель
- НЕ добавлять фичи из тира LATER без согласования

## Analytics

Fire events: `store_link_copied`, `store_published`, `product_created`, `order_status_changed`
