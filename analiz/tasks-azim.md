# Tasks — Azim

Домен: `apps/web-buyer`, `apps/web-seller`
Нельзя трогать: `apps/api`, `packages/db`, `apps/admin`, `apps/mobile-*`

Обновлено: 31.05.2026

> ⚠️ **ВАЖНО — где живёт фронт-код:** i18n (`uz.ts`/`ru.ts`) и многие фронт-фичи
> существуют ТОЛЬКО на ветках `web-buyer`/`web-seller`, НЕ на `main` (main держит
> устаревший snapshot). Railway деплоит с этих веток. Правки для прода — на ветках,
> сверять состояние через `git show <branch>:<file>`, не по `main` и не по аудит-файлам.

---

## 🟢 Состояние на 31.05.2026: фронт-код-очередь пуста

Все выполнимые фронт/brand-задачи закрыты. Активных 🔴-багов в web-домене, которые
чинятся в коде Азима, нет — фронтовые баги в `logs.md` уже защищены адаптерами,
корневые причины у Полата (бэк/контракты). Прод buyer+seller отдают 200, бренд раскатан.

---

## 🆕 02.06.2026 — бизнес+маркетинг теперь зона Азима (не код)

> Зафиксировано 02.06: бизнес-модель, монетизация, маркетинг, GTM — целиком Азим.
> Мастер-роадмап: `docs/business/roadmap-to-production-2026-06-02.md`. Порядок ниже = приоритет.

- [ ] **[BIZ-DECISIONS-§15]** Закрыть 10 открытых решений §15 `business-model-v2` + 6 §12 билл-спеки.
  Это шаг 0.1 роадмапа — **разблокирует биллинг-машину**. Минимум: цены 99/299/899, триал+grandfather,
  метрика=заказы/мес, дата launch Q3/Q4, multi-store=roadmap. Зафиксировать решения прямо в доке.
- [ ] **[BILLING-FRONT]** После Subscription-DTO Полата: suspended-states (баннеры trial/past_due,
  dashboard read-only, «магазин недоступен» в buyer) + pricing-страница + выбор тарифа в onboarding.
- [ ] **[MARKETING-CHANNELS]** Завести Instagram @maxsavdo + Telegram-канал @maxsavdo (контент-план §9.2).
- [ ] **[GTM-OUTREACH-LIST]** Собрать 80–120 контактов продавцов в приватный Google Sheet (НЕ в репо).
  Сверить UZ-скрипты нативно (`gtm-phase-a`).

---

## 🆕 07.06.2026 — платёжная модель: новые задачи

> Источник: сессия 07.06 (брейншторм оплаты). Контекст: `docs/business/payments-legal-tax-2026-06-07.md`.
> Задачи Полата по этой теме — `docs/handoff-polat-2026-06-07.md` (запушено).

- [x] **[BIZ-MODEL-UPDATE]** ✅ Внесена правка в `business-model-v2`: Phase 2 hybrid отменён,
  **subscription-only** (баннер + §0 + §5.2 superseded). Запушено веткой `docs/business-model-v2-no-commission` (07.06).
- [ ] **[LEGAL-TAX-SETUP]** 🔴 Юр-оформление — критпуть к онлайн-оплате подписки. Чек-лист:
  выбрать форму (рекоменд. **ООО**) → **ЭЦП** → регистрация юрлица → расчётный счёт → резидентство
  **IT Park** → договор **Payme/Click** (мерчант) → аутсорс-бухгалтер. Связано с `LEGAL-OFFER-REQUISITES-001`.
- [ ] **[PAY-UI]** 🟡 Платёжный UI (часть ждёт поля карты от Полата — handoff п.2):
  - web-seller: секция реквизитов (ввод карты/способов) + кнопка «отметить оплаченным» в заказе +
    экран покупки подписки («Тарифы»).
  - web-buyer: показ карты продавца на checkout + «перевод на карту» как способ (после поля Полата).
- [x] **[CHECKOUT-PAYMENTMETHOD-FIX]** ✅ Checkout шлёт `paymentMethod` + `deliveryMode`, копирайт под
  реалии УЗ (07.06, коммит `04ac34f`, локально). Детали — `done.md` / `logs.md`.

---

## 🆕 07.06.2026 (вечер) — лендинг продавца: доработка + отстройка от qlay

> Все на ветке `feat/seller-landing`, локально, **не задеплоено** (решение Азима). Детали — `done.md`.

- [x] **[ENUM-BUILD-FIX]** ✅ Разблокирован build web-seller (enum-as-value шим `lib/enums.ts`) — `91a4cbb`.
- [x] **[LANDING-HERO-FIX]** ✅ Hero (reveal-observer) + мок-телефон в стиле TMA + реальные фото — `281f6d3`,`2b291b5`,`f88f653`.
- [x] **[LANDING-QLAY-GAPS]** ✅ Витрины (3 примера), соцпруф «8 из 10», ниши, живое демо, UZ-локализация мока — `ae45d60`.
- [ ] **[LANDING-DEPLOY]** 🟠 Выкат лендинга — ПО КОМАНДЕ Азима. ⚠️ НЕ merge feat→web-seller (ветки
  разошлись, см. `INFRA-BRANCH-RECONCILE-001` в tasks.md). Способ: свежая ветка от `origin/web-seller`
  → перенести ТОЛЬКО landing-файлы (`components/landing/*`, `lib/landing/*`, `public/landing/*`,
  `lib/i18n/server-locale.ts`, change `app/page.tsx`) + СЛИТЬ landing-i18n-ключи в dashboard-словари
  (536+ключей) → enum-шим НЕ нужен (на web-seller real enums) → build → push. Делать только когда скажет.

---

## 🔴 Остаток за Азимом — но это НЕ код

- [ ] **[LEGAL-OFFER-REQUISITES-001]** — 🔒 **заблокирован бизнесом.**
  Нужны реквизиты ИП/ООО (регистрация юрлица). После регистрации — 30 мин правки
  placeholder в `apps/web-buyer/src/app/offer/page.tsx:71-75` (ИНН/ОКЭД/юр.адрес/счёт)
  + MX `support@/legal@maxsavdo.uz`. До регистрации делать нечего.

- [ ] **[WEB-UZ-TRANSLATION-REVIEW-001]** — терминология ЗАКРЫТА (`8b24117`, `8049c2a`).
  Остался ТОЛЬКО ручной прод-тест RU/UZ-свитчера за auth-гейтом (нужен реальный вход
  Азима — анонимно/агентом не проверить) + нативная вычитка узбекского на естественность.
  Side-by-side аудит: `analiz/audits/uz-translation-review-2026-05-30.md` (орфография
  чистая, 0 дефектов).

---

## ✅ Закрыто (детали — в `done.md`)

- **[BRAND-LOGO]** — лого maxsavdo. Сага из ~8 итераций (font-based → геом → pixel-trace →
  brand-image → 2-img CSS → revert → opencv-трассировка). **ФИНАЛ 31.05:** откат к ПЕРВОМУ
  font-based знаку (`8224f02`): Inter «M» w900, split clipPath theme-adaptive + золотая
  Q-дуга. web-buyer `510602b`, web-seller `d5c1a55`, запушено. Из brand-book JPG (знак
  ~110px) чистый вектор невозможен — для «идеала» нужен оригинальный .svg/.ai от дизайнера.
- **[BRAND-PALETTE / FONT / TOKENS / UI-REPLACE]** — палитра Dark Luxury, Inter,
  Tailwind-токены, ребренд UI обоих апов. Закрыто 25.05.
- **[SUPPORT-CHANNEL-001]** (фронт-часть) — пункт «Поддержка» в web-buyer profile +
  web-seller settings, `NEXT_PUBLIC_SUPPORT_URL` с фолбэком на бот. Закрыто 30.05.
- **[FAQ-001]** — `/help` 8 Q&A ru+uz. Закрыто 21.05.
- **[FRONTEND-SMOKE part A/B]** — vitest smoke (helpers/i18n/uz-canonical). part C — осознанный SKIP.
- **[WEB-001/002]** (старые, 01.04) — фактически закрыты: прод собирается и работает
  (PaginationMeta-TS2308 не блокирует билд, `NEXT_PUBLIC_API_URL` выставлен — иначе API
  на проде бил бы в localhost). Если всплывёт — перепроверить, но активной проблемы нет.

---

## ⏭️ Не твоё — критпуть к лончу (бизнес / Полат)

- Регистрация юрлица → разблокирует LEGAL + платежи (Click/Payme после бизнес-счёта).
- Ops Полата: UptimeRobot, Sentry DSN, watch-patterns fix (sl/by ждут Railway-дашборда,
  `logs.md` ~1371), выставить `NEXT_PUBLIC_SUPPORT_URL` в Railway-env когда создаст канал.
- GTM Phase A: outreach-лист Азима на 20–30 продавцов (работа, но не код).
  Черновик скриптов: `analiz/gtm-phase-a-2026-05-30.md` (под нативную сверку).
