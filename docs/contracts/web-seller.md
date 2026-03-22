# API Contract — web-seller

Base URL: `/api/v1`
All authenticated requests require: `Authorization: Bearer <accessToken>`

---

## Auth

### POST /api/v1/auth/request-otp

**Auth:** not required
**Role:** public

**Request:**
```json
{
  "phone": "+998901234567",
  "purpose": "login"
}
```

`purpose`: `"login"` | `"register"` | `"checkout"`
`phone`: must match `+998XXXXXXXXX`

**Response 200:**
```json
{
  "message": "OTP sent",
  "expiresAt": "2026-03-21T10:05:00.000Z"
}
```

**Errors:**
- `VALIDATION_ERROR`: invalid phone format or unknown purpose

---

### POST /api/v1/auth/verify-otp

**Auth:** not required
**Role:** public

**Request:**
```json
{
  "phone": "+998901234567",
  "code": "4521",
  "purpose": "login"
}
```

`code`: 4–6 characters

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g...",
  "user": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "phone": "+998901234567",
    "role": "SELLER",
    "isPhoneVerified": true
  }
}
```

**Errors:**
- `VALIDATION_ERROR`: invalid code format
- `OTP_INVALID`: wrong code
- `OTP_EXPIRED`: code has expired

---

### POST /api/v1/auth/refresh

**Auth:** not required
**Role:** public

**Request:**
```json
{
  "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2g..."
}
```

**Response 200:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiJ9...",
  "refreshToken": "bmV3UmVmcmVzaFRva2Vu..."
}
```

**Errors:**
- `UNAUTHORIZED`: token invalid or session expired

---

### POST /api/v1/auth/logout

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

## Seller Profile

### GET /api/v1/seller/me

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:**
```json
{
  "id": "sel-uuid-0001",
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "fullName": "Алишер Каримов",
  "sellerType": "individual",
  "telegramUsername": "@alisherkarimov",
  "languageCode": "ru",
  "isBlocked": false,
  "createdAt": "2026-01-15T08:00:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: seller profile does not exist for authenticated user

---

### PATCH /api/v1/seller/me

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "fullName": "Алишер Каримов",
  "sellerType": "individual",
  "telegramUsername": "@alisherkarimov",
  "languageCode": "ru"
}
```

All fields are optional.
`sellerType`: `"individual"` | `"business"`
`languageCode`: `"ru"` | `"uz"`
`telegramUsername`: `@handle` format, 3–32 characters, alphanumeric and underscores

**Response 200:** updated seller object (same shape as GET /seller/me)

**Errors:**
- `VALIDATION_ERROR`: invalid field values
- `NOT_FOUND`: seller profile not found

---

## Store Management

### GET /api/v1/seller/store

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:**
```json
{
  "id": "store-uuid-0001",
  "sellerId": "sel-uuid-0001",
  "name": "Texno Shop",
  "slug": "texno-shop",
  "description": "Электроника и гаджеты по лучшим ценам в Ташкенте",
  "city": "Ташкент",
  "region": "Ташкентская область",
  "telegramContactLink": "https://t.me/texnoshop",
  "status": "DRAFT",
  "logoMediaId": null,
  "coverMediaId": null,
  "primaryGlobalCategoryId": "cat-global-uuid-0003",
  "createdAt": "2026-01-15T08:00:00.000Z",
  "updatedAt": "2026-03-01T12:00:00.000Z"
}
```

`status`: `"DRAFT"` | `"PENDING_REVIEW"` | `"ACTIVE"` | `"REJECTED"` | `"SUSPENDED"`

**Errors:**
- `NOT_FOUND`: seller profile not found
- `STORE_NOT_FOUND`: store not yet created

---

### POST /api/v1/seller/store

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "name": "Texno Shop",
  "slug": "texno-shop",
  "description": "Электроника и гаджеты по лучшим ценам в Ташкенте",
  "city": "Ташкент",
  "region": "Ташкентская область",
  "telegramContactLink": "https://t.me/texnoshop"
}
```

`name`: required, 2–255 characters
`slug`: optional, auto-generated from name if omitted; lowercase letters, digits, hyphens only
`description`: optional, max 2000 characters
`city`: required, 2–100 characters
`region`: optional, max 100 characters
`telegramContactLink`: required

**Response 201:** created store object (same shape as GET /seller/store)

**Errors:**
- `VALIDATION_ERROR`: invalid field values
- `CONFLICT`: seller already has a store (one store per seller)

---

### PATCH /api/v1/seller/store

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "name": "Texno Shop Pro",
  "description": "Обновлённый ассортимент электроники",
  "city": "Самарканд",
  "region": "Самаркандская область",
  "telegramContactLink": "https://t.me/texnoshoppro",
  "logoMediaId": "media-uuid-0011",
  "coverMediaId": "media-uuid-0012",
  "primaryGlobalCategoryId": "cat-global-uuid-0003"
}
```

All fields are optional.
`logoMediaId` / `coverMediaId`: UUID of a confirmed Media record
`primaryGlobalCategoryId`: UUID from `GET /storefront/categories`

**Response 200:** updated store object

**Errors:**
- `VALIDATION_ERROR`: invalid field values
- `STORE_NOT_FOUND`: store not yet created

---

### POST /api/v1/seller/store/submit

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:** updated store object with `status: "PENDING_REVIEW"`

**Errors:**
- `STORE_NOT_FOUND`: store not yet created
- `VALIDATION_ERROR`: store is not in a submittable state (must be `DRAFT` or `REJECTED`)

---

### POST /api/v1/seller/store/publish

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:** updated store object with `status: "ACTIVE"`

**Errors:**
- `STORE_NOT_FOUND`: store not yet created
- `FORBIDDEN`: store has not been approved (feature flag `STORE_APPROVAL_REQUIRED`)

---

### POST /api/v1/seller/store/unpublish

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:** updated store object with `status: "DRAFT"`

**Errors:**
- `STORE_NOT_FOUND`: store not yet created

---

## Categories

### GET /api/v1/storefront/categories

**Auth:** not required
**Role:** public

**Request:** no params

**Response 200:**
```json
[
  {
    "id": "cat-global-uuid-0001",
    "name": "Электроника",
    "slug": "electronics",
    "iconUrl": "https://cdn.example.com/icons/electronics.svg",
    "sortOrder": 1
  },
  {
    "id": "cat-global-uuid-0002",
    "name": "Одежда",
    "slug": "clothing",
    "iconUrl": "https://cdn.example.com/icons/clothing.svg",
    "sortOrder": 2
  }
]
```

**Errors:** none

---

### GET /api/v1/seller/categories

**Auth:** required
**Role:** SELLER

**Request:** no params

**Response 200:**
```json
[
  {
    "id": "cat-store-uuid-0001",
    "storeId": "store-uuid-0001",
    "name": "Смартфоны",
    "sortOrder": 0,
    "createdAt": "2026-02-01T10:00:00.000Z"
  },
  {
    "id": "cat-store-uuid-0002",
    "storeId": "store-uuid-0001",
    "name": "Аксессуары",
    "sortOrder": 1,
    "createdAt": "2026-02-01T10:05:00.000Z"
  }
]
```

**Errors:**
- `NOT_FOUND`: seller profile not found
- `STORE_NOT_FOUND`: store not yet created

---

### POST /api/v1/seller/categories

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "name": "Наушники",
  "sortOrder": 2
}
```

`name`: required, max 100 characters
`sortOrder`: optional, integer >= 0, defaults to 0

**Response 201:** created category object

**Errors:**
- `VALIDATION_ERROR`: invalid fields
- `STORE_NOT_FOUND`: store not yet created

---

### PATCH /api/v1/seller/categories/:id

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "name": "Наушники и колонки",
  "sortOrder": 3
}
```

All fields are optional.

**Response 200:** updated category object

**Errors:**
- `NOT_FOUND`: category not found or does not belong to this store
- `VALIDATION_ERROR`: invalid fields

---

### DELETE /api/v1/seller/categories/:id

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: category not found or does not belong to this store
- `CONFLICT`: category has products assigned to it

---

## Products

### GET /api/v1/seller/products

**Auth:** required
**Role:** SELLER

**Request:**
Query params (all optional):
- `status`: `DRAFT` | `ACTIVE` | `ARCHIVED`
- `globalCategoryId`: UUID
- `storeCategoryId`: UUID

**Response 200:**
```json
[
  {
    "id": "prod-uuid-0001",
    "storeId": "store-uuid-0001",
    "title": "iPhone 15 Pro",
    "description": "Флагман Apple 2023 года",
    "basePrice": 13500000,
    "currencyCode": "UZS",
    "status": "ACTIVE",
    "isVisible": true,
    "sku": "APPL-IP15P-256",
    "globalCategoryId": "cat-global-uuid-0001",
    "storeCategoryId": "cat-store-uuid-0001",
    "createdAt": "2026-02-10T09:00:00.000Z",
    "updatedAt": "2026-03-10T11:00:00.000Z"
  }
]
```

**Errors:**
- `STORE_NOT_FOUND`: store not yet created

---

### POST /api/v1/seller/products

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "title": "iPhone 15 Pro",
  "description": "Флагман Apple 2023 года, 256 ГБ",
  "basePrice": 13500000,
  "currencyCode": "UZS",
  "globalCategoryId": "cat-global-uuid-0001",
  "storeCategoryId": "cat-store-uuid-0001",
  "isVisible": true,
  "sku": "APPL-IP15P-256"
}
```

`title`: required, max 200 characters
`basePrice`: required, integer >= 1 (in tiyin-equivalent or whole UZS — match your store convention)
`currencyCode`: optional, defaults to `"UZS"`
`globalCategoryId`: optional UUID
`storeCategoryId`: optional UUID
`isVisible`: optional, defaults to `true`
`sku`: optional, max 100 characters

**Response 201:** created product object (same shape as list item)

**Errors:**
- `VALIDATION_ERROR`: invalid fields
- `STORE_NOT_FOUND`: store not yet created

---

### GET /api/v1/seller/products/:id

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:** full product object (same shape as list item, may include variant count)

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store

---

### PATCH /api/v1/seller/products/:id

**Auth:** required
**Role:** SELLER

**Request:** any subset of CreateProduct fields:
```json
{
  "title": "iPhone 15 Pro Max",
  "basePrice": 15900000,
  "isVisible": false
}
```

**Response 200:** updated product object

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store
- `VALIDATION_ERROR`: invalid fields

---

### DELETE /api/v1/seller/products/:id

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store
- `CONFLICT`: product has active orders referencing it

---

### PATCH /api/v1/seller/products/:id/status

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "status": "ACTIVE"
}
```

`status`: `"DRAFT"` | `"ACTIVE"` | `"ARCHIVED"`

**Response 200:** updated product object

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store
- `VALIDATION_ERROR`: invalid status value

---

### GET /api/v1/seller/products/:id/variants

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:**
```json
[
  {
    "id": "var-uuid-0001",
    "productId": "prod-uuid-0001",
    "sku": "APPL-IP15P-256-BLK",
    "titleOverride": "Чёрный, 256 ГБ",
    "priceOverride": 13500000,
    "stockQuantity": 12,
    "isActive": true,
    "optionValueIds": ["opt-val-uuid-001", "opt-val-uuid-003"],
    "createdAt": "2026-02-10T09:05:00.000Z"
  }
]
```

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store

---

### POST /api/v1/seller/products/:id/variants

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "sku": "APPL-IP15P-256-BLK",
  "priceOverride": 13500000,
  "stockQuantity": 12,
  "isActive": true,
  "titleOverride": "Чёрный, 256 ГБ",
  "optionValueIds": ["opt-val-uuid-001", "opt-val-uuid-003"]
}
```

`sku`: required, max 100 characters
`stockQuantity`: required, integer >= 0
`priceOverride`: optional, overrides product `basePrice` for this variant
`isActive`: optional, defaults to `true`
`titleOverride`: optional, max 200 characters
`optionValueIds`: optional, array of UUIDs; immutable after creation

**Response 201:** created variant object

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist
- `FORBIDDEN`: product belongs to a different store
- `VALIDATION_ERROR`: invalid fields

---

### PATCH /api/v1/seller/products/:id/variants/:variantId

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "sku": "APPL-IP15P-256-WHT",
  "priceOverride": 13800000,
  "stockQuantity": 5,
  "isActive": true,
  "titleOverride": "Белый, 256 ГБ"
}
```

All fields optional. `optionValueIds` is excluded — options are immutable after variant creation.

**Response 200:** updated variant object

**Errors:**
- `PRODUCT_NOT_FOUND`: product not found or access denied
- `NOT_FOUND`: variant not found
- `VALIDATION_ERROR`: invalid fields

---

### DELETE /api/v1/seller/products/:id/variants/:variantId

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `PRODUCT_NOT_FOUND`: product not found or access denied
- `NOT_FOUND`: variant not found

---

### POST /api/v1/seller/products/:id/variants/:variantId/stock

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "delta": 20,
  "reason": "Получена новая партия"
}
```

`delta`: non-zero integer (positive = add stock, negative = remove stock)
`reason`: required, max 200 characters, used for audit trail

**Response 200:**
```json
{
  "id": "var-uuid-0001",
  "stockQuantity": 32,
  "updatedAt": "2026-03-21T10:00:00.000Z"
}
```

**Errors:**
- `PRODUCT_NOT_FOUND`: product not found or access denied
- `NOT_FOUND`: variant not found
- `VALIDATION_ERROR`: delta is 0
- `CONFLICT`: resulting stock would go below 0

---

## Media Upload

Upload flow: request presigned URL → PUT file directly to R2 → confirm upload.

### POST /api/v1/media/upload-url

**Auth:** required
**Role:** SELLER (or any authenticated user)

**Request:**
```json
{
  "mimeType": "image/jpeg",
  "purpose": "product_image",
  "sizeBytes": 524288
}
```

`mimeType`: `"image/jpeg"` | `"image/png"` | `"image/webp"` | `"application/pdf"`
`purpose`: `"product_image"` | `"seller_doc"` | `"store_logo"` | `"store_banner"`
`sizeBytes`: integer, 1 – 10485760 (10 MB)

**Response 201:**
```json
{
  "mediaId": "media-uuid-0011",
  "uploadUrl": "https://r2.example.com/uploads/media-uuid-0011?X-Amz-Signature=...",
  "expiresAt": "2026-03-21T10:15:00.000Z"
}
```

Use `uploadUrl` to PUT the file binary with the correct `Content-Type` header. The URL expires in ~15 minutes.

**Errors:**
- `VALIDATION_ERROR`: unsupported mimeType, purpose, or sizeBytes out of range

---

### POST /api/v1/media/:id/confirm

**Auth:** required
**Role:** SELLER (owner of the media record)

**Request:** no body

**Response 200:**
```json
{
  "id": "media-uuid-0011",
  "url": "https://cdn.example.com/uploads/media-uuid-0011.jpg",
  "mimeType": "image/jpeg",
  "purpose": "product_image",
  "status": "CONFIRMED",
  "confirmedAt": "2026-03-21T10:12:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: media record not found
- `FORBIDDEN`: media record belongs to a different user
- `CONFLICT`: media already confirmed or upload not yet completed on R2

---

### DELETE /api/v1/media/:id

**Auth:** required
**Role:** SELLER (owner of the media record)

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: media record not found
- `FORBIDDEN`: media record belongs to a different user

---

## Orders

### GET /api/v1/seller/orders

**Auth:** required
**Role:** SELLER

**Request:**
Query params (all optional):
- `status`: `PENDING` | `CONFIRMED` | `PROCESSING` | `SHIPPED` | `DELIVERED` | `CANCELLED` | `REFUNDED`
- `page`: integer >= 1, default `1`
- `limit`: integer 1–100, default `20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "order-uuid-0001",
      "storeId": "store-uuid-0001",
      "buyerId": "buyer-uuid-0001",
      "status": "PENDING",
      "totalAmount": 13500000,
      "currencyCode": "UZS",
      "deliveryAddress": {
        "street": "ул. Навои 15, кв. 3",
        "city": "Ташкент",
        "region": "Ташкентская область",
        "postalCode": "100000",
        "country": "UZ"
      },
      "buyerNote": "Позвоните перед доставкой",
      "deliveryFee": 25000,
      "createdAt": "2026-03-20T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 47
  }
}
```

**Errors:**
- `NOT_FOUND`: seller profile not found
- `SELLER_BLOCKED`: seller account is blocked
- `STORE_NOT_FOUND`: store not yet created

---

### GET /api/v1/seller/orders/:id

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:** full order object including line items:
```json
{
  "id": "order-uuid-0001",
  "storeId": "store-uuid-0001",
  "buyerId": "buyer-uuid-0001",
  "status": "PENDING",
  "totalAmount": 13500000,
  "currencyCode": "UZS",
  "deliveryAddress": {
    "street": "ул. Навои 15, кв. 3",
    "city": "Ташкент",
    "region": "Ташкентская область",
    "postalCode": "100000",
    "country": "UZ"
  },
  "buyerNote": "Позвоните перед доставкой",
  "deliveryFee": 25000,
  "items": [
    {
      "id": "item-uuid-0001",
      "productId": "prod-uuid-0001",
      "variantId": "var-uuid-0001",
      "title": "iPhone 15 Pro",
      "variantTitle": "Чёрный, 256 ГБ",
      "quantity": 1,
      "unitPrice": 13500000,
      "subtotal": 13500000
    }
  ],
  "createdAt": "2026-03-20T14:30:00.000Z",
  "updatedAt": "2026-03-20T14:30:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: order not found or does not belong to this store
- `SELLER_BLOCKED`: seller account is blocked

---

### PATCH /api/v1/seller/orders/:id/status

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "status": "CONFIRMED",
  "reason": "Товар в наличии, готов к отправке"
}
```

`status`: target order status; sellers can transition to `CONFIRMED`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`
`reason`: optional, required when cancelling (`CANCELLED`)

Valid seller transitions (see `docs/V1.1/02_state_machines.md` for full table):
- `PENDING` → `CONFIRMED`
- `CONFIRMED` → `PROCESSING`
- `PROCESSING` → `SHIPPED`
- `SHIPPED` → `DELIVERED`
- `PENDING` / `CONFIRMED` / `PROCESSING` → `CANCELLED`

**Response 200:** updated order object

**Errors:**
- `NOT_FOUND`: order not found or access denied
- `SELLER_BLOCKED`: seller account is blocked
- `VALIDATION_ERROR`: invalid status enum value
- `FORBIDDEN`: transition not allowed from current status

---

## Chat

### GET /api/v1/chat/threads

**Auth:** required
**Role:** SELLER

**Request:** no params

**Response 200:**
```json
[
  {
    "id": "thread-uuid-0001",
    "contextType": "ORDER",
    "contextId": "order-uuid-0001",
    "buyerId": "buyer-uuid-0001",
    "sellerId": "sel-uuid-0001",
    "status": "OPEN",
    "lastMessageAt": "2026-03-21T09:45:00.000Z",
    "unreadCount": 2,
    "lastMessage": {
      "id": "msg-uuid-0099",
      "text": "Когда будет доставка?",
      "senderRole": "BUYER",
      "createdAt": "2026-03-21T09:45:00.000Z"
    }
  }
]
```

**Errors:**
- `NOT_FOUND`: seller profile not found
- `SELLER_BLOCKED`: seller account is blocked

---

### GET /api/v1/chat/threads/:id/messages

**Auth:** required
**Role:** SELLER

**Request:**
Query params (all optional):
- `limit`: integer 1–100, default `50`
- `before`: UUID of a message — returns messages older than this cursor (for pagination)

**Response 200:**
```json
{
  "messages": [
    {
      "id": "msg-uuid-0001",
      "threadId": "thread-uuid-0001",
      "text": "Здравствуйте, хочу уточнить по заказу",
      "senderRole": "BUYER",
      "createdAt": "2026-03-21T09:30:00.000Z"
    },
    {
      "id": "msg-uuid-0002",
      "threadId": "thread-uuid-0001",
      "text": "Добрый день! Уточните пожалуйста что именно",
      "senderRole": "SELLER",
      "createdAt": "2026-03-21T09:35:00.000Z"
    }
  ],
  "hasMore": false
}
```

**Errors:**
- `NOT_FOUND`: thread not found
- `FORBIDDEN`: current user is not a participant in this thread

---

### POST /api/v1/chat/threads/:id/messages

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "text": "Ваш заказ отправлен, ожидайте доставку завтра"
}
```

`text`: required, max 2000 characters

**Response 201:**
```json
{
  "id": "msg-uuid-0100",
  "threadId": "thread-uuid-0001",
  "text": "Ваш заказ отправлен, ожидайте доставку завтра",
  "senderRole": "SELLER",
  "createdAt": "2026-03-21T10:00:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: thread not found
- `FORBIDDEN`: current user is not a participant
- `VALIDATION_ERROR`: empty or too-long text

---

### PATCH /api/v1/chat/threads/:id/resolve

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response 200:**
```json
{
  "id": "thread-uuid-0001",
  "status": "RESOLVED",
  "resolvedAt": "2026-03-21T10:05:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: thread not found
- `FORBIDDEN`: current user is not the seller participant or is blocked
- `CONFLICT`: thread is already resolved

---

## Notifications

### GET /api/v1/notifications/inbox

**Auth:** required
**Role:** SELLER

**Request:**
Query params (all optional):
- `unreadOnly`: `true` | `false`
- `page`: integer >= 1, default `1`
- `limit`: integer 1–100, default `20`

**Response 200:**
```json
{
  "data": [
    {
      "id": "notif-uuid-0001",
      "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Новый заказ",
      "body": "Поступил новый заказ #order-uuid-0001 на сумму 13 500 000 сум",
      "isRead": false,
      "createdAt": "2026-03-21T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 5
  }
}
```

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### GET /api/v1/notifications/inbox/unread-count

**Auth:** required
**Role:** SELLER

**Request:** no params

**Response 200:**
```json
{
  "count": 5
}
```

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### PATCH /api/v1/notifications/inbox/read-all

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### PATCH /api/v1/notifications/inbox/:id/read

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: notification not found
- `FORBIDDEN`: notification belongs to a different user

---

### DELETE /api/v1/notifications/inbox/:id

**Auth:** required
**Role:** SELLER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: notification not found
- `FORBIDDEN`: notification belongs to a different user

---

### GET /api/v1/notifications/preferences

**Auth:** required
**Role:** SELLER

**Request:** no params

**Response 200:**
```json
{
  "userId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "mobilePushEnabled": true,
  "webPushEnabled": true,
  "telegramEnabled": true
}
```

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### PUT /api/v1/notifications/preferences

**Auth:** required
**Role:** SELLER

**Request:**
```json
{
  "mobilePushEnabled": true,
  "webPushEnabled": false,
  "telegramEnabled": true
}
```

All fields optional. Only provided fields are updated (upsert).

**Response 200:** updated preferences object (same shape as GET)

**Errors:**
- `VALIDATION_ERROR`: non-boolean values
- `UNAUTHORIZED`: missing or invalid JWT
