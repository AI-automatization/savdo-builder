# 04_mvp_scope_decisions.md — MVP Scope Decisions

Этот документ фиксирует **явные решения** о том, что включено в MVP и что нет.

Цель: избежать scope creep и дать команде однозначный ответ на вопрос "а давайте добавим X?".

---

## Backlog тиры

| Тир | Значение |
|-----|---------|
| `MVP CORE` | Без этого продукт не работает |
| `MVP PLUS` | Нужно для pilot-а, но можно запустить без |
| `LATER` | Ценно, но после стабильного MVP |
| `REJECTED` | Сознательно не делаем в V0.x |

---

## Seller & Store

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Регистрация через OTP | MVP CORE | |
| Создание одного магазина | MVP CORE | |
| Store slug auto-generation | MVP CORE | |
| Upload logo + cover | MVP CORE | |
| Store описание | MVP CORE | |
| Telegram contact link | MVP CORE | |
| Delivery settings | MVP CORE | |
| Store moderation (admin approve) | MVP CORE | |
| Store analytics dashboard | LATER | |
| Custom domain для store | REJECTED | Сложность DNS, not worth it для UZ market |
| Несколько магазинов у одного seller | REJECTED | Усложняет onboarding, не нужно для MVP |
| Store themes / branding | LATER | |
| SEO meta editor | LATER | |
| Store QR-code generator | MVP PLUS | Помогает расшарить в оффлайне |

---

## Products & Catalog

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Создание продуктов с вариантами | MVP CORE | |
| Product images (до 5 фото) | MVP CORE | |
| Store-level categories | MVP CORE | |
| Global categories | MVP CORE | Только для классификации, не для навигации покупателя |
| Drag & drop сортировка | MVP PLUS | |
| Bulk import товаров | LATER | |
| Product reviews & ratings | LATER | |
| Product SEO fields | LATER | |
| Saved items / wishlist | LATER | |
| Compare products | REJECTED | Не характерно для UZ Telegram-рынка |
| Product bundles | REJECTED | |

---

## Checkout & Orders

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Checkout с доставкой | MVP CORE | |
| Checkout с самовывозом | MVP CORE | |
| Cash on delivery | MVP CORE | |
| Snapshot order items | MVP CORE | INV-C04 |
| Order status transitions | MVP CORE | |
| Order history (seller) | MVP CORE | |
| Order history (buyer, с OTP) | MVP CORE | |
| Order cancellation | MVP CORE | |
| Order internal notes (seller) | MVP PLUS | Нужно для операционки |
| Промокоды / скидки | LATER | |
| Online payments (Click, Payme) | LATER | ADR-003 |
| Возвраты | LATER | |
| Повторный заказ (repeat order) | LATER | |
| Мультивалютность | REJECTED | Только UZS в MVP |

---

## Chat

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Product inquiry thread | MVP CORE | |
| Order thread | MVP CORE | |
| Text messages | MVP CORE | |
| Single image attachment | MVP PLUS | Сложно безопасно, можно отложить |
| Unread counters | MVP CORE | |
| Typing indicator | REJECTED | |
| Message read receipts | REJECTED | |
| Message delete / edit | REJECTED | |
| Message reactions | REJECTED | |
| Voice messages | REJECTED | |
| Chat search | LATER | |
| Group chats | REJECTED | |
| No presence (online/offline) | REJECTED | Убирает complexity |

> **Fallback:** кнопка "Написать в Telegram" всегда доступна. Это снижает критичность chat-а в MVP.

---

## Notifications

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Telegram notifications для seller | MVP CORE | Самый важный канал для seller-а |
| In-app notification center | MVP CORE | |
| Mobile push (Expo) | LATER | Появляется вместе с mobile app |
| Web push (browser) | REJECTED | Сложность реализации несопоставима с ценностью на старте |
| Email notifications | LATER | |
| SMS notifications для buyer | MVP PLUS | При отсутствии Telegram у buyer |

---

## Mobile

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Seller mobile app (Expo) | LATER | Фаза 3 — после стабильного backend + web |
| Buyer mobile app (Expo) | LATER | Фаза 3 |
| PWA (Progressive Web App) | MVP PLUS | Seller panel web-responsive = почти PWA |

> Buyer storefront — это Next.js с mobile-first UX. Работает через браузер. Нативное app — Фаза 3.

---

## Admin

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Seller review queue | MVP CORE | |
| Store approve/reject/suspend | MVP CORE | |
| Product hide/restore | MVP CORE | |
| User block | MVP CORE | |
| Order overview | MVP CORE | |
| Chat moderation (read) | MVP PLUS | |
| Analytics dashboard | MVP PLUS | |
| Bulk operations | LATER | |
| Role-based admin (multiple admins) | LATER | В MVP один superadmin |
| Admin mobile app | REJECTED | |

---

## Analytics & Observability

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Analytics events в БД | MVP CORE | Seller onboarding funnel + buyer conversion |
| Basic seller insights (views, orders) | MVP PLUS | |
| Advanced seller analytics | LATER | |
| External analytics (Amplitude, Mixpanel) | LATER | |
| Error tracking (Sentry) | MVP CORE | |
| Structured logging + correlation ID | MVP CORE | |
| Uptime monitoring | MVP CORE | |

---

## Инфраструктура

| Feature | Тир | Комментарий |
|---------|-----|-------------|
| Single server deployment | MVP CORE | |
| Cloudflare R2 | MVP CORE | ADR-005 |
| Redis (BullMQ + cache) | MVP CORE | |
| Eskiz.uz OTP | MVP CORE | |
| Playmobile fallback OTP | MVP PLUS | |
| Dev OTP (console log) | MVP CORE | Для разработки без SMS |
| Docker compose (local) | MVP CORE | |
| CI/CD basic pipeline | MVP CORE | |
| Auto-scaling | LATER | |
| Multi-region | REJECTED | |
| CDN для storefront | MVP PLUS | Cloudflare Pages / Vercel |

---

## Summary: что делаем в первую очередь

**Phase A — Core foundation** (всё это должно работать до pilot-а):
1. Auth (OTP flow)
2. Seller registration + store creation
3. Products + variants
4. Media upload
5. Storefront (public) — buyer browsing
6. Cart + Checkout
7. Orders (PENDING → CONFIRMED → DELIVERED/CANCELLED)
8. Telegram notifications для seller

**Phase B — Pilot readiness:**
9. Seller onboarding polish (funnel events)
10. Admin panel (approve/reject/suspend)
11. Chat (product + order threads)
12. In-app notifications
13. Analytics events

**Phase C — Retention:**
14. Buyer order history
15. Seller insights
16. Repeat order helpers
17. Mobile web polish

**Phase D — Expansion (Фаза 3+):**
18. Mobile apps (Expo)
19. Online payments
20. Advanced moderation
