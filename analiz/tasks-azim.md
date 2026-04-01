# Tasks — Azim

Домен: `apps/web-buyer`, `apps/web-seller`
Нельзя трогать: `apps/api`, `packages/db`, `apps/admin`, `apps/mobile-*`

Обновлено: 01.04.2026

---

## 🔴 Критические (блокируют работу)

- [ ] **[WEB-001]** Убрать дублирование `PaginationMeta`
  - Проблема: `PaginationMeta` объявлен в двух местах — TS2308
  - `packages/types/src/api/orders.ts` — оставить, это источник истины
  - `apps/web-buyer/src/common.ts` или `apps/web-seller/src/common.ts` — удалить локальный, импортировать из `packages/types`
  - **Не трогать** `packages/types` — только удалить дубль в web-*

- [ ] **[WEB-002]** Добавить `NEXT_PUBLIC_API_URL` в Railway Variables
  - В Railway → `savdo-builder-by` (web-buyer) → Variables:
    `NEXT_PUBLIC_API_URL=https://savdo-api-production.up.railway.app`
  - В Railway → `web-seller` сервис → Variables: то же самое
  - После этого передеплоить оба сервиса

---

## 🟡 Важные (текущий спринт)

- [ ] **[WEB-003]** Смержить `feature/api-layer` → `main`
  - Только после того как WEB-001 и WEB-002 выполнены
  - Проверить что билд проходит локально перед мержем

- [ ] **[WEB-004]** Проверить `GET /api/v1/storefront/stores/:slug`
  - Endpoint **уже реализован** в backend (`products.controller.ts`)
  - Нужно проверить что `storefront-server.ts` вызывает правильный URL
  - Убедиться что ответ совпадает с контрактом в `docs/contracts/`

- [ ] **[WEB-005]** Проверить ISR на `[slug]/page.tsx`
  - `revalidate: 30` — убедиться что работает в продакшне (Railway)
  - Протестировать: изменить магазин → через 30с страница обновилась

---

## 🟢 Обычные

- [ ] **[WEB-006]** `web-seller` dashboard — проверить loading skeletons на медленном соединении
- [ ] **[WEB-007]** `web-buyer` ProductCard — убедиться что `ProductListItem` из `packages/types` покрывает все поля

---

## ℹ️ Контекст

- `GET /storefront/stores/:slug` — **уже есть в backend**, не нужно просить Полата добавлять
- `PaginationMeta` дубль — исправить только в web-* коде, не в packages/types
- Env переменные в `.env.example` уже заполнены — нужно только добавить в Railway Dashboard
