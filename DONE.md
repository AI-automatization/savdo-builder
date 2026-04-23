# DONE — savdo-builder

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
