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
