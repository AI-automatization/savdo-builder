# Итоги спринта — 01.04.2026

**Автор:** Полат
**Статус:** Production деплой активен

---

## ✅ Что сделано сегодня

### 🔧 Backend (apps/api) — Railway деплой
- Исправлен критический баг: `app.listen(port)` → `app.listen(port, '0.0.0.0')` — без этого Railway healthcheck не мог достучаться
- Добавлен `start.sh` — сначала `prisma migrate deploy`, потом запуск NestJS
- `healthcheckTimeout` увеличен до 300 секунд
- **Результат:** API задеплоен и работает → `https://savdo-api-production.up.railway.app`

### 🖥️ Admin Panel (apps/admin) — с нуля
- Переписан с Next.js на **Vite + React SPA** (правильный выбор для SPA без SSR)
- Дизайн: **Liquid Authority** — тёмная тема, navy + indigo
- Все страницы подключены к **реальному API** (не mock):
  - `/sellers` → `GET /api/v1/admin/sellers`
  - `/stores` → `GET /api/v1/admin/stores`
  - `/moderation` → `GET /api/v1/admin/moderation/queue` + `POST .../action`
  - `/audit-logs` → `GET /api/v1/admin/audit-log`
  - `/dashboard` → реальные счётчики (sellers, stores, moderation queue)
- Логин: OTP через Telegram, **4-значный код**, таймер 5 минут
- **Задеплоен на Railway** → `https://savdo-builderadmin-production.up.railway.app`

### 🗄️ База данных
- Запущен seed: создан admin user (`+998910081910`, роль ADMIN, запись в `admin_users`)
- Категории товаров засеяны (10 штук)

### 🔑 CORS
- `ALLOWED_ORIGINS` обновлён — добавлены все 4 домена:
  - `savdo-builder-production.up.railway.app` (web-buyer)
  - `savdo-builderadmin-production.up.railway.app` (admin)
  - `savdo-builder-by-production.up.railway.app` (web-buyer new)
  - `savdo-builder-sl-production.up.railway.app` (web-seller)

### 📦 packages/types
- Удалён дубль `PaginationMeta` из `orders.ts` — был конфликт TS2308
- Единственный источник: `packages/types/src/common.ts`

### 🔀 Git
- Смержена ветка `feature/api-layer` → `main` (работа Azim: реальный API для web-buyer, web-seller)
- Добавлены таски для Azim в `analiz/tasks-azim.md`
- Добавлены примечания в `apps/web-buyer/CLAUDE.md` и `apps/web-seller/CLAUDE.md`

---

## 🟢 Что уже работает в продакшне

| Что | URL | Статус |
|-----|-----|--------|
| Backend API | `https://savdo-api-production.up.railway.app/api/v1/health` | ✅ Active |
| Admin Panel | `https://savdo-builderadmin-production.up.railway.app` | ✅ Active |
| Web Buyer | `https://savdo-builder-by-production.up.railway.app` | ✅ Active |
| Web Seller | `https://savdo-builder-sl-production.up.railway.app` | ✅ Active |

### Как работает логин (OTP)
```
1. Пользователь вводит номер +998XXXXXXXXX
2. Система ищет chat_id в Redis по номеру
3. Если Telegram привязан → отправляет 4-значный код через @savdo_builderBOT
4. Если не привязан → ошибка TELEGRAM_NOT_LINKED (нужно написать боту /start и поделиться номером)
5. Код действителен 5 минут, одноразовый
6. После verify → возвращается JWT accessToken (15 мин) + refreshToken (30 дней)
```

### Как работает покупка (Checkout)
```
1. Покупатель открывает магазин по slug: /{slug}
2. Добавляет товары в корзину (одного магазина — INV-C01)
3. Оформляет заказ → вводит телефон → получает OTP (purpose: checkout)
4. После verify → создаётся заказ, списывается stock
5. Продавец получает уведомление в Telegram
6. Покупатель видит статус заказа по номеру телефона
```

### Как работает регистрация продавца
```
1. Продавец открывает web-seller → /login
2. Вводит телефон → OTP через @savdo_builderBOT (нужно сначала привязать бота)
3. При первом логине → автоматически создаётся User(role=SELLER) + Seller запись
4. Заполняет профиль → создаёт магазин (один seller = один store, INV-S01)
5. Магазин уходит на модерацию (если STORE_APPROVAL_REQUIRED=true, сейчас false)
6. Добавляет товары → получает slug → делится ссылкой в Telegram
```

---

## 📋 Что нужно сделать команде

### Azim (apps/web-buyer, apps/web-seller)
> Подробные таски: `analiz/tasks-azim.md`

- [ ] `git pull origin main` — подтянуть смёрженную ветку
- [ ] Проверить что `NEXT_PUBLIC_API_URL` работает в продакшне (уже добавлен в Railway)
- [ ] Протестировать реальный логин продавца на `savdo-builder-sl-production.up.railway.app`
- [ ] Протестировать витрину покупателя на `savdo-builder-by-production.up.railway.app`
- [ ] Выбрать цветовую палитру из 4 вариантов в `packages/ui/tokens/colors.ts` и согласовать с командой

### Яхьо (apps/admin)
- [ ] Протестировать admin панель: `https://savdo-builderadmin-production.up.railway.app`
- [ ] Логин: телефон `+998910081910` → код из Telegram
- [ ] Проверить страницы: sellers, stores, moderation, audit-logs
- [ ] При нахождении багов → писать в `analiz/logs.md`

### Полат (apps/api, packages/db)
- [ ] Настроить Watch Paths в Railway для всех сервисов (чтобы не деплоились зря):
  - `savdo-api` → `apps/api/**,packages/**`
  - `savdo-builder-by` → `apps/web-buyer/**`
  - `savdo-builder-sl` → `apps/web-seller/**`
- [ ] Настроить Telegram Webhook для `@savdo_builderBOT` в продакшне
- [ ] Протестировать полный флоу: привязка бота → OTP → логин

---

## ⚠️ Известные ограничения (не баги, решение принято)

| Что | Почему |
|-----|--------|
| Заказы на дашборде — пустые | Нет admin-level orders endpoint, будет в следующем спринте |
| Storage (R2) не настроен | `STORAGE_ENDPOINT` пустой — загрузка фото товаров не работает |
| Telegram Webhook не настроен | OTP работает только если бот запущен локально или через polling |
| `STORE_APPROVAL_REQUIRED=false` | Магазины создаются без модерации — для MVP нормально |

---

## 🔗 Полезные ссылки

| Что | Ссылка |
|-----|--------|
| Инварианты системы | `docs/V1.1/01_domain_invariants.md` |
| Статусы и переходы | `docs/V1.1/02_state_machines.md` |
| Логин и OTP | `docs/V0.1/11_auth_identity.md` |
| Чекаут и заказы | `docs/V0.1/09_orders_checkout.md` |
| Онбординг продавца | `docs/V1.1/07_seller_onboarding_funnel.md` |
| Покупатель без регистрации | `docs/V1.1/03_buyer_identity.md` |
| API контракты web-buyer | `docs/contracts/web-buyer.md` |
| API контракты web-seller | `docs/contracts/web-seller.md` |
| Коды ошибок | `docs/V1.1/05_error_taxonomy.md` |
| Feature flags | `docs/V1.1/06_feature_flags.md` |
