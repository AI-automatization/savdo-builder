# Savdo Builder — Карта проекта, бизнес-план и аналитика

> Дата: 08.04.2026 | Автор: Полат | Версия: 1.0

---

## 🏢 Бизнес-идея

**Savdo Builder** — платформа для Telegram-продавцов Узбекистана.

Продавец создаёт интернет-магазин за 5 минут, управляет товарами и заказами через
веб-интерфейс, а покупатель делает заказ через Telegram Mini App (TWA) — без скачивания
отдельного приложения.

### Боль которую решаем

| Проблема | Наше решение |
|----------|-------------|
| Сложно создать интернет-магазин (нужен программист, дорогой хостинг) | Конструктор за 5 минут, хостинг включён |
| Покупатели в Узбекистане сидят в Telegram | Магазин открывается прямо в Telegram |
| Нет инструментов для мелкого бизнеса на узбекском рынке | Локализация UZ/RU, работа с сумами |
| Дорогие SMS-уведомления (Eskiz) | Telegram Bot — бесплатно |

---

## 👥 Аудитория

### Продавцы (B2B клиент)
- Мелкие предприниматели: одежда, электроника, еда, handmade
- Возраст: 18–45 лет, Ташкент и регионы
- Устройство: телефон (Android 80%)
- Сейчас продают через: Instagram Direct, Telegram каналы, рынки

### Покупатели (конечный пользователь)
- Все кто покупает у продавцов через Telegram
- Хотят: быстро найти товар, оформить заказ, получить уведомление

---

## 💰 Бизнес-модель

```
FREE TIER
  - 1 магазин
  - до 20 товаров
  - базовая аналитика
  ↓
STARTER (тариф, ~$10/мес)
  - 1 магазин
  - до 200 товаров
  - интеграция Telegram Bot
  - аналитика + экспорт
  ↓
PRO (тариф, ~$25/мес)
  - несколько магазинов
  - безлимит товаров
  - приоритетная поддержка
  - API доступ
```

> ⚠️ Монетизация (Payme/Click интеграция) — заморожена до PAY-001..005.
> Сейчас продаём вручную через прямой контакт.

---

## 🗺️ Карта системы

```
┌─────────────────────────────────────────────────────────────────┐
│                        ПОЛЬЗОВАТЕЛИ                             │
│                                                                 │
│  Продавец              Покупатель              Команда Savdo    │
│  (web-seller)          (web-buyer + TWA)       (admin)          │
└──────┬─────────────────────┬───────────────────────┬───────────┘
       │                     │                       │
       ▼                     ▼                       ▼
┌──────────────────────────────────────────────────────────────┐
│                    TELEGRAM BOT                              │
│                  @savdo_builderBOT                           │
│     OTP аутентификация + уведомления продавцу               │
└───────────────────────────┬──────────────────────────────────┘
                            │
                            ▼
┌──────────────────────────────────────────────────────────────┐
│                   API BACKEND (NestJS)                       │
│              https://savdo-api-production.up.railway.app     │
│                                                              │
│  Auth → Orders → Products → Chat → Notifications            │
│  Analytics → Admin → Moderation → Telegram                  │
└──────────┬───────────────────────────────┬───────────────────┘
           │                               │
           ▼                               ▼
┌─────────────────┐              ┌──────────────────┐
│  PostgreSQL     │              │   Redis           │
│  (Prisma ORM)   │              │   (BullMQ +       │
│  Railway plugin │              │    Socket.IO +    │
└─────────────────┘              │    Rate limit)    │
                                 └──────────────────┘
```

### Продакшн URL

| Сервис | URL | Технология |
|--------|-----|-----------|
| Backend API | `https://savdo-api-production.up.railway.app` | NestJS + Docker |
| Admin Panel | `https://savdo-builderadmin-production.up.railway.app` | Vite React SPA |
| Web Buyer (TWA) | `https://savdo-builder-by-production.up.railway.app` | Next.js 16 |
| Web Seller | `https://savdo-builder-sl-production.up.railway.app` | Next.js 16 |

---

## 📁 Структура монорепо

```
savdo-builder/
├── apps/
│   ├── api/              # NestJS backend (Полат)
│   ├── admin/            # Vite React SPA (Полат)
│   ├── web-buyer/        # Next.js — витрина + TWA (Азим)
│   └── web-seller/       # Next.js — кабинет продавца (Азим)
│
├── packages/
│   ├── db/               # Prisma schema + migrations (Полат)
│   ├── types/            # TypeScript типы (Полат пишет, все читают)
│   └── ui/               # shadcn компоненты (все)
│
├── docs/
│   ├── V0.1/             # Архитектурный фундамент
│   ├── V1.1/             # Инварианты, state machines
│   ├── adr/              # Архитектурные решения
│   ├── contracts/        # API контракты
│   ├── design/           # Дизайн-система Liquid Authority
│   ├── tasks/            # Задачи по доменам
│   └── done/             # Выполненные задачи
│
└── analiz/               # Логи, спринты, аналитика
```

---

## 👨‍💻 Команда

| Разработчик | Домен | Зона ответственности |
|-------------|-------|---------------------|
| **Полат** | Backend + Admin | `apps/api`, `apps/admin`, `packages/db`, `packages/types` |
| **Азим** | Frontend | `apps/web-buyer`, `apps/web-seller` |
| ~~Яхьо~~ | ~~Admin~~ | Покинул проект 01.04.2026 |

**Правило:** Азим не трогает DB/API. Полат не трогает web-buyer/web-seller.

---

## 🧱 Технологический стек

| Слой | Технология | Почему |
|------|-----------|--------|
| Backend | NestJS + TypeScript | Модульность, DI, guards |
| ORM | Prisma | TypeSafe, миграции |
| Cache + Queue | Redis + BullMQ | Async задачи, Telegram уведомления |
| Realtime | Socket.IO | Чат, обновление заказов |
| Frontend | Next.js 16 + Tailwind | App Router, SSR, SEO |
| Admin SPA | Vite + React | Нет SSR нужды для CRM |
| Charts | Recharts | React-native, легковесный |
| Deploy | Railway | Простой PaaS, автодеплой из GitHub |
| Storage | Cloudflare R2 | S3-совместимый, дешевле AWS |
| OTP / Notif | Telegram Bot API | Бесплатно, безопаснее SMS |
| Auth | JWT + Refresh Token | 15мин access, 30 дней refresh |

---

## 📊 Аналитика — что собираем

### События (analytics_events таблица)

| Событие | Кто | Когда |
|---------|-----|-------|
| `storefront_viewed` | Покупатель | Открыл витрину магазина |
| `product_viewed` | Покупатель | Открыл карточку товара |
| `add_to_cart` | Покупатель | Добавил в корзину |
| `checkout_started` | Покупатель | Начал оформление |
| `order_created` | Покупатель | Создал заказ |
| `order_status_changed` | Продавец | Сменил статус заказа |
| `store_link_copied` | Продавец | Скопировал ссылку на магазин |
| `store_published` | Продавец | Опубликовал магазин |
| `product_created` | Продавец | Создал товар |

### Ключевые метрики (Dashboard)

| Метрика | Источник | Обновление |
|---------|---------|-----------|
| Всего продавцов | `sellers` count | При загрузке |
| Всего магазинов | `stores` count | При загрузке |
| На модерации | `moderation_cases` open | При загрузке |
| Всего заказов | `orders` count | При загрузке |
| Заказы за 30 дней | analytics summary | График |
| Топ-5 магазинов | analytics summary | Bar chart |

### Воронка конверсии

```
storefront_viewed  →  product_viewed  →  add_to_cart  →  checkout_started  →  order_created
     100%                60-70%             20-30%             10-15%              5-10%
```
> Реальные цифры появятся после накопления данных в проде.

---

## 🗓️ Plan работ

### ✅ Завершено (Phase 1–3, апрель 2026)

**Backend (Полат)**
- [x] Весь NestJS backend: Auth, Orders, Products, Cart, Chat, Notifications
- [x] Telegram Bot OTP + уведомления продавцу
- [x] Socket.IO realtime (заказы + чат)
- [x] BullMQ очереди для async задач
- [x] Admin endpoints: продавцы, магазины, пользователи, модерация, аналитика, заказы
- [x] Railway деплой + Dockerfile + seed данные
- [x] Analytics events endpoint

**Admin Panel (Полат)**
- [x] Vite React SPA + Liquid Authority дизайн-система
- [x] Авторизация через Telegram OTP
- [x] Dashboard с графиками (Recharts)
- [x] Sellers + SellersDetail (верификация, suspend)
- [x] Stores + StoreDetail (approve, suspend, reject)
- [x] Users + UserDetail (suspend/unsuspend)
- [x] Orders с фильтрами и отменой
- [x] Moderation queue (SLA-таймер, assign, APPROVE/REJECT)
- [x] ModerationDetail с историей действий
- [x] Analytics Events лента
- [x] Audit Log
- [x] Database Manager (просмотр таблиц)
- [x] Broadcast (Telegram рассылка)
- [x] Редизайн: navy/indigo тема, shared компоненты

**Frontend Азим (частично)**
- [x] web-buyer: витрина, корзина, заказы, TWA страницы
- [x] web-seller: dashboard, продукты, заказы, аналитика

---

### 🔴 Критические (блокируют Азима)

| ID | Задача | Кто | Статус |
|----|--------|-----|--------|
| WEB-001 | Убрать дублирование `PaginationMeta` | Азим | Не сделано |
| WEB-002 | Добавить `NEXT_PUBLIC_API_URL` в Railway | Азим | Не сделано |
| WEB-030 | web-buyer 503 — исправлен Dockerfile | Полат | ✅ Готово |

---

### 🟡 Текущий спринт (апрель 2026)

| ID | Задача | Кто | Приоритет |
|----|--------|-----|----------|
| WEB-003 | Смержить `feature/api-layer` → main | Азим | Высокий |
| WEB-004 | Проверить storefront/stores/:slug endpoint | Азим | Высокий |
| WEB-005 | Проверить ISR на vitrine | Азим | Средний |
| WEB-006 | web-seller loading skeletons | Азим | Низкий |
| WEB-026 | Заменить polling на Socket.IO (заказы) | Азим | Средний |

---

### 🧊 Заморожено (Phase 4 — Монетизация)

| ID | Задача | Зависимость |
|----|--------|------------|
| PAY-001 | DB schema: подписки + транзакции | Открыть счёт в Payme/Click |
| PAY-002 | Backend: Payme webhook | PAY-001 |
| PAY-003 | Backend: Click webhook | PAY-001 |
| PAY-004 | web-seller: страница тарифов | PAY-001, PAY-002/003 |
| PAY-005 | Admin: управление подписками | PAY-001 |

---

### 📋 Запланировано (Phase 5 — Growth)

| Задача | Описание | Когда |
|--------|---------|-------|
| Mobile (Expo) | React Native приложение для продавцов | Phase 3 |
| Поиск по платформе | Глобальный поиск товаров/магазинов | После Phase 4 |
| Скрапер цен | Мониторинг конкурентов | После Phase 4 |
| Маркетплейс | Объединённый каталог всех магазинов | Phase 5 |
| Карта магазинов | Геолокация магазинов на карте | Phase 5 |
| Партнёрская программа | Реферальная система для продавцов | Phase 5 |

---

## 🔄 Flow данных — Жизненный цикл заказа

```
ПОКУПАТЕЛЬ открывает TWA в Telegram
         ↓
Видит витрину магазина (/twa/store/:slug)
         ↓
Добавляет товар в корзину (POST /cart/items)
         ↓
Оформляет заказ (POST /checkout/confirm)
         ↓ Stock списывается, заказ создан
Socket.IO → ПРОДАВЦУ: event "order:new"
         ↓
Telegram Bot → ПРОДАВЦУ: уведомление
         ↓
Продавец меняет статус в web-seller
         ↓ PATCH /seller/orders/:id/status
Socket.IO → ПОКУПАТЕЛЮ: event "order:status_changed"
         ↓
Заказ DELIVERED → Stock не восстанавливается
Заказ CANCELLED → Stock восстанавливается
```

---

## 🔐 Безопасность

```
Аутентификация:   OTP через Telegram Bot (НЕ SMS, НЕ Eskiz)
JWT:              Access 15мин + Refresh 30 дней
Rate Limiting:    Redis — auth 5/15мин, api 100/мин
Роли:             BUYER / SELLER / ADMIN
Tenant isolation: каждый продавец видит только свои данные
Модерация:        новые магазины → PENDING_REVIEW → Admin
Audit Log:        все admin действия пишутся в audit_log
```

---

## 🌐 Деплой — Railway

```
GitHub push → Railway авто-деплой → Docker build → Production

Сервисы:
  savdo-api         → apps/api/ (NestJS)
  savdo-admin       → apps/admin/ (Vite SPA → nginx)
  savdo-builder-by  → apps/web-buyer/ (Next.js standalone)
  savdo-builder-sl  → apps/web-seller/ (Next.js standalone)

Plugins:
  PostgreSQL 16     → DATABASE_URL авто-инжектируется
  Redis             → REDIS_URL авто-инжектируется
```

---

## 📈 Метрики успеха (KPI)

| Метрика | Сейчас | Цель (3 мес) | Цель (6 мес) |
|---------|--------|-------------|-------------|
| Продавцов | 0 (seed) | 50 | 200 |
| Активных магазинов | 0 | 30 | 150 |
| Заказов/день | 0 | 10 | 100 |
| Выручка (SaaS) | $0 | $500/мес | $2000/мес |
| Telegram покупателей | 0 | 500 | 3000 |

---

## 🚨 Известные риски

| Риск | Вероятность | Влияние | Митигация |
|------|------------|---------|----------|
| Telegram изменит политику Mini App | Низкая | Критическое | Резервный web (уже есть) |
| Railway дорогой при росте | Средняя | Среднее | Мигрировать на VPS при >$100/мес |
| Payme/Click отклонят заявку | Средняя | Высокое | Начать с ручной оплатой |
| Конкуренты (Uzum, Olx) | Низкая | Среднее | Фокус на Telegram-нишу |
| Медленный рост без продаж | Высокая | Высокое | Личные продажи первым 50 клиентам |

---

*savdo-builder · PROJECT_MAP.md · Обновлено 08.04.2026*
