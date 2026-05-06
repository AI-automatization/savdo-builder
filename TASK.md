# TASK — savdo-builder
> Обновлено: 06.05.2026 | Источник: UI/UX + Security Audit

---

## 🟠 Высокие — UX (снижают retention)

---

## 🟡 Средние — Feature Gaps

- [ ] [FEAT-001-FE] Поиск — frontend в TMA (backend готов: `GET /storefront/search?q=&limit=`)
  - TMA: строка поиска на BuyerStores + StoresPage с debounced fetch (300ms)
  - Mixed-результат: stores + products в одном dropdown с разделом

- [ ] [FEAT-003-FE] Filter sheet снизу — TMA frontend
  - Backend готов: GET /storefront/products принимает `globalCategoryId`, `priceMin`, `priceMax`, `sort=new|price_asc|price_desc`
  - TMA: bottom-sheet с категориями (chips) + range-slider цены + sort-radio

- [ ] [FEAT-004-FE] Seller инициирует чат — TMA frontend (backend готов: `POST /seller/chat/threads`)
  - TMA: кнопка «✉ Написать» на странице заказа продавца → modal с textarea
  - После создания → navigate на `/seller/chat/:id`

- [ ] [FEAT-005-FE] Typing indicator — TMA frontend (backend готов: socket `chat:typing`)
  - Композер emit'ит `socket.emit('chat:typing', { threadId, isTyping })` на debounced input
  - В bubble под последним сообщением — «печатает…» с auto-fade 3s

- [ ] [FEAT-006-FE] Seller Analytics dashboard frontend (backend готов: `GET /seller/analytics?from=&to=`)
  - TMA: графики revenue + orders на DashboardPage (recharts или sparkline)
  - Период-селектор: 7/30/90 дней + custom from-to picker

- [ ] [FEAT-008] Отзывы и рейтинг магазина / товара
  - БД: model Review { id, productId, buyerId, orderItemId, rating(1-5), comment?, createdAt }
  - API: POST /buyer/orders/:orderId/items/:itemId/review (требует DELIVERED), GET /storefront/products/:id/reviews
  - TMA buyer: форма отзыва на странице деталей доставленного заказа + блок отзывов на ProductPage
  - TMA seller: уведомление о новом отзыве + карточка отзывов на странице товара
  - Агрегат: avgRating, reviewCount → отдавать в feed для сортировки

---

## 🔵 Правки/Баги (найдены в процессе)

(ничего открытого)
