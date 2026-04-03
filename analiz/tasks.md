# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/admin`, `apps/mobile-buyer`, `apps/mobile-seller`

> ⚠️ Admin panel передана Полату (ранее Яхьо). Яхьо больше не работает над `apps/admin`.

> ADM Phase A (ADM-001..008) — выполнено 01.04.2026, перенесено в `done.md`

---

## ✅ Выполнено (02.04.2026)

- [x] **[WEB-022]** `DEV_OTP_ENABLED=true` на Railway — Азим может тестировать OTP ✅
- [x] **[WEB-001]** Дубль `PaginationMeta` — дубля нет, TS2308 отсутствует ✅
- [x] **[WEB-015]** Socket.IO emit `order:new` / `order:status_changed` ✅
- [x] **[API-007]** Telegram Webhook — авто-регистрация при старте ✅
- [x] **[API-008]** Watch Paths — уже были в `apps/api/railway.toml` ✅
- [x] **[API-009]** R2 Storage — guard для отсутствия конфига ✅

---

---

## 🟡 Admin — Phase B (после стабильного backend admin API)

> Phase A уже сделана (макеты с моками). Phase B — подключение к реальному API.

- [x] **[ADM-008]** Интеграция admin auth (JWT) ✅
- [x] **[ADM-009]** Seller review queue — реальные данные + SLA-таймер ✅
- [x] **[ADM-010]** Store approve/reject/suspend flow + confirmation modal ✅ (сделано ранее)
- [x] **[ADM-011]** Product hide/restore ✅
- [x] **[ADM-012]** Order overview с фильтрами ✅
- [x] **[ADM-013]** Поиск по телефону / order number / slug ✅
- [x] **[ADM-014]** Seller detail страница с историей moderation actions ✅

---

## 🔴 Admin — Phase C (статусы без управления)

> Аудит 02.04.2026: найдены статусы которые отображаются в UI но изменить их через админку нельзя.


---

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo

---

# Tasks — Азим

Домен: `apps/web-buyer`, `apps/web-seller`

> Все критические страницы Phase B готовы. Осталось ждать Полата по WEB-022 для тестирования.

## ✅ Выполнено (03.04.2026) — Азим

- Auth persistence (F5 не разлогинивает) ✅
- Seller logout — реальный вызов API + очистка кеша ✅
- Dashboard auth guard + редирект на /login ✅
- Onboarding guard (нет магазина → онбординг, есть → dashboard) ✅
- Login redirect если уже залогинен ✅
- Token expiry event → авто-logout в обоих приложениях ✅
- queryClient.clear() при logout ✅
- Analytics → реальный POST /api/v1/analytics/track ✅
- Seller sidebar — реальный phone вместо hardcoded ✅
- Dashboard — views из аналитики вместо ложной revenue ✅
- Buyer SEO meta (generateMetadata per store) ✅
- Buyer root title ("Create Next App" → реальный) ✅
- @ts-ignore × 2 → as React.CSSProperties ✅

~~[WEB-027] — ✅ Chat gateway готов, блокер снят (Полат, 03.04.2026)~~

~~[WEB-028] — ✅ Готово~~

## 🟡 В работе — Азим

### 🟡 [WEB-032] Media upload — Tasks 5-7 (продолжить)
- **Домен:** `apps/web-seller`
- **Детали:** Tasks 1-4 готовы. Осталось:
  - Task 5: ImageUploader в `products/[id]/edit/page.tsx` (previewUrl от `product.mediaUrls?.[0]`)
  - Task 6: logo + cover ImageUploaders в `settings/page.tsx` (StoreSettingsSection)
  - Task 7: `npx tsc --noEmit` в `apps/web-seller`, исправить ошибки, обновить done.md
- **Файлы:** план `docs/superpowers/plans/2026-04-03-media-upload.md` (Tasks 5-7)
