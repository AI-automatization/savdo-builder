# Итоги спринта — 02.04.2026

**Автор:** Полат  
**Статус:** Production деплой активен ✅

---

## ✅ Что сделано сегодня (Полат)

### 🔐 Auth / OTP
- `DEV_OTP_ENABLED=true` выставлен на Railway → Азим может логиниться, код виден в Railway Logs
- OTP теперь работает в двух режимах одновременно:
  - Если номер **привязан к боту** → код приходит в Telegram (даже при DEV_OTP_ENABLED=true)
  - Если **не привязан** → код только в Railway Logs
- Чтобы привязать: открыть `@savdo_builderBOT` → `/start` → поделиться номером

### 🔌 Socket.IO (WEB-015)
- Новый `OrdersGateway` — продавец подключается к room `seller:{storeId}`
- При новом заказе → emit `order:new`
- При смене статуса → emit `order:status_changed` (с `oldStatus`)
- Азим может брать WEB-026 (заменить polling на Socket.IO)

### 🖥️ Admin Panel — Phase B полностью завершена

| Задача | ID | Что сделано |
|--------|----|-------------|
| Auth + token refresh | ADM-008 | Singleton refresh, retry после 401, `auth.clear()` при logout |
| Moderation queue | ADM-009 | SLA-таймер 24ч (зелёный/жёлтый/красный), кнопка "Взять", метки действий |
| Product hide/restore | ADM-011 | Страница товаров, HIDDEN_BY_ADMIN ↔ ACTIVE |
| Order overview | ADM-012 | Фильтры по статусу, поиск, пагинация 25 шт |
| Global search | ADM-013 | Поиск по телефону / номеру заказа / slug, 350ms debounce |
| Seller detail | ADM-014 | История moderation actions с цветными полосами |
| Verify seller | — | Кнопки Верифицировать / Отклонить / Снять верификацию прямо на странице продавца |

### 🌱 Seed данные
- Скрипт: `packages/db/prisma/seed.ts`
- Создаёт: admin `+998910081910`, продавец `+998901234567` (PENDING), магазин `test-store`, 3 товара, заказ `TEST-001`
- Запуск: `pnpm --filter db seed`

### 🎨 Тема
- Admin панель теперь берёт тему с устройства пользователя (`prefers-color-scheme`)
- При переключении — сохраняет в `localStorage`, не сбрасывается при перезагрузке

### 🔍 Аудит — найдены gaps (ADM-015..018)
Статусы которые отображаются в UI но изменить нельзя — добавлены в tasks.md

---

## 🌐 Продакшн URL

| Сервис | URL | Статус |
|--------|-----|--------|
| Backend API | `https://savdo-api-production.up.railway.app/api/v1/health` | ✅ Active |
| Admin Panel | `https://savdo-builderadmin-production.up.railway.app` | ✅ Active |
| Web Buyer | `https://savdo-builder-by-production.up.railway.app` | ✅ Active |
| Web Seller | `https://savdo-builder-sl-production.up.railway.app` | ✅ Active |

---

## 👥 Кто что делает — правила команды

### Зоны ответственности (нельзя нарушать)

| Разработчик | Домен | Нельзя трогать |
|------------|-------|----------------|
| **Полат** | `apps/api`, `apps/admin`, `packages/db`, `packages/types` | `apps/web-*` |
| **Азим** | `apps/web-buyer`, `apps/web-seller` | `apps/api`, `packages/db`, `apps/admin` |

> `packages/db` — только Полат. Азим сообщает о нужных полях, не правит схему.  
> `packages/types` — Полат пишет, Азим только читает.

---

## 📋 Протокол работы с Claude (для всей команды)

### Перед каждой сессией
```
1. git pull origin main
2. Открыть analiz/tasks.md — взять задачу по своему домену
3. Сказать Claude: "беру [ADM-015]" или "беру [WEB-026]"
```

### Во время работы
```
- Claude читает файлы перед изменением (не придумывает)
- Изменения только в своём домене
- При нахождении бага → добавить в analiz/logs.md, не исправлять сейчас
```

### После каждой задачи
```
1. Claude обновляет analiz/done.md
2. Claude убирает задачу из analiz/tasks.md
3. git commit + git push
```

### Важные правила
```
❌ НЕЛЬЗЯ:
- Менять чужой домен без явного разрешения
- Менять packages/db без Полата
- Добавлять SMS / Eskiz (только Telegram Bot API)
- Хардкодить секреты, деньги в float, тексты без i18n

✅ НУЖНО:
- Читать CLAUDE.md проекта перед стартом
- Указывать ID задачи в коммите
- Проверять analiz/logs.md на активные баги
```

---

## 📋 Задачи Азима (следующая сессия)

| ID | Задача | Приоритет |
|----|--------|-----------|
| WEB-026 | Socket.IO клиент — seller real-time заказы (заменить polling) | 🟡 |
| WEB-027 | Socket.IO клиент — chat real-time (seller + buyer) | 🟡 |
| WEB-028 | Seller analytics страница `/analytics` | 🟢 |

> Полат сделал `OrdersGateway` (WEB-015) — можно брать WEB-026.  
> Room: `seller:{storeId}`, события: `order:new`, `order:status_changed`

## 📋 Задачи Полата (следующая сессия)

| ID | Задача | Приоритет |
|----|--------|-----------|
| ADM-015 | Store: REJECTED + ARCHIVED статусы — API + UI кнопки | 🔴 |
| ADM-016 | Order: смена статуса из admin (хотя бы Cancel) | 🔴 |
| ADM-017 | Product: ARCHIVED статус — API + кнопка | 🟡 |
| ADM-018 | ModerationCase: кнопка закрыть/переоткрыть кейс | 🟡 |

---

## 🔗 Ключевые файлы

| Что | Где |
|-----|-----|
| Задачи в работе | `analiz/tasks.md` |
| Выполненные задачи | `analiz/done.md` |
| Баги и инциденты | `analiz/logs.md` |
| Задачи Азима | `analiz/tasks.md` (раздел Азим) |
| Инварианты системы | `docs/V1.1/01_domain_invariants.md` |
| Статусы и переходы | `docs/V1.1/02_state_machines.md` |
| Коды ошибок | `docs/V1.1/05_error_taxonomy.md` |
| Feature flags | `docs/V1.1/06_feature_flags.md` |
| Дизайн-система admin | `docs/design/liquid-authority.md` |
