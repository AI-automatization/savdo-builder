# TASK — savdo-builder
> Обновлено: 23.04.2026 | Источник: UI/UX + Security Audit

---

## 🔴 Критические — Security (блокируют безопасность)

- [ ] [SEC-001] OTP: заменить Math.random() → crypto.randomInt()
  - Файл: `apps/api/src/modules/auth/services/otp.service.ts:25`
  - Проблема: Math.random() не криптостойкий, предсказуем

- [ ] [SEC-002] OTP verify: Redis-счётчик попыток (макс 5 → блок 15 мин)
  - Файл: `apps/api/src/modules/auth/use-cases/verify-otp.use-case.ts`
  - Проблема: можно перебрать все 9000 комбинаций без блока

- [ ] [SEC-003] Убрать OTP код из dev-логов
  - Файл: `apps/api/src/modules/auth/services/otp.service.ts:39`
  - Проблема: `logger.warn([DEV OTP] Code: ${code})` — утечка кода в логи

- [ ] [SEC-004] OTP: 4 цифры → 6 цифр (1000-9999 → 100000-999999)
  - Файл: `apps/api/src/modules/auth/services/otp.service.ts:24`

- [ ] [SEC-005] media/proxy: добавить JWT guard для purpose=seller_doc
  - Файл: `apps/api/src/modules/media/media.controller.ts:89`
  - Проблема: документы продавцов доступны публично по ID

- [ ] [SEC-006] Удалить дублирующие auth эндпоинты
  - Файл: `apps/api/src/modules/auth/auth.controller.ts:40-63`
  - Убрать: `/auth/otp/send` (дубль request-otp) и `/auth/otp/verify` (дубль verify-otp)

- [ ] [SEC-007] Добавить DTO валидацию для query-параметра status в admin/chat/threads
  - Файл: `apps/api/src/modules/chat/chat.controller.ts:136`

---

## 🟠 Высокие — UX (снижают retention)

- [ ] [UX-001] Статусы заказов: технические → human-readable в TMA
  - Файл: `apps/tma/src/pages/buyer/OrdersPage.tsx`
  - PENDING→"Обрабатывается", CONFIRMED→"Подтверждён", SHIPPED→"В доставке", DELIVERED→"Доставлен", CANCELLED→"Отменён"

- [ ] [UX-002] Unread badge на иконке чата в TMA (buyer + seller)
  - Файл: `apps/tma/src/components/layout/AppShell.tsx` (нижний nav)
  - Нужен: API endpoint GET /chat/threads/unread-count + socket event

- [ ] [UX-003] Admin: toast после удаления треда
  - Файл: `apps/admin/src/pages/ChatsPage.tsx:72`

- [ ] [UX-004] Admin bundle: code splitting (903KB → ~300KB)
  - Файл: `apps/admin/vite.config.ts`
  - Добавить manualChunks по роутам

- [ ] [UX-005] ChatPage: показывать объяснение почему нельзя писать в закрытом треде
  - Файл: `apps/tma/src/pages/buyer/ChatPage.tsx` и `seller/ChatPage.tsx`

- [ ] [UX-006] ChatPage: Enter без текста не вызывает sendMsg
  - Файл: оба ChatPage — добавить guard в onKeyDown

- [ ] [UX-007] Loader при отправке сообщения — spinner в кнопке ➤
  - Файл: оба ChatPage

- [ ] [UX-008] Socket connection status badge в заголовке чата

---

## 🟡 Средние — Feature Gaps

- [ ] [FEAT-001] Поиск товаров и магазинов
  - API: `GET /storefront/search?q=&type=product|store`
  - TMA: строка поиска на BuyerStores + StoresPage

- [ ] [FEAT-002] Фото в чате (image messages)
  - API: расширить sendMessage с mediaId
  - TMA: кнопка прикрепить файл в ChatPage

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

- [ ] [FEAT-007] Wishlist / Избранное для покупателя
  - API: POST/DELETE /buyer/wishlist/:productId
  - TMA: кнопка ♡ на карточке товара

- [ ] [FEAT-008] Отзывы и рейтинг магазина
  - API: POST /orders/:id/review
  - TMA: форма отзыва после DELIVERED

---

## 🔵 Правки/Баги (найдены в процессе)

- [ ] [BUG-001] colSpan=5 в ChatsPage при 6 колонках (после добавления кнопки удаления)
  - Файл: `apps/admin/src/pages/ChatsPage.tsx:133,135`

- [ ] [BUG-002] messages.slice().reverse() при каждом рендере — нужен useMemo
  - Файл: обa ChatPage

- [ ] [BUG-003] adminListThreads использует status из query без whitelist-валидации
  - Файл: `apps/api/src/modules/chat/chat.controller.ts:136`
