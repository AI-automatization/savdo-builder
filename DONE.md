# DONE — savdo-builder

## Аудит TASK.md vs реальный код (02.05.2026)

При проверке TASK.md выяснилось, что 6 из 7 SEC задач + BUG-003 + FEAT-007 уже реализованы в коде (вероятно в более ранних коммитах, но не отмечены). Записываю по факту.

### ✅ [SEC-001] OTP: Math.random() → crypto.randomInt()
- **Файл:** `apps/api/src/modules/auth/services/otp.service.ts:31`
- **Что сделано:** `randomInt(100000, 1000000)` из `crypto`. Комментарий «SEC-001» в коде.

### ✅ [SEC-002] OTP verify: Redis-счётчик попыток (макс 5 → блок 15 мин)
- **Файлы:** `apps/api/src/modules/auth/services/otp.service.ts:14-78`, `verify-otp.use-case.ts:26`
- **Что сделано:** `OTP_MAX_ATTEMPTS = 5`, TTL 15min, `checkVerifyAttempts/recordFailedAttempt/clearVerifyAttempts`. Graceful degradation если Redis недоступен.

### ✅ [SEC-003] Убрать OTP код из dev-логов
- **Файл:** `apps/api/src/modules/auth/services/otp.service.ts:85`
- **Что сделано:** `Sending code to phone=${phone}` — больше не логируется сам код. Только факт отправки.

### ✅ [SEC-004] OTP: 4 → 6 цифр
- **Файл:** `apps/api/src/modules/auth/services/otp.service.ts:31`
- **Что сделано:** `randomInt(100000, 1000000)` — диапазон 6 цифр. (объединено с SEC-001)

### ✅ [SEC-006] Дублирующие auth эндпоинты убраны
- **Файл:** `apps/api/src/modules/auth/auth.controller.ts`
- **Что сделано:** В контроллере остались только `/request-otp` и `/verify-otp`. `/otp/send` и `/otp/verify` удалены.

### ✅ [SEC-007] Whitelist для query.status в admin/chat/threads
- **Файл:** `apps/api/src/modules/chat/chat.controller.ts:323-324`
- **Что сделано:** `const allowedStatuses = ['OPEN', 'CLOSED']; const where = status && allowedStatuses.includes(status) ? { status } : {};` Невалидный status молча игнорируется.

### ✅ [BUG-003] adminListThreads whitelist
- Дубль SEC-007. Закрыт тем же изменением.

### ✅ [FEAT-007] Wishlist / Избранное для покупателя
- **Коммиты:** `0f46a63 feat(api+db+types): wishlist`, `fd8721f feat(tma): wishlist UI`
- **Что сделано:** БД-модель Wishlist, API POST/DELETE /buyer/wishlist/:productId, TMA — кнопка ♡, страница WishlistPage, авто-hydration в feed.

## Спринт: Orders UX polish (02.05.2026)

### ✅ [ORD-UX-1] Подсветка активных фильтров заказов + подсказка свайпа
- **Дата:** 02.05.2026
- **Файлы:** `apps/tma/src/index.css`, `apps/tma/src/pages/buyer/OrdersPage.tsx`, `apps/tma/src/pages/seller/OrdersPage.tsx`, `apps/tma/src/pages/buyer/StoresPage.tsx`, `apps/tma/src/pages/buyer/StorePage.tsx`, `apps/tma/src/pages/seller/ProductsPage.tsx`
- **Что сделано:** добавлены утилиты `chip-active` (фиолетовый glow для активного фильтра), `chip-active-cyan` (cyan glow для сортировки), `scroll-fade-x` (затухание справа — намёк на свайп), `scroll-snap-x`. Применены в OrdersPage (buyer+seller), StoresPage, StorePage, seller ProductsPage.

### ✅ [ORD-UX-2] Приоритизация заказов: важные первыми
- **Дата:** 02.05.2026
- **Файлы:** `apps/tma/src/pages/buyer/OrdersPage.tsx`, `apps/tma/src/pages/seller/OrdersPage.tsx`
- **Что сделано:** заказы PENDING → CONFIRMED/PROCESSING → SHIPPED → DELIVERED → CANCELLED, внутри группы — свежие первыми. В seller PENDING (новые) выходят на самый верх — продавец сразу видит заказы, которые ждут его реакции.

### ✅ [ORD-UX-3] Бейдж остатка товара на карточках в фиде
- **Дата:** 02.05.2026
- **Файлы:** `apps/api/src/modules/products/repositories/products.repository.ts`, `apps/api/src/modules/products/products.controller.ts`, `apps/tma/src/components/ui/ProductCard.tsx`, `apps/tma/src/pages/seller/ProductsPage.tsx`
- **Что сделано:** в storefront feed (`/storefront/products`, `/stores/:slug/products`, `/seller/products`) теперь возвращается `totalStock` — сумма stockQuantity по активным вариантам. На карточке у покупателя и продавца показывается красный бейдж "НЕТ В НАЛИЧИИ" или жёлтый "ОСТАЛОСЬ N" при остатке ≤5. На ProductPage детальный остаток уже был.

## Спринт: Chat + Security Hardening (апрель 2026)

### ✅ [CHAT-001] Fix: chat thread status mismatch OPEN/CLOSED
- **Дата:** 23.04.2026
- **Файлы:** `chat.repository.ts`, `resolve-thread.use-case.ts`, `send-message.use-case.ts`, `buyer/ChatPage.tsx`, `seller/ChatPage.tsx`
- **Что сделано:** API создавал треды со статусом 'active', резолвил в 'resolved'. TMA и web ожидали 'OPEN'/'CLOSED'. Всё унифицировано.

### ✅ [CHAT-002] Fix: real-time сообщения не приходили
- **Дата:** 23.04.2026
- **Файлы:** `buyer/ChatPage.tsx`, `seller/ChatPage.tsx`
- **Что сделано:** TMA слушал `chat:new_message`, gateway слал `chat:message` — несовпадение. Исправлено на `chat:message`.

### ✅ [CHAT-003] Fix: имена вместо "Диалог" в списке тредов
- **Дата:** 23.04.2026
- **Файлы:** `chat.repository.ts`, `list-my-threads.use-case.ts`, оба ChatPage
- **Что сделано:** `findThreadsByBuyer` включает seller.store.name, `findThreadsBySeller` включает buyer.user.phone. Маппинг в ThreadListItem DTO.

### ✅ [CHAT-004] Feat: профиль продавца/покупателя в чате
- **Дата:** 23.04.2026
- **Файлы:** `buyer/ChatPage.tsx`, `seller/ChatPage.tsx`
- **Что сделано:** Покупатель видит кнопку "Открыть магазин" → переход к store. Продавец видит карточку с телефоном покупателя + кнопка копировать.

### ✅ [CHAT-005] Feat: кнопка удаления треда в админке
- **Дата:** 23.04.2026
- **Файлы:** `chat.controller.ts` (DELETE /admin/chat/threads/:id), `ChatsPage.tsx`
- **Что сделано:** Кнопка Trash2 в каждой строке с confirm(), hard delete сообщений и треда.

### ✅ [SEC-A] Security: CORS в production не пропускает * без ALLOWED_ORIGINS
- **Дата:** 23.04.2026
- **Файл:** `apps/api/src/main.ts`

### ✅ [SEC-B] Security: timingSafeEqual для Telegram HMAC
- **Дата:** 23.04.2026
- **Файл:** `apps/api/src/modules/auth/use-cases/telegram-auth.use-case.ts`

### ✅ [SEC-C] Security: JWT стратегия проверяет BLOCKED статус в БД
- **Дата:** 23.04.2026
- **Файл:** `apps/api/src/modules/auth/strategies/jwt.strategy.ts`

### ✅ [SEC-D] Security: OTP rate limit per phone+purpose (не только по phone)
- **Дата:** 23.04.2026
- **Файлы:** `request-otp.use-case.ts`, `auth.repository.ts`

### ✅ [SEC-E] Security: глобальный ThrottlerModule (60 req/min)
- **Дата:** 23.04.2026
- **Файл:** `apps/api/src/app.module.ts`

### ✅ [SEC-F] Security: Throttle на sendMessage (30 msg/min)
- **Дата:** 23.04.2026
- **Файл:** `apps/api/src/modules/chat/chat.controller.ts`

### ✅ [CAT-001] GlobalCategoriesSeedService — автосид 33 категорий
- **Дата:** 23.04.2026
- **Файлы:** `global-categories-seed.service.ts`, `categories.module.ts`

### ✅ [CAT-002] CategoryModal: иерархия + поиск + clear
- **Дата:** 23.04.2026
- **Файл:** `apps/tma/src/components/ui/CategoryModal.tsx`
