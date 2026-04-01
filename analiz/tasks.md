# Tasks — Полат

Домен: `apps/api`, `packages/db`, `packages/types`, `apps/mobile-buyer`, `apps/mobile-seller`, `apps/admin`

---

## 🔴 Admin — Phase A (текущий спринт)

> `apps/admin/` — пустой, с нуля. Стек: Next.js 14 App Router + Tailwind + DaisyUI + TanStack Query
> Дизайн: `docs/design/liquid-authority.md` (Liquid Authority)

- [x] **[ADM-001]** Инициализировать `apps/admin` (Next.js App Router + TS + Tailwind + DaisyUI)
- [x] **[ADM-002]** Настроить Tailwind config + DaisyUI + цветовые переменные Liquid Authority
- [x] **[ADM-003]** Базовый layout: sidebar (навигация) + top bar
- [x] **[ADM-004]** Admin auth страница (`/login`) — OTP через Telegram
- [x] **[ADM-005]** Страница `/sellers` — таблица с моками, фильтры
- [x] **[ADM-006]** Страница `/stores` — таблица с моками
- [x] **[ADM-007]** Страница `/orders` — таблица с моками
- [x] **[ADM-008(a)]** Страница `/moderation` — очередь с табами + reject modal
- [x] **[ADM-008(b)]** Страница `/audit-logs` — таблица с пагинацией

## 🟡 Admin — Phase B (после стабильного backend admin API)

- [ ] **[ADM-008]** Интеграция admin auth (JWT)
- [ ] **[ADM-009]** Seller review queue — реальные данные + SLA-таймер
- [ ] **[ADM-010]** Store approve/reject/suspend flow + confirmation modal
- [ ] **[ADM-011]** Product hide/restore
- [ ] **[ADM-012]** Order overview с фильтрами
- [ ] **[ADM-013]** Поиск по телефону / order number / slug
- [ ] **[ADM-014]** Seller detail страница с историей moderation actions

---

## 📋 Заморожено (Phase 3)

- `apps/mobile-buyer/` — React Native + Expo
- `apps/mobile-seller/` — React Native + Expo
