# TASK — savdo-builder
> Обновлено: 06.05.2026 | Источник: UI/UX + Security Audit

---

## 🟠 Высокие — UX (снижают retention)

---

## 🟡 Средние — Feature Gaps

- [ ] [FEAT-001-FE] Поиск — frontend в TMA (backend готов: `GET /storefront/search?q=&limit=`)
  - TMA: строка поиска на BuyerStores + StoresPage с debounced fetch (300ms)
  - Mixed-результат: stores + products в одном dropdown с разделом

- [ ] [FEAT-003] Фильтры товаров (цена, категория)
  - API: query params в GET /storefront/products
  - TMA: filter sheet снизу

- [ ] [FEAT-004] Seller: возможность инициировать чат с покупателем заказа
  - API: POST /chat/threads с orderId + buyerId
  - TMA: кнопка "Написать" на странице заказа продавца

- [ ] [FEAT-005] Typing indicator в чате
  - Socket event: chat:typing { threadId, role }
  - TMA: "печатает..." под последним сообщением

- [ ] [FEAT-006] Seller Analytics dashboard (выручка, заказы за период)
  - API: GET /seller/analytics?from=&to=
  - TMA: графики на DashboardPage

- [ ] [FEAT-008] Отзывы и рейтинг магазина / товара
  - БД: model Review { id, productId, buyerId, orderItemId, rating(1-5), comment?, createdAt }
  - API: POST /buyer/orders/:orderId/items/:itemId/review (требует DELIVERED), GET /storefront/products/:id/reviews
  - TMA buyer: форма отзыва на странице деталей доставленного заказа + блок отзывов на ProductPage
  - TMA seller: уведомление о новом отзыве + карточка отзывов на странице товара
  - Агрегат: avgRating, reviewCount → отдавать в feed для сортировки

---

## 🔵 Правки/Баги (найдены в процессе)

(ничего открытого)
