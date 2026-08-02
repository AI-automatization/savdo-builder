# Brief для Ахмеда — Full Super-Admin E2E аудит

**Дата:** 05.06.2026
**Заказчик:** Полат (owner) — `apps/admin` + `apps/api` super-admin зона.
**Цель:** проверить КАЖДОЕ admin-действие end-to-end (UI → API → DB → audit log → side-effects), найти баги/UX-проблемы/security-дыры.

---

## 1. Доступ (разблокировка)

Ахмед заблокирован MFA. Owner должен передать **короткоживущий** admin-JWT
или MFA-bypass JWT для тестового аккаунта:

- **Вариант A (предпочтительно):** owner логинится → DevTools → копирует `Authorization: Bearer <jwt>` из любого `/api/v1/admin/*` запроса → отдаёт Ахмеду на 30 минут.
- **Вариант B:** временно в Railway env поставить `MFA_ENFORCED=false` на staging, Ахмед заходит обычным flow. После аудита — вернуть `true`.

⚠️ НЕ передавать в чат: TOTP secret, recovery codes, DATABASE_URL.

---

## 2. Чек-лист — что проверить (по controller-у)

### 2.1 `super-admin.controller.ts` — высший уровень

| Endpoint | UI-путь | Что проверить |
|----------|---------|---------------|
| `POST /admin/auth/mfa/setup` | Settings → Security → Enable MFA | QR-код генерится, TOTP-app принимает, recovery-codes показаны 1 раз |
| `POST /admin/auth/mfa/verify` | После setup → ввести TOTP | Принимает корректный код, отбивает невалидный (rate-limit?) |
| `POST /admin/auth/mfa/disable` | Settings → Security → Disable | Требует текущий TOTP, audit_log пишется |
| `POST /admin/auth/mfa/login` | После login если mfaEnabled | mfaPending JWT обменивается на полный, неверный TOTP отбит |
| `POST /admin/auth/impersonate/:userId` | Users → ⋮ → Impersonate | Выдаёт BUYER/SELLER JWT, audit_log с reason, нельзя импер. другого ADMIN |
| `GET /admin/admins` | Settings → Admins (list) | Видны все AdminUser, role/permissions колонки, поиск работает |
| `POST /admin/admins` | + New Admin | Создание с email+role, нельзя дублировать email, валидация role |
| `PATCH /admin/admins/:id/role` | Admin row → Change role | Меняет role, нельзя downgrade SUPER_ADMIN последнего, audit |
| `DELETE /admin/admins/:id` | Admin row → Delete | Нельзя удалить self, нельзя удалить последнего SUPER_ADMIN, audit |
| `POST /admin/orders/:id/refund` | Orders → row → Refund modal | Частичный/полный refund, INV-O04 stock возврат, status → REFUNDED |
| `PATCH /admin/sellers/:id/verify-extended` | Sellers → Verify modal | Поднимает verification level, audit |
| `POST /admin/users/:id/activate-seller-on-market` | Users → row → Make seller | Buyer-only → BUYER+SELLER, Seller record создан, store пустой |

### 2.2 `admin-users.controller.ts` — пользователи

| Endpoint | UI-путь | Что проверить |
|----------|---------|---------------|
| `GET /admin/users` (list) | Users page | Pagination, поиск по phone/email/telegramId, фильтр по role |
| `POST /admin/users/:id/suspend` | Row → Suspend | reason обязателен (INV-A02), suspendedAt записан, user не может login |
| `POST /admin/users/:id/unsuspend` | Row → Unsuspend | suspendedAt=null, login снова работает, audit |
| `POST /admin/users/:id/make-seller` | Row → Make seller | Аналог activate-seller-on-market — какой используется UI? Проверить что нет дубля |

⚠️ **Критично:**
- Попробовать suspend SELF (свой admin аккаунт) — должно быть запрещено
- Попробовать suspend другого SUPER_ADMIN — должно быть запрещено
- Попробовать suspend через прямой POST с фейковым `Authorization` — должен быть 401
- Попробовать suspend без `reason` — 422 (INV-A02)
- После suspend — попробовать impersonate suspended user — должно быть запрещено

### 2.3 `admin-stores.controller.ts` — магазины

| Endpoint | Что проверить |
|----------|---------------|
| `POST /:id/suspend` + `/unsuspend` | Магазин скрывается в storefront, продавец видит баннер «suspended», заказы не принимаются |
| `POST /:id/reject` | reason обязателен, status → REJECTED, store скрыт |
| `POST /:id/archive` | Soft-delete, deletedAt записан, в storefront не видно |
| `POST /:id/approve` + `/unapprove` | status PENDING → APPROVED, публикация работает |
| `POST /:id/verify` + `/unverify` | verified badge появляется в storefront |
| `PATCH /:id/channel` | Telegram-канал привязан, тестовая публикация товара ушла в канал |

⚠️ **Критично:**
- suspend store пока есть активные заказы (status=CONFIRMED/PROCESSING) — что с ними?
- reject + approve cycle — не теряются ли данные
- archive (soft-delete) — попробовать восстановить через DB endpoint

### 2.4 `admin-products.controller.ts` — товары

| Endpoint | Что проверить |
|----------|---------------|
| `PATCH /:id/hide` + `/restore` | Товар скрыт в storefront, но видно в seller dashboard |
| `DELETE /:id` | Soft-delete (deletedAt), не hard delete; связанные orders не сломаны |
| `POST /recalc-denorm` | totalStock пересчитывается из variants, avgRating обновляется |
| `PATCH /:id/archive` | Аналог hide? Проверить какой используется в UI |

### 2.5 `admin-sellers.controller.ts` — продавцы

| Endpoint | Что проверить |
|----------|---------------|
| `PATCH /:id/verify` | verified badge у продавца, отображается во всех store-карточках |
| `POST /:id/create-store` | Admin создаёт store за продавца, INV-S01 (1 seller = 1 store) |

### 2.6 `admin-subscriptions.controller.ts` — подписки (BILLING)

⚠️ Полат пока не реализовал BILLING-MACHINE-001 — эндпоинты могут возвращать 404
или работать частично. Зафиксировать что отвечает, не считать багом.

| Endpoint | Что проверить |
|----------|---------------|
| `GET /admin/subscriptions` | Список (если есть) |
| `POST /:id/mark-paid` | Меняет PAST_DUE → ACTIVE, audit |
| `POST /:id/extend-trial` | Продлевает trial на N дней |
| `POST /:id/cancel` | → CHURNED |
| `POST /:id/comp` | Free comp на N месяцев |

### 2.7 `admin-db.controller.ts` — DB raw access ⚠️ ОЧЕНЬ ОПАСНО

| Endpoint | Что проверить |
|----------|---------------|
| `GET /tables/:table` | Список таблиц + строки (whitelist таблиц?) |
| `POST /tables/:table` | Insert через UI — попробовать инжект, попробовать нарушить FK |
| `PATCH /tables/:table/:id` | Update — попробовать поменять `id`, поменять `role` user'а напрямую |
| `DELETE /tables/:table/:id` | Hard delete — попробовать удалить admin, удалить себя, удалить с FK |

⚠️ **Критично:**
- Whitelist таблиц должен быть (не разрешать чтение `admin_session_secrets` или подобного)
- DELETE на user/seller с активными orders — что происходит?
- UPDATE на свою же роль (downgrade) — должно быть запрещено
- SQL-инъекция через имя таблицы или id (если они не валидируются)
- audit_log должен записаться на каждое действие

### 2.8 `admin-broadcast.controller.ts` — Telegram рассылка

| Endpoint | Что проверить |
|----------|---------------|
| `POST /broadcast` | Отправка тестовой рассылки на узкую группу (admins only?). Rate-limit. Прогресс показан в UI? |

### 2.9 `admin-analytics.controller.ts` + `admin-ops.controller.ts`

| Endpoint | Что проверить |
|----------|---------------|
| `GET /admin/analytics/*` | Графики загружаются, цифры разумные |
| `POST /admin/media/migrate-tg-to-r2` | Запуск миграции, прогресс, idempotency |
| `POST /admin/media/audit-broken-urls` | Сканирование, помечает broken bucket |

---

## 3. Cross-cutting проверки

### 3.1 Audit log (INV-A01)
Каждое destructive действие должно писать запись в `audit_log`:
- `actorAdminId`, `action`, `targetType`, `targetId`, `reason`, `metadata`, `createdAt`.
- Проверить: после каждого suspend/reject/delete — есть запись.
- AuditLogsPage в admin должна показывать новые записи.

### 3.2 RolesGuard / @AdminPermission (RBAC)
- Создать второго admin с ограниченными permissions (например только `user:suspend`).
- Логин этим аккаунтом → попробовать каждое запрещённое действие → должно быть 403.
- Wildcard permissions: `user:*` должен давать suspend+unsuspend+make-seller.
- `*` (SUPER_ADMIN) — даёт всё.

### 3.3 MFA enforcement
- AdminUser с `mfaEnabled=true` → login → mfaPending JWT → попробовать любой admin endpoint с mfaPending → должно быть 403.
- Только `/admin/auth/mfa/login` принимает mfaPending JWT.

### 3.4 Rate limiting
- 100+ запросов к /admin/users за минуту — есть ли throttle?
- /admin/auth/mfa/login spam с неверным TOTP — лочится после N попыток?

### 3.5 CORS + headers
- Admin UI запрос с `Origin: https://evil.com` — отклоняется?
- CSP headers присутствуют?

---

## 4. Формат отчёта

Файл `analiz/audit-superadmin-2026-06-05-results.md`. Структура:

```markdown
# Super-Admin Audit Results — 05.06.2026

## Summary
- Endpoints tested: X / Y
- Bugs found: N (P0: x, P1: y, P2: z)
- Security issues: N

## P0 (block launch)
### [SA-AUDIT-001] <title>
- **Что:** ...
- **Шаги воспроизведения:** 1. ... 2. ...
- **Ожидалось:** ...
- **Получено:** ...
- **Endpoint/File:** apps/api/src/modules/admin/...
- **Screenshot/curl:** ...

## P1 ...
## P2 ...
## Verified ✅
- [list of endpoints that passed]
```

Каждый bug = отдельный entry в `analiz/logs.md` после аудита (формат проекта).

---

## 5. Out of scope (не делать)

- Performance load testing (отдельный таск)
- Penetration testing на prod БД (только staging/local)
- Reverse-engineering JWT (только функциональная проверка)
- Trying to brute-force MFA на real admin аккаунте

---

## 6. Контакт

При блокере — писать owner-у через Telegram (не в чат audit-файла).
