# Telegram Mini App (TMA) — Design Spec

**Date:** 2026-04-09
**Author:** Azim
**Status:** Draft → Ready for implementation

---

## Summary

Отдельное Vite + React SPA приложение (`apps/tma`) для работы внутри Telegram Mini App. Заменяет текущие `/twa` роуты в web-buyer. Поддерживает две роли: buyer (каталог, корзина, заказы) и seller (управление заказами, статистика, настройки магазина).

## Architecture

```
apps/tma/                    ← Vite + React + TypeScript + Tailwind
  src/
    main.tsx                 ← entrypoint, TelegramProvider
    App.tsx                  ← react-router-dom, lazy routes
    lib/
      api.ts                 ← fetch-обёртка (VITE_API_URL + JWT)
      telegram.ts            ← Telegram WebApp SDK типы и хелперы
      auth.ts                ← initData → POST /auth/telegram → JWT
    pages/
      HomePage.tsx           ← определяет роль → buyer или seller
      buyer/
        StoresPage.tsx       ← каталог магазинов
        StorePage.tsx        ← товары одного магазина
        CartPage.tsx         ← корзина (localStorage)
        CheckoutPage.tsx     ← оформление заказа
        OrdersPage.tsx       ← мои заказы
      seller/
        DashboardPage.tsx    ← обзор: новые заказы + быстрая статистика
        OrdersPage.tsx       ← список заказов + PATCH статус
        StorePage.tsx        ← настройки магазина
    components/
      ui/                    ← Button, Card, Badge, Input
      layout/
        AppShell.tsx         ← обёртка с BottomNav
        BottomNav.tsx        ← buyer/seller варианты
        BackButton.tsx       ← Telegram BackButton интеграция
```

### Tech stack

- **Vite** — сборка, dev server
- **React 18** — UI
- **TypeScript** — типизация
- **Tailwind CSS** — стили
- **react-router-dom v6** — роутинг с lazy loading
- **Telegram WebApp SDK** — `@vkruglikov/react-telegram-web-app` или прямой SDK

### Deploy

Статический билд (`vite build` → `dist/`). Деплой на Railway static site или Cloudflare Pages. Env: `VITE_API_URL`.

## Authentication

1. TMA читает `window.Telegram.WebApp.initData`
2. Отправляет `POST /api/v1/auth/telegram` с `{ initData }` на backend
3. Backend:
   - Валидирует HMAC-SHA256 подпись через `TELEGRAM_BOT_TOKEN`
   - Извлекает `user.id` (Telegram ID)
   - Ищет user по `telegramChatId` или создаёт нового
   - Возвращает `{ token, user: { id, role, ... } }`
4. TMA хранит JWT в памяти (не localStorage — безопаснее)
5. Все API запросы: `Authorization: Bearer <token>`

**Зависимость:** Endpoint `POST /api/v1/auth/telegram` — домен Полата. Нужно попросить его реализовать или создать задачу в tasks.md.

### Fallback (до готовности endpoint)

Временно: TMA делает `POST /api/v1/auth/telegram-dev` который принимает `telegramId` и возвращает JWT без валидации подписи. Только в dev режиме (`DEV_TG_AUTH=true`).

## Navigation

### Buyer flow
- **BottomNav:** Магазины | Корзина | Заказы
- Магазины → StorePage (товары) → Корзина → Checkout → Order success
- Заказы → OrderDetail (статус)

### Seller flow
- **BottomNav:** Заказы | Магазин | Статистика
- Заказы → OrderDetail (PATCH статус: confirm/ship/deliver/cancel)
- Магазин → настройки (имя, описание, delivery)
- Статистика → кол-во товаров, заказов, выручка

### Role determination
- JWT содержит `role: BUYER | SELLER`
- HomePage проверяет роль → перенаправляет на `/buyer` или `/seller`
- Если роли нет (новый user) → экран выбора роли

### Telegram SDK integration
- `BackButton` — показывается при глубине навигации > 1
- `MainButton` — "Оформить заказ" на CartPage, "Подтвердить" на CheckoutPage
- `HapticFeedback` — при нажатии кнопок
- `themeParams` — адаптация под светлую/тёмную тему Telegram
- `expand()` — раскрыть на полный экран при старте

## Design

Glassmorphism стиль, как в текущих `/twa` роутах:
- Тёмный фон: `linear-gradient(135deg, #0f0a1e, #1a0f2e, #0a1628)`
- Accent: `#A78BFA` (violet)
- Карточки: `rgba(255,255,255,0.07)` + `backdrop-filter: blur(16px)` + `border: 1px solid rgba(255,255,255,0.10)`
- Адаптация к `Telegram.WebApp.themeParams` для light mode

## API endpoints

### Существующие (используем as-is)
| Method | Path | Описание |
|--------|------|----------|
| GET | `/api/v1/storefront/stores` | Каталог магазинов |
| GET | `/api/v1/storefront/stores/:slug` | Магазин + товары |
| POST | `/api/v1/checkout` | Оформление заказа |
| GET | `/api/v1/buyer/orders` | Заказы покупателя |
| GET | `/api/v1/seller/orders` | Заказы продавца |
| PATCH | `/api/v1/seller/orders/:id/status` | Смена статуса заказа |
| GET | `/api/v1/auth/me` | Текущий пользователь |
| PATCH | `/api/v1/seller/store` | Обновление магазина |

### Новый (задача для Полата)
| Method | Path | Описание |
|--------|------|----------|
| POST | `/api/v1/auth/telegram` | Авторизация через Telegram initData |

**Request:** `{ initData: string }`
**Response:** `{ token: string, user: { id, role, phone?, seller?, buyer? } }`

## Bot changes

В `telegram-demo.handler.ts` заменить:
```
BUYER_APP_URL/twa → TMA_URL (новая env переменная)
```

Это домен Полата (apps/api), но изменение минимальное — 2 строки.

## Out of scope

- OTP/SMS — авторизация через Telegram initData
- SEO — Mini App не индексируется
- Server Components — Vite SPA
- Chat — Phase 2 TMA
- Payments — заморожены (PAY-*)
- Удаление `/twa` роутов из web-buyer — после стабилизации TMA

## Migration plan

1. Создать `apps/tma` с полным функционалом
2. Задеплоить на отдельный URL
3. Попросить Полата: добавить `POST /auth/telegram` + поменять `BUYER_APP_URL/twa` → `TMA_URL` в боте
4. Протестировать в Telegram
5. После стабилизации — удалить `/twa` роуты из web-buyer
