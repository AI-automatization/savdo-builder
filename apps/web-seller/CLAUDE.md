# apps/web-seller — Seller Dashboard Rules

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
- Railway Dashboard → сервис `web-seller` → Variables → добавить:
  ```
  NEXT_PUBLIC_API_URL=https://savdo-api-production.up.railway.app
  ```
- После добавления — передеплоить сервис

### ✅ [НЕ ПРОБЛЕМА] `GET /storefront/stores/:slug`

Этот endpoint **уже реализован** в backend (`apps/api/src/modules/products/products.controller.ts`).
Просить Полата добавить его — не нужно.

---

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
