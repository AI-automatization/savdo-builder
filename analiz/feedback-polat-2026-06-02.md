# Фидбек Полату — что нужно сделать (аудит 02.06.2026)

> Составлено по запросу Азима. Источник: git-аудит + аудит кода `apps/tma`, `apps/api` +
> `analiz/tasks.md` + `analiz/logs.md`. Сгруппировано по приоритету.
> **Контекст активности:** последний коммит Полата — **27.05.2026 09:24**. На 02.06 — 6 дней тишины.
> Бэкенд Полата задеплоен (ветка `origin/api` +148 коммитов над main), но ряд P0/P1 висит без движения.

---

## 🔴 P0 — блокеры, чинить первыми

### 1. [API-CHECKOUT-CONFIRM-500-001] Покупатель не может оформить заказ на проде
- **Статус:** 🟡 частичный фикс (fault-isolation side-effects, `aec25e5`), **root cause не найден**.
- **Симптом:** `POST /api/v1/checkout/confirm` → HTTP 500 на проде. Buyer не завершает покупку.
- **Что сделать:** redeploy `api` → поймать stack trace из `ErrorReporter` (Sentry/stderr) →
  дотянуть корневую причину (подозрения: DB constraint / stock race / Decimal внутри `createOrder()`).
- **Почему критично:** это буквально «нельзя купить». Всё остальное вторично, пока это открыто.
- **Зона:** `apps/api/src/modules/checkout/`.

### 2. [BILLING-MACHINE-001] Биллинг-машина — бэкенд-часть (блокер платного launch)
- **Спека:** `docs/business/billing-machine-spec-v1-2026-05-31.md` (§7 бизнес-модели v2).
- **Часть Полата:** `Subscription` entity (1:1 Seller, INV-S01) с tier STARTER/PRO/BUSINESS и
  статусами TRIAL→ACTIVE→PAST_DUE→SUSPENDED→CHURNED + `SubscriptionDto` в `packages/types`
  (это **разблокирует Азима** на фронте) + cron-переходы статусов + admin-endpoint ручной оплаты +
  storefront read-gate (SUSPENDED → магазин скрыт, перекрывает `isPublic`) + product-cap guard (Старт ≤50).
- **Статус:** спека ждёт его аудита — **6 открытых вопросов в §12 спеки** + 10 в §15 бизнес-модели.
- **Последовательность:** Полат делает entity+DTO → Азим параллельно рисует suspended-states.

---

## 🟠 P1 — важное (дизайн-консистентность + инфра-надёжность)

### 3. TMA-дизайн НЕ переведён на финал maxsavdo design-v2 (главная находка аудита)
- **Что обнаружено:** `apps/tma` всё ещё на **старой палитре Liquid Glass v1.0**:
  - accent = Orchid Violet `#A855F7` + Arctic Cyan `#22D3EE` (канон — Champagne Gold `#C9A876`).
  - фон = Deep Navy `#0B0E14` (канон — Rich Black `#0A0A0A`).
  - бренд = текст «Savdo» + emoji 🛒 (нет лого maxsavdo).
  - шрифт = SF Pro/system-ui (канон — Inter).
  - тема = **force-dark**, игнорирует ADR-009 (`system`), light-тема заготовлена но отключена.
- **Доказательства:** `apps/tma/src/index.css:26-48`, `src/lib/themes.ts:31-64`, `src/lib/styles.ts`,
  `src/pages/HomePage.tsx:32-35`, `src/providers/ThemeProvider.tsx:20-29`.
- **Корень техдолга:** **~553 inline `rgba(255,255,255,X)`** в 40 файлах → пока не вынести в
  CSS-переменные, light-тему и новую палитру не включить. Это отдельная миграция (~3-4 ч).
- **Тикет (завести):** `TMA-DESIGN-V2-MIGRATE-001` — палитра + лого + CSS-vars + light-тема.
- **Важно:** web-buyer/web-seller (Азим) уже на design-v2. TMA визуально расходится с вебом.

### 4. [BRAND-*] Ребренд частей Полата под maxsavdo v2
- `BRAND-ADMIN-REBRAND-001` — admin под Dark Luxury (P2, но для консистентности).
- `BRAND-TG-BOT-COPY-001` — тексты бота + аватар бота (welcome, OTP, нотификации).
- `BRAND-EMAIL-TEMPLATES-001` — если есть transactional emails.
- `BRAND-API-METADATA-001` — OG/manifest/favicon в admin/api.
- `BRAND-LOGO-SVG-CREATE-001` остаток — иконки admin/email/TG-бот (web-знак Азим закрыл).

### 5. [DEVOPS-RAILWAY-DEPLOY-RESILIENCE-001] остаток (Railway dashboard)
- п.4 Root Directory `telegram-app` = `apps/tma` + удалить корневой `railway.toml` с ветки `tma`.
- п.6 watchPatterns `apps/tma/railway.toml` — убрать лишние `packages/types`/`packages/ui`.
- п.8 алертинг Railway на падение деплоя.
- CODEOWNERS — нужен GitHub-handle Полата для `apps/*/railway.toml`.

### 6. [INFRA-UPTIME-ALERTS-001] + [SENTRY-DSN-001]
- UptimeRobot (5 endpoint'ов, пинг 5 мин) + Telegram-алерт. ~30 мин.
- Реальный Sentry DSN в Railway env (SDK уже задеплоен `8024cbd`). ~30 мин.

### 7. [INFRA-BACKUP-DRILL-FIRST-RUN-001]
- Один реальный restore-drill на свежем прод-дампе (инструментарий готов). Закрывает риск R2.

### 8. [SUPPORT-CHANNEL-001] остаток
- Создать `@maxsavdo_support` + **выставить `NEXT_PUBLIC_SUPPORT_URL` в Railway-env** web-buyer +
  web-seller (тогда фронт-ссылки Азима апгрейдятся с бота на канал без правок кода).
- Ссылки в `apps/tma` settings + `apps/admin/login`.

---

## 🟡 P2 — баги/тех-долг (не блокеры, но фронт от них кастует/страдает)

### 9. [API-CHECKOUT-PICKUP-DELIVERY-FEE-001] «Самовывоз» всё равно платит доставку
- Backend не знает про `deliveryMode` (нет в `ConfirmCheckoutDto`). Логика обнуления fee для pickup
  уже есть в use-case — нужно только пробросить поле в DTO.

### 10. [API-PRODUCT-LIST-TOTAL-STOCK-TYPE-001] `totalStock` не задекларирован в типе
- Backend отдаёт `totalStock` в storefront-листе, но его нет в `ProductListItem`.
  Из-за этого web-buyer кастует `(product as { totalStock?: number })`. Добавить `totalStock: number`
  в `packages/types` → Азим уберёт cast.

---

## ⚙️ Env-переменные на Railway (его зона), от которых зависит прод фронта
- `NEXT_PUBLIC_API_URL` — web-buyer/web-seller (иначе фолбэк на localhost).
- `NEXT_PUBLIC_SUPPORT_URL` — после создания support-канала.
- `SENTRY_DSN` — все сервисы.

---

## ✅ Что у Полата сделано хорошо (для справедливости)
- Бэкенд-ядро (api): auth/OTP через Telegram (Eskiz отсутствует — правило соблюдено), checkout,
  orders, products, cart, chat (Socket.IO), analytics. Инварианты INV-S01/C01/C03/O04 соблюдены в коде.
- Контракты через `packages/types` — single source of truth, рассинхрона с фронтом нет.
- Security-аудит OWASP (CORS allow-list, trust proxy, rate-limit, RBAC, Telegram HTML escape, MFA).
- TMA функционально готова на ~95% (все экраны buyer+seller работают) — проблема только в дизайне/теме.
- Redis-resilience после инцидента 18.05, recovery-runbook, CI deploy-config-check.
