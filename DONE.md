# DONE — savdo-builder

## Chat upgrade + UI polish (06.05.2026)

### ✅ [UX-002] Unread badge на иконке чата (BottomNav + Sidebar)
- Backend: `GET /chat/unread-count` (use-case `get-unread-count.use-case.ts`).
- Frontend: `apps/tma/src/lib/chatUnread.ts` — pub/sub + polling 30s, `BottomNav`/`Sidebar` подписаны.
- Invalidate после mark-as-read в обоих ChatPage.
- Коммит `8bc9a61`.

### ✅ [UX-003] Admin: toast после удаления треда
- `apps/admin/src/pages/ChatsPage.tsx:72` — `toast.success('Диалог удалён')`.

### ✅ [FEAT-002] Фото в чате (image messages)
- Backend: `chat_photo` в ALLOWED_PURPOSES, `mediaId` в SendMessageDto, `mediaUrl` в socket payload.
- Frontend: 📎 кнопка + sendPhoto в обоих ChatPage, рендер `<img>` в bubble (max-height 320px).

### ✅ [Phase 1.4] Edit message + «изменено» метка
- Backend: `PATCH /chat/threads/:threadId/messages/:msgId` (15-мин окно, author-only) → emit `chat:message:edited`.
- Frontend: long-press menu → Edit, edit banner, метка `· изменено` в bubble.

### ✅ [Phase 1.5] «Сообщение удалено» placeholder
- Backend: `DELETE /chat/threads/:threadId/messages/:msgId` (soft-delete) → emit `chat:message:deleted`.
- Frontend: `🗑 Сообщение удалено` italic placeholder в bubble.

### ✅ [Phase 2.1] Reply (цитирование сообщений)
- Backend: `parentMessageId` в SendMessageDto + include parent в payload.
- Frontend: long-press → Reply → quote-banner над input → quote-block в bubble (тонкая фиолетовая полоса слева).

### ✅ [Phase 1.2] Silent fail на загрузке чатов → toast
- `loadThreads()` теперь показывает toast «❌ Не удалось загрузить чаты» + кнопка «↻ Повторить».

### ✅ [Phase 1.3] Buyer profile auto-create — soft 0 вместо 422
- `chat.controller.ts::resolveParticipant()` — soft-резолв: возвращает `undefined` для buyer/seller без профиля → `list-my-threads` отдаёт `[]`.

### ✅ [Phase 1.1] Кнопка «+ Добавить» больше не под Telegram MainBar
- `apps/tma/src/pages/seller/ProductsPage.tsx` — `paddingRight: 56px` на header-row для мобильной ширины (<768px).

### ✅ [FEAT-004 backend] Seller инициирует чат с buyer заказа
- `POST /seller/chat/threads` — `@Roles('SELLER')`, throttle 10/min.
- Новый use-case `CreateSellerThreadUseCase`: проверяет `order.sellerId === seller.id`, идемпотентно переиспользует существующий тред для пары (buyer, order), пропускает первое сообщение через `SendMessageUseCase` (получает socket emit + TG push покупателю).
- 422 если order без buyerId (guest checkout) — нечего открывать.
- Frontend FEAT-004-FE — кнопка «✉ Написать» на странице заказа продавца → modal.

### ✅ [FEAT-005 backend] Typing indicator socket event
- `chat.gateway.ts` принимает `chat:typing { threadId, isTyping }` и ретранслирует в комнату `thread:${id}` всем кроме отправителя как `chat:typing { threadId, role, isTyping }`.
- Anti-spoof: emit игнорируется если client не в комнате (т.е. не прошёл `join-chat-room` с проверкой участника).
- Без БД-записи — эфемерное событие, auto-stop через клиентский debounce (3s).

### ✅ [FEAT-006 backend] Seller Analytics с period-фильтром
- `GET /seller/analytics?from=&to=` — `@Roles('SELLER')`. Default период = 30 дней. Cap 90 дней (BadRequest при превышении).
- Новый use-case `GetSellerAnalyticsUseCase` агрегирует Order + OrderItem из БД:
  - `revenue.{total,completed,pending}` — completed = DELIVERED, pending = CONFIRMED+PROCESSING+SHIPPED.
  - `orders.{total, byStatus}` — счётчик по всем 6 OrderStatus.
  - `topProducts[5]` — top-5 по выручке (sum(lineTotalAmount)), исключая CANCELLED.
  - `daily[]` — массив `{date, revenue, orderCount}` с заполнением пустых дней нулями (для графика).
- Frontend часть — отдельная задача FEAT-006-FE (recharts + period-селектор).

### ✅ [FEAT-001 backend] Единый поиск товаров+магазинов
- `GET /storefront/search?q=&limit=` — case-insensitive ILIKE по `name`/`title`/`description`/`slug`.
- Защита: minimum 2 символа в `q`, throttle 30 req/min, limit clamp 1-30.
- Параллельный поиск stores + products в одном HTTP-запросе → один round-trip с фронта.
- Новые методы: `StoresRepository.searchPublic()`, `ProductsRepository.searchPublic()`.
- TODO для prod: trigram-индекс (pg_trgm) на `Store.name`/`Product.title` чтобы ILIKE не делал seq scan на больших объёмах.

### ✅ [UX-004] Admin bundle code splitting — main 903КБ → 51КБ
- `apps/admin/src/App.tsx` — все 23 страницы (кроме LoginPage) обёрнуты в `React.lazy()` + `<Suspense fallback="Загрузка…">`.
- `apps/admin/vite.config.ts` manualChunks расширены: `vendor-charts` (recharts/d3 — 376КБ, грузится только на /analytics), `vendor-mfa` (qrcode/otplib), `vendor-ui` (lucide + sonner + radix).
- Результат: initial JS = vendor-react (297КБ) + index (51КБ) + страница (4-26КБ); до этого был один монолит ~900КБ.
- Каждая страница теперь подтягивается по требованию, vendor-charts больше не блокирует первый paint.

### ✅ [UX-008] Socket connection status badge в заголовке чата
- Новый компонент `apps/tma/src/components/ui/SocketStatusBadge.tsx` — pill «Подключение…» / «Нет связи» (когда connected — ничего не показывает).
- Подписка на `connect` / `disconnect` / `connect_error` события глобального socket.io клиента.
- Вставлен в header обоих ChatPage (buyer + seller) рядом со статусом «Открыт/Закрыт».

---

## Sprint cleanup (05.05.2026)

### ✅ [SEC-005] media: защищённый /private/:id для seller_doc
- **Файлы:** `apps/api/src/modules/media/media.controller.ts`, `apps/api/src/modules/media/use-cases/upload-direct.use-case.ts`
- **Что сделано:**
  - upload-direct: для `purpose=seller_doc` сохраняем `visibility=PROTECTED` (раньше всё было PUBLIC).
  - Новый endpoint `GET /api/v1/media/private/:id` под `@UseGuards(JwtAuthGuard)` — отдаёт PROTECTED файлы только владельцу или ADMIN.
  - URL в response upload-direct для seller_doc теперь `/api/v1/media/private/:id` (а не `/proxy/:id`).
- **Why:** документы продавцов раньше были открыты по ID без проверки прав. Теперь даже зная media id посторонний получит 404 — нужен JWT + (owner OR admin).

### ✅ [BUG-FIX] BottomSheet: `z-[9999]flex` → `z-[9999] flex`
- Линтер съел пробел между Tailwind-utility classes — BottomSheet не рендерился. Поправлено в коммите `20cfcec`.

### ✅ [UX-007] Spinner при отправке сообщения вместо ⏳ эмодзи
- **Файлы:** `apps/tma/src/pages/buyer/ChatPage.tsx`, `apps/tma/src/pages/seller/ChatPage.tsx`
- Кнопка ➤ при `sending=true` теперь показывает `<Spinner size={14} />` вместо ⏳ — ровный круговой crescent, без скачка размера.

### ✅ Already-done (closed после re-audit TASK.md)
- **UX-001** human-readable статусы — `Badge.tsx` уже маппит PENDING→«Обрабатывается», DELIVERED→«Доставлен» и т.д.
- **UX-005** объяснение «Диалог закрыт» — текст уже отображается в обоих ChatPage.
- **UX-006** Enter без текста — guard `if (text.trim()) sendMsg()` уже есть в onKeyDown.
- **BUG-001** colSpan в ChatsPage — admin/ChatsPage.tsx уже `colSpan={6}`.
- **BUG-002** messages.slice().reverse() — выполняется один раз в `.then()` после fetch, не на каждом рендере. Бага нет.

## Super-admin UI feature pack (03.05.2026)

Реализовано P1–P7 в `apps/admin/`. Сборка проходит чисто, коммит `5eab85f`, мерж в `admin` ветку запушен на Railway.

### ✅ [P1] RBAC role management
- Файл: `apps/admin/src/pages/AdminUsersPage.tsx` (новый), `apps/admin/src/lib/admin-roles.ts`
- Грид администраторов с role badge, модалки Edit role + Add admin (поиск по телефону → радио ролей).
- Сайдбар: новая группа "Безопасность" в DashboardLayout.
- Endpoints: `GET/POST/PATCH/DELETE /api/v1/admin/admins`.

### ✅ [P2] MFA setup (TOTP)
- Файл: `apps/admin/src/pages/MfaSetupPage.tsx` (новый), route `/security/mfa`
- QR код через бекенд (`qrCodeDataUrl`), копирование секрета, ввод 6-значного кода, disable с confirm.
- Endpoints: `GET /admin/auth/mfa/status`, `POST /admin/auth/mfa/setup|verify|disable`.

### ✅ [P3] Impersonation
- Файлы: `lib/impersonation.tsx`, `components/admin/ImpersonationBanner.tsx`, кнопка в `UserDetailPage.tsx`
- Tokens: оригинальный admin access сохраняется в sessionStorage, импер-токен заменяет рабочий. Banner sticky-top на всех страницах + кнопка "Вернуться к админу".
- Endpoints: `POST /admin/auth/impersonate/:userId|stop-impersonate`.

### ✅ [P4] Refund flow
- Файл: `apps/admin/src/pages/OrdersPage.tsx` — кнопка "💰 Возврат" появляется для DELIVERED.
- `RefundDialog` с amount (+ partial toggle), reason, returnToWallet чекбокс.
- Endpoint: `POST /api/v1/admin/orders/:id/refund`.

### ✅ [P5] Manual seller verification
- Файл: `components/admin/SellerVerificationPanel.tsx` — встроен в `SellerDetailPage` (правая колонка).
- 3 статуса (PENDING_REVIEW/APPROVED/REJECTED), 4 чекбокса требований, reason+notes textarea, проверка allChecked перед APPROVED.
- Endpoint: `PATCH /api/v1/admin/sellers/:id/verify`.

### ✅ [P6] Cmd+K command palette
- Файл: `components/admin/CommandPalette.tsx` — глобальный listener Cmd+K / Ctrl+K в DashboardLayout.
- 19 routes для навигации + дебаунс-поиск по `users/stores/orders` (parallel `Promise.allSettled`).
- Использует `cmdk@1.1.1` (был в package.json).

### ✅ [P7] Bull Board redirect
- Route `/queues` → `QueuesRedirect` компонент в App.tsx → `window.location.assign(VITE_API_URL + /api/v1/admin/queues)`.
- Sidebar: пункт "Очереди (Bull)" в группе DevOps.

### Глобальные изменения
- `App.tsx`: добавлен `<Toaster>` (sonner, dark theme, bottom-right) + `<ImpersonationProvider>` обёртка.
- `DashboardLayout.tsx`: группа "Безопасность" в сайдбаре, `<ImpersonationBanner>` над `<Outlet>`, кнопка поиска вызывает Cmd+K.

### Build verification
```
pnpm --filter admin run build → ✓ built in 789ms (no TS errors)
- vendor-react: 297 KB → 93 KB gzip
- index: 327 KB → 71 KB gzip
- vendor-charts: 376 KB → 109 KB gzip
```

---

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
