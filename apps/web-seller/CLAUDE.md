# apps/web-seller — Seller Dashboard Rules

**Owner:** Азим
**Agent:** `web-developer`, `ui-builder`

---

## 🚨 АУДИТ ПОЛАТА — КРИТИЧЕСКИЕ ПРОБЛЕМЫ (10.04.2026)

> Полат провёл аудит всей платформы. Найдены проблемы в web-seller и web-buyer.
> Исправь ДО любой новой фичи. Затрагивают регистрацию всех пользователей.

---

### 🔴 [WEB-010] OtpGate в web-buyer создаёт SELLER вместо BUYER

**Файл:** `apps/web-buyer/src/components/auth/OtpGate.tsx` строки 27 и 37

```ts
// ❌ СЕЙЧАС — purpose: 'login' → backend создаёт SELLER для нового юзера!
await requestOtp.mutateAsync({ phone, purpose: 'login' });
await verifyOtp.mutateAsync({ phone, code, purpose: 'login' });

// ✅ НУЖНО — изменить на:
await requestOtp.mutateAsync({ phone, purpose: 'checkout' });
await verifyOtp.mutateAsync({ phone, code, purpose: 'checkout' });
```

Backend (`verify-otp.use-case.ts`): если `purpose !== 'checkout'` → создаёт SELLER.
Покупатели через OtpGate сейчас регистрируются как продавцы — это критический баг.

---

### 🔴 [WEB-011] web-seller login не проверяет роль после входа

**Файл:** `apps/web-seller/src/app/(auth)/login/page.tsx` строки 55-62

```ts
// ❌ СЕЙЧАС — редиректит на /dashboard без проверки роли
onSuccess: () => router.replace("/dashboard")

// ✅ НУЖНО:
onSuccess: (data) => {
  login(data.accessToken, data.refreshToken, data.user);
  if (data.user.role === 'SELLER') {
    router.replace('/dashboard');
  } else {
    // Пользователь — BUYER, предложи открыть магазин
    router.replace('/onboarding');
  }
}
```

Если существующий BUYER войдёт через web-seller, он попадёт в дашборд продавца.
Все запросы `/seller/*` вернут 403. Зависший экран, нет объяснения.

---

### 🟡 [WEB-012] onboarding недоступен для BUYER

Middleware `apps/web-seller` должен пускать BUYER на `/onboarding`.
Сейчас туда попадает только SELLER — это неправильно, ведь онбординг и есть путь BUYER → SELLER.

**Логика которую нужно реализовать:**
1. BUYER логинится в web-seller
2. Попадает на `/onboarding` (middleware разрешает BUYER туда)
3. Заполняет форму магазина
4. Полат добавит `POST /api/v1/seller/apply` — вызови его после формы
5. Backend меняет role → SELLER, возвращает новый токен
6. Сохрани новый токен через `login()`, редирект на `/dashboard`

---

### 🟡 [WEB-013] NEXT_PUBLIC_BUYER_URL не в .env.example

`apps/web-seller/src/app/(dashboard)/dashboard/page.tsx:81` использует:
```ts
process.env.NEXT_PUBLIC_BUYER_URL ?? 'https://savdo.uz'
```
Добавь в `.env.example`: `NEXT_PUBLIC_BUYER_URL=http://localhost:3001`

---

### 🟢 [WEB-014] StorefrontStore — ждёт тип от Полата

`apps/web-buyer/src/lib/api/storefront.api.ts` — есть комментарий:
```ts
// Local type — pending Полатр adding it to packages/types
```
Полат добавит `StorefrontStore` в `packages/types`. После — удали локальный тип и импортируй из `types`.

---

## Правильная логика регистрации (согласовано с Полатом)

```
Новый пользователь
  │
  ├─ web-buyer / TMA → всегда BUYER
  │
  └─ web-seller login → BUYER (если новый)
            │
            └─ /onboarding → заполняет форму → POST /seller/apply
                      │
                      └─ backend: role = SELLER, новый токен → /dashboard ✅
```

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
