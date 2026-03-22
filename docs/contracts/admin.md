# API Contract — Admin Panel

**Base URL:** `/api/v1`
**Версия:** 1.0
**Потребитель:** `apps/admin` (Яхьо)

---

## Аутентификация — как получить admin JWT

Все эндпоинты `/admin/*` требуют двух условий одновременно:

1. Валидный JWT с `role = "ADMIN"` в заголовке `Authorization: Bearer <token>`
2. Запись в таблице `admin_users` для данного `userId`

**JWT с ролью ADMIN недостаточно.** Если запись в `admin_users` отсутствует, сервер вернёт `403 ADMIN_NOT_FOUND`.

### Порядок входа для администратора

```
1. POST /api/v1/auth/request-otp  — запросить OTP на телефон
2. POST /api/v1/auth/verify-otp   — подтвердить OTP, получить accessToken + refreshToken
3. Использовать accessToken в заголовке Authorization: Bearer <token>
4. POST /api/v1/auth/refresh       — обновить пару токенов по refreshToken
5. POST /api/v1/auth/logout        — инвалидировать сессию
```

Токены хранить в памяти (accessToken) и в httpOnly cookie или secure storage (refreshToken).

---

## Auth

### POST /api/v1/auth/request-otp

Отправляет OTP на указанный номер телефона.

**Auth:** не требуется

**Request Body:**
```json
{
  "phone": "+998901234567",
  "purpose": "login"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `phone` | string | да | Узбекский номер в формате `+998XXXXXXXXX` |
| `purpose` | `"login"` \| `"register"` \| `"checkout"` | да | Для входа в админку — всегда `"login"` |

**Response 200:**
```json
{
  "message": "OTP sent",
  "expiresAt": "2026-03-21T10:05:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR` — неверный формат номера телефона или недопустимое значение `purpose`

---

### POST /api/v1/auth/verify-otp

Подтверждает OTP и возвращает пару токенов.

**Auth:** не требуется

**Request Body:**
```json
{
  "phone": "+998901234567",
  "code": "1234",
  "purpose": "login"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `phone` | string | да | Тот же номер, что в request-otp |
| `code` | string | да | OTP-код, 4–6 символов |
| `purpose` | string | да | Должен совпадать с purpose из request-otp |

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "phone": "+998901234567",
    "role": "ADMIN"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — некорректные поля
- `400 OTP_INVALID` — неверный код
- `400 OTP_EXPIRED` — код истёк

---

### POST /api/v1/auth/refresh

Обновляет пару токенов по refreshToken.

**Auth:** не требуется

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `401 TOKEN_INVALID` — токен не валиден или отозван
- `401 TOKEN_EXPIRED` — токен истёк

---

### POST /api/v1/auth/logout

Инвалидирует текущую сессию (по sessionId из JWT).

**Auth:** `Authorization: Bearer <accessToken>` (обязательно)

**Request Body:** нет

**Response:** `204 No Content`

**Errors:**
- `401 UNAUTHORIZED` — невалидный или отсутствующий токен

---

## Управление пользователями

### GET /api/v1/admin/users

Список всех пользователей с фильтрацией.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Query Parameters:**

| Параметр | Тип | Обязательно | Допустимые значения | По умолчанию |
|----------|-----|-------------|---------------------|--------------|
| `role` | string | нет | `BUYER`, `SELLER`, `ADMIN` | — |
| `status` | string | нет | `ACTIVE`, `BLOCKED` | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–100 | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "phone": "+998901234567",
      "role": "SELLER",
      "status": "ACTIVE",
      "createdAt": "2026-01-15T08:00:00.000Z"
    }
  ],
  "total": 142,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `401 UNAUTHORIZED` — токен отсутствует или невалиден
- `403 FORBIDDEN` — роль не ADMIN
- `403 ADMIN_NOT_FOUND` — нет записи в `admin_users`

---

### GET /api/v1/admin/users/:id

Детальная информация о пользователе.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID пользователя

**Response 200:**
```json
{
  "id": "uuid",
  "phone": "+998901234567",
  "role": "SELLER",
  "status": "ACTIVE",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-03-10T12:00:00.000Z"
}
```

**Errors:**
- `401 UNAUTHORIZED`
- `403 ADMIN_NOT_FOUND`
- `404 USER_NOT_FOUND` — пользователь с таким id не существует

---

### POST /api/v1/admin/users/:id/suspend

Заблокировать пользователя. Записывает действие в `audit_log`.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID пользователя

**Request Body:**
```json
{
  "reason": "Нарушение правил платформы: спам"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `reason` | string | да | Причина блокировки, не пустая, макс. 500 символов |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "BLOCKED",
  "suspendedAt": "2026-03-21T09:00:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR` — пустая или слишком длинная причина
- `403 ADMIN_NOT_FOUND`
- `404 USER_NOT_FOUND`
- `409 USER_ALREADY_SUSPENDED` — пользователь уже заблокирован

---

### POST /api/v1/admin/users/:id/unsuspend

Разблокировать пользователя. Записывает действие в `audit_log`.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID пользователя

**Request Body:**
```json
{
  "reason": "Апелляция рассмотрена, блокировка снята"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `reason` | string | да | Причина разблокировки, макс. 500 символов |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ACTIVE",
  "unsuspendedAt": "2026-03-21T09:30:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `403 ADMIN_NOT_FOUND`
- `404 USER_NOT_FOUND`
- `409 USER_NOT_SUSPENDED` — пользователь не был заблокирован

---

## Управление продавцами

### GET /api/v1/admin/sellers

Список продавцов с фильтром по статусу верификации.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Query Parameters:**

| Параметр | Тип | Обязательно | Допустимые значения | По умолчанию |
|----------|-----|-------------|---------------------|--------------|
| `verificationStatus` | string | нет | `UNVERIFIED`, `PENDING`, `VERIFIED`, `REJECTED`, `SUSPENDED` | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–100 | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "userId": "uuid",
      "businessName": "Мой магазин ООО",
      "verificationStatus": "PENDING",
      "createdAt": "2026-02-01T10:00:00.000Z"
    }
  ],
  "total": 38,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `400 VALIDATION_ERROR` — недопустимое значение `verificationStatus`
- `403 ADMIN_NOT_FOUND`

---

### GET /api/v1/admin/sellers/:id

Детальная информация о продавце вместе с его магазином.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID продавца (seller, не user)

**Response 200:**
```json
{
  "id": "uuid",
  "userId": "uuid",
  "businessName": "Мой магазин ООО",
  "verificationStatus": "VERIFIED",
  "store": {
    "id": "uuid",
    "name": "Мой магазин",
    "slug": "moy-magazin",
    "status": "APPROVED",
    "createdAt": "2026-02-01T10:00:00.000Z"
  },
  "createdAt": "2026-02-01T10:00:00.000Z"
}
```

**Errors:**
- `403 ADMIN_NOT_FOUND`
- `404 SELLER_NOT_FOUND`

---

## Управление магазинами

### GET /api/v1/admin/stores

Список магазинов с фильтром по статусу.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Query Parameters:**

| Параметр | Тип | Обязательно | Допустимые значения | По умолчанию |
|----------|-----|-------------|---------------------|--------------|
| `status` | string | нет | `DRAFT`, `PENDING_REVIEW`, `APPROVED`, `REJECTED`, `SUSPENDED`, `ARCHIVED` | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–100 | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Электроника Плюс",
      "slug": "elektronika-plus",
      "status": "PENDING_REVIEW",
      "sellerId": "uuid",
      "createdAt": "2026-03-01T08:00:00.000Z"
    }
  ],
  "total": 21,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `400 VALIDATION_ERROR` — недопустимое значение `status`
- `403 ADMIN_NOT_FOUND`

---

### GET /api/v1/admin/stores/:id

Детальная информация о магазине.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID магазина

**Response 200:**
```json
{
  "id": "uuid",
  "name": "Электроника Плюс",
  "slug": "elektronika-plus",
  "status": "APPROVED",
  "sellerId": "uuid",
  "seller": {
    "id": "uuid",
    "businessName": "ИП Иванов",
    "verificationStatus": "VERIFIED"
  },
  "createdAt": "2026-03-01T08:00:00.000Z",
  "updatedAt": "2026-03-15T12:00:00.000Z"
}
```

**Errors:**
- `403 ADMIN_NOT_FOUND`
- `404 STORE_NOT_FOUND`

---

### POST /api/v1/admin/stores/:id/suspend

Приостановить магазин. Записывает действие в `audit_log`.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID магазина

**Request Body:**
```json
{
  "reason": "Продажа запрещённых товаров"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `reason` | string | да | Причина приостановки, макс. 500 символов |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "SUSPENDED",
  "suspendedAt": "2026-03-21T11:00:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `403 ADMIN_NOT_FOUND`
- `404 STORE_NOT_FOUND`
- `409 STORE_ALREADY_SUSPENDED`

---

### POST /api/v1/admin/stores/:id/unsuspend

Восстановить магазин из приостановки. Записывает действие в `audit_log`.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Path Parameters:**
- `id` — UUID магазина

**Request Body:**
```json
{
  "reason": "Нарушение устранено, ограничения сняты"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `reason` | string | да | Причина снятия приостановки, макс. 500 символов |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "APPROVED",
  "unsuspendedAt": "2026-03-21T14:00:00.000Z"
}
```

**Errors:**
- `400 VALIDATION_ERROR`
- `403 ADMIN_NOT_FOUND`
- `404 STORE_NOT_FOUND`
- `409 STORE_NOT_SUSPENDED`

---

## Очередь модерации

### GET /api/v1/admin/moderation

Все кейсы модерации с фильтрацией.

**Auth:** `Bearer JWT (role: ADMIN)`

**Query Parameters:**

| Параметр | Тип | Обязательно | Допустимые значения | По умолчанию |
|----------|-----|-------------|---------------------|--------------|
| `status` | string | нет | `open`, `approved`, `rejected`, `escalated`, `closed` | — |
| `entityType` | string | нет | `store`, `seller`, `product`, `message` | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–100 | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "store",
      "entityId": "uuid",
      "status": "open",
      "assignedToId": null,
      "createdAt": "2026-03-20T09:00:00.000Z"
    }
  ],
  "total": 15,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `400 VALIDATION_ERROR` — недопустимое значение `status` или `entityType`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`

---

### GET /api/v1/admin/moderation/queue

Только открытые (`status = open`) кейсы — рабочая очередь для ревью.

**Auth:** `Bearer JWT (role: ADMIN)`

**Query Parameters:**

| Параметр | Тип | Обязательно | По умолчанию |
|----------|-----|-------------|--------------|
| `page` | number | нет | `1` |
| `limit` | number | нет | `20` |

> Фильтры `status` и `entityType` игнорируются — этот эндпоинт всегда возвращает только `open`.

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "entityType": "seller",
      "entityId": "uuid",
      "status": "open",
      "assignedToId": null,
      "createdAt": "2026-03-21T07:30:00.000Z"
    }
  ],
  "total": 7,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`

---

### GET /api/v1/admin/moderation/:id

Детальная информация о кейсе с полной историей действий.

**Auth:** `Bearer JWT (role: ADMIN)`

**Path Parameters:**
- `id` — UUID кейса модерации

**Response 200:**
```json
{
  "id": "uuid",
  "entityType": "store",
  "entityId": "uuid",
  "status": "open",
  "assignedToId": "uuid",
  "actions": [
    {
      "id": "uuid",
      "action": "REQUEST_CHANGES",
      "comment": "Требуется загрузить документы",
      "actorId": "uuid",
      "createdAt": "2026-03-20T10:00:00.000Z"
    }
  ],
  "createdAt": "2026-03-19T08:00:00.000Z",
  "updatedAt": "2026-03-20T10:00:00.000Z"
}
```

**Errors:**
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 MODERATION_CASE_NOT_FOUND`

---

### POST /api/v1/admin/moderation/:id/action

Принять решение по кейсу модерации.

**Auth:** `Bearer JWT (role: ADMIN)`

**Path Parameters:**
- `id` — UUID кейса

**Request Body:**
```json
{
  "action": "REJECT",
  "comment": "Магазин нарушает правила платформы"
}
```

| Поле | Тип | Обязательно | Описание |
|------|-----|-------------|----------|
| `action` | string | да | Одно из: `APPROVE`, `REJECT`, `REQUEST_CHANGES`, `ESCALATE` |
| `comment` | string | условно | Обязателен при `action = REJECT`. Макс. 1000 символов. Рекомендуется при `REQUEST_CHANGES`. |

**Допустимые значения `action`:**

| Значение | Описание | `comment` |
|----------|----------|-----------|
| `APPROVE` | Одобрить сущность | опциональный |
| `REJECT` | Отклонить сущность | **обязателен** |
| `REQUEST_CHANGES` | Запросить исправления | рекомендуется |
| `ESCALATE` | Передать на эскалацию | опциональный |

**Response 200:**
```json
{
  "id": "uuid",
  "status": "rejected",
  "action": {
    "id": "uuid",
    "action": "REJECT",
    "comment": "Магазин нарушает правила платформы",
    "actorId": "uuid",
    "createdAt": "2026-03-21T11:00:00.000Z"
  }
}
```

**Errors:**
- `400 VALIDATION_ERROR` — недопустимое значение `action`
- `400 COMMENT_REQUIRED` — не передан `comment` при `action = REJECT`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 MODERATION_CASE_NOT_FOUND`
- `409 CASE_ALREADY_CLOSED` — кейс уже закрыт

---

### PATCH /api/v1/admin/moderation/:id/assign

Назначить кейс на себя (текущего авторизованного администратора).

**Auth:** `Bearer JWT (role: ADMIN)`

**Path Parameters:**
- `id` — UUID кейса

**Request Body:** нет

**Response 200:**
```json
{
  "id": "uuid",
  "assignedToId": "uuid",
  "updatedAt": "2026-03-21T11:05:00.000Z"
}
```

**Errors:**
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`
- `404 MODERATION_CASE_NOT_FOUND`
- `409 CASE_ALREADY_ASSIGNED` — кейс уже назначен другому администратору

---

## Аналитика

### GET /api/v1/admin/analytics/events

Список аналитических событий с фильтрацией.

**Auth:** `Bearer JWT (role: ADMIN)`

> Примечание: этот эндпоинт не вызывает `resolveAdminUser`, проверяется только JWT-роль.

**Query Parameters:**

| Параметр | Тип | Обязательно | Описание | По умолчанию |
|----------|-----|-------------|----------|--------------|
| `eventName` | string | нет | Название события, напр. `store.viewed` | — |
| `storeId` | UUID | нет | Фильтр по конкретному магазину | — |
| `actorUserId` | UUID | нет | Фильтр по пользователю-источнику события | — |
| `from` | ISO 8601 date | нет | Начало периода, напр. `2026-03-01` | — |
| `to` | ISO 8601 date | нет | Конец периода, напр. `2026-03-21` | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–1000 | `100` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "eventName": "store.viewed",
      "storeId": "uuid",
      "actorUserId": "uuid",
      "metadata": {
        "source": "search"
      },
      "createdAt": "2026-03-21T10:00:00.000Z"
    }
  ],
  "total": 540,
  "page": 1,
  "limit": 100
}
```

**Errors:**
- `400 VALIDATION_ERROR` — невалидный UUID в `storeId` или `actorUserId`, невалидная дата в `from`/`to`
- `401 UNAUTHORIZED`
- `403 FORBIDDEN`

---

## Журнал аудита

### GET /api/v1/admin/audit-log

Журнал всех административных действий. Каждое действие через `suspend`/`unsuspend` автоматически записывается.

**Auth:** `Bearer JWT (role: ADMIN)` + запись в `admin_users`

**Query Parameters:**

| Параметр | Тип | Обязательно | Описание | По умолчанию |
|----------|-----|-------------|----------|--------------|
| `actorUserId` | string | нет | Фильтр по ID администратора, совершившего действие | — |
| `entityType` | string | нет | Тип сущности, напр. `user`, `store` | — |
| `entityId` | string | нет | UUID конкретной сущности | — |
| `page` | number | нет | >= 1 | `1` |
| `limit` | number | нет | 1–100 | `20` |

**Response 200:**
```json
{
  "data": [
    {
      "id": "uuid",
      "action": "USER_SUSPENDED",
      "entityType": "user",
      "entityId": "uuid",
      "actorUserId": "uuid",
      "metadata": {
        "reason": "Нарушение правил платформы: спам"
      },
      "createdAt": "2026-03-21T09:00:00.000Z"
    }
  ],
  "total": 87,
  "page": 1,
  "limit": 20
}
```

**Errors:**
- `401 UNAUTHORIZED`
- `403 ADMIN_NOT_FOUND`

---

## Сводка всех эндпоинтов

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/api/v1/auth/request-otp` | Запросить OTP |
| POST | `/api/v1/auth/verify-otp` | Подтвердить OTP, получить токены |
| POST | `/api/v1/auth/refresh` | Обновить токены |
| POST | `/api/v1/auth/logout` | Выйти из системы |
| GET | `/api/v1/admin/users` | Список пользователей |
| GET | `/api/v1/admin/users/:id` | Детали пользователя |
| POST | `/api/v1/admin/users/:id/suspend` | Заблокировать пользователя |
| POST | `/api/v1/admin/users/:id/unsuspend` | Разблокировать пользователя |
| GET | `/api/v1/admin/sellers` | Список продавцов |
| GET | `/api/v1/admin/sellers/:id` | Детали продавца с магазином |
| GET | `/api/v1/admin/stores` | Список магазинов |
| GET | `/api/v1/admin/stores/:id` | Детали магазина |
| POST | `/api/v1/admin/stores/:id/suspend` | Приостановить магазин |
| POST | `/api/v1/admin/stores/:id/unsuspend` | Восстановить магазин |
| GET | `/api/v1/admin/moderation` | Все кейсы модерации |
| GET | `/api/v1/admin/moderation/queue` | Очередь (только open) |
| GET | `/api/v1/admin/moderation/:id` | Детали кейса + история |
| POST | `/api/v1/admin/moderation/:id/action` | Принять решение по кейсу |
| PATCH | `/api/v1/admin/moderation/:id/assign` | Назначить кейс на себя |
| GET | `/api/v1/admin/analytics/events` | Аналитические события |
| GET | `/api/v1/admin/audit-log` | Журнал аудита |
