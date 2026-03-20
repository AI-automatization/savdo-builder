# Admin Tasks — Яхьо

Домен: `apps/admin`
Агент: `admin-builder`, `ui-builder`

---

## Phase A — Параллельно с backend

> Пока admin API не готово — строить layout и статичные страницы.

### Очередь
- [ ] Инициализировать apps/admin (Next.js App Router)
- [ ] Настроить Tailwind + DaisyUI
- [ ] Базовый layout admin panel (sidebar с навигацией)
- [ ] Admin auth страница (login form)
- [ ] Страница sellers — статичный UI, таблица с моками
- [ ] Страница stores — статичный UI
- [ ] Страница orders — статичный UI

---

## Phase B — После стабильного backend admin API

- [ ] Интеграция admin auth
- [ ] Seller review queue — реальные данные
- [ ] Store approve/reject/suspend flow
- [ ] Product hide/restore
- [ ] Order overview с фильтрами
- [ ] Поиск по телефону / order number / slug
- [ ] Страница seller detail с историей moderation actions
- [ ] SLA-таймер на pending review cards

---

## Правила

- Не трогать `apps/api`, `packages/db`, `apps/web-*`
- packages/types — только читать
- Destructive actions (suspend, block) — всегда с confirmation modal
- Status badges должны соответствовать цветам из docs/V1.1/02_state_machines.md
- После завершения → перенести в docs/done/admin.md
