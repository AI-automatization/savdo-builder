# API Contract — web-buyer

Base URL: `/api/v1`
All authenticated requests require: `Authorization: Bearer <accessToken>`

### Guest Cart Identity

Unauthenticated buyers use a session token stored in `localStorage` (a UUID generated client-side on first visit). Pass it via the `X-Session-Token` header on all cart requests. Upon login, call `POST /api/v1/cart/merge` to merge the guest cart into the authenticated buyer's cart.

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
    "id": "usr-uuid-buyer-0001",
    "phone": "+998901234567",
    "role": "BUYER",
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
**Role:** BUYER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

## Storefront — Browsing

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
    "name": "Одежда и обувь",
    "slug": "clothing",
    "iconUrl": "https://cdn.example.com/icons/clothing.svg",
    "sortOrder": 2
  },
  {
    "id": "cat-global-uuid-0003",
    "name": "Дом и сад",
    "slug": "home-garden",
    "iconUrl": "https://cdn.example.com/icons/home.svg",
    "sortOrder": 3
  }
]
```

**Errors:** none

---

### GET /api/v1/storefront/products

**Auth:** not required
**Role:** public

**Request:**
Query params:
- `storeId`: UUID — **required**
- `globalCategoryId`: UUID — optional filter
- `storeCategoryId`: UUID — optional filter

**Response 200:**
```json
[
  {
    "id": "prod-uuid-0001",
    "storeId": "store-uuid-0001",
    "title": "iPhone 15 Pro",
    "description": "Флагман Apple 2023 года, 256 ГБ",
    "basePrice": 13500000,
    "currencyCode": "UZS",
    "status": "ACTIVE",
    "isVisible": true,
    "globalCategoryId": "cat-global-uuid-0001",
    "storeCategoryId": "cat-store-uuid-0001",
    "mediaUrls": [
      "https://cdn.example.com/products/iphone15-front.jpg",
      "https://cdn.example.com/products/iphone15-back.jpg"
    ]
  },
  {
    "id": "prod-uuid-0002",
    "storeId": "store-uuid-0001",
    "title": "AirPods Pro 2",
    "description": "Беспроводные наушники с шумоподавлением",
    "basePrice": 3200000,
    "currencyCode": "UZS",
    "status": "ACTIVE",
    "isVisible": true,
    "globalCategoryId": "cat-global-uuid-0001",
    "storeCategoryId": "cat-store-uuid-0002",
    "mediaUrls": [
      "https://cdn.example.com/products/airpods-pro2.jpg"
    ]
  }
]
```

Only returns products with `status = ACTIVE` and `isVisible = true`.

**Errors:**
- `VALIDATION_ERROR`: `storeId` query param is missing

---

### GET /api/v1/storefront/products/:id

**Auth:** not required
**Role:** public

**Request:** no params

**Response 200:**
```json
{
  "id": "prod-uuid-0001",
  "storeId": "store-uuid-0001",
  "title": "iPhone 15 Pro",
  "description": "Флагман Apple 2023 года, 256 ГБ. Titanium корпус, камера 48 МП.",
  "basePrice": 13500000,
  "currencyCode": "UZS",
  "status": "ACTIVE",
  "isVisible": true,
  "sku": "APPL-IP15P-256",
  "globalCategoryId": "cat-global-uuid-0001",
  "storeCategoryId": "cat-store-uuid-0001",
  "store": {
    "id": "store-uuid-0001",
    "name": "Texno Shop",
    "slug": "texno-shop",
    "city": "Ташкент",
    "telegramContactLink": "https://t.me/texnoshop",
    "logoUrl": "https://cdn.example.com/stores/texno-shop-logo.jpg"
  },
  "variants": [
    {
      "id": "var-uuid-0001",
      "sku": "APPL-IP15P-256-BLK",
      "titleOverride": "Чёрный, 256 ГБ",
      "priceOverride": 13500000,
      "stockQuantity": 12,
      "isActive": true,
      "optionValueIds": ["opt-val-uuid-001", "opt-val-uuid-003"]
    },
    {
      "id": "var-uuid-0002",
      "sku": "APPL-IP15P-256-WHT",
      "titleOverride": "Белый, 256 ГБ",
      "priceOverride": 13800000,
      "stockQuantity": 0,
      "isActive": true,
      "optionValueIds": ["opt-val-uuid-002", "opt-val-uuid-003"]
    }
  ],
  "mediaUrls": [
    "https://cdn.example.com/products/iphone15-front.jpg",
    "https://cdn.example.com/products/iphone15-back.jpg"
  ],
  "createdAt": "2026-02-10T09:00:00.000Z"
}
```

**Errors:**
- `PRODUCT_NOT_FOUND`: product does not exist or is not publicly visible

---

## Cart

All cart endpoints accept either:
- `Authorization: Bearer <accessToken>` (authenticated buyer), or
- `X-Session-Token: <uuid>` (guest session)

If neither is provided the cart cannot be identified and mutation operations will fail.

### GET /api/v1/cart

**Auth:** optional
**Role:** public (guest or BUYER)

**Request:**
```
Headers:
  X-Session-Token: 550e8400-e29b-41d4-a716-446655440000   (guest only)
  Authorization: Bearer <token>                             (logged-in buyer)
```

**Response 200:**
```json
{
  "id": "cart-uuid-0001",
  "storeId": "store-uuid-0001",
  "items": [
    {
      "id": "item-uuid-0001",
      "productId": "prod-uuid-0001",
      "variantId": "var-uuid-0001",
      "quantity": 1,
      "unitPrice": 13500000,
      "subtotal": 13500000,
      "product": {
        "title": "iPhone 15 Pro",
        "mediaUrl": "https://cdn.example.com/products/iphone15-front.jpg"
      },
      "variant": {
        "titleOverride": "Чёрный, 256 ГБ",
        "stockQuantity": 12
      }
    }
  ],
  "totalAmount": 13500000,
  "currencyCode": "UZS"
}
```

Returns `null` or empty cart if no cart exists for the identity.

**Errors:**
- none (returns empty state instead of 404)

---

### POST /api/v1/cart/items

**Auth:** optional
**Role:** public (guest or BUYER)

**Request:**
```
Headers:
  X-Session-Token: 550e8400-e29b-41d4-a716-446655440000   (guest only)
```

```json
{
  "productId": "prod-uuid-0001",
  "variantId": "var-uuid-0001",
  "quantity": 2
}
```

`productId`: required UUID
`variantId`: optional UUID (required if product has variants)
`quantity`: integer 1–100

**Response 201:** updated cart object (same shape as GET /cart)

**Errors:**
- `VALIDATION_ERROR`: invalid fields or quantity out of range
- `PRODUCT_NOT_FOUND`: product not found or not publicly active
- `CART_STORE_MISMATCH`: buyer already has a cart for a different store (one store per cart, INV-C01)
- `INSUFFICIENT_STOCK`: requested quantity exceeds available stock

---

### PATCH /api/v1/cart/items/:itemId

**Auth:** optional
**Role:** public (guest or BUYER)

**Request:**
```
Headers:
  X-Session-Token: 550e8400-e29b-41d4-a716-446655440000   (guest only)
```

```json
{
  "quantity": 3
}
```

`quantity`: integer 1–100

**Response 200:** updated cart object

**Errors:**
- `CART_NOT_FOUND`: no active cart for this identity
- `NOT_FOUND`: cart item not found in this cart
- `VALIDATION_ERROR`: quantity out of range
- `INSUFFICIENT_STOCK`: requested quantity exceeds available stock

---

### DELETE /api/v1/cart/items/:itemId

**Auth:** optional
**Role:** public (guest or BUYER)

**Request:**
```
Headers:
  X-Session-Token: 550e8400-e29b-41d4-a716-446655440000   (guest only)
```

**Response:** `204 No Content`

**Errors:**
- `CART_NOT_FOUND`: no active cart for this identity
- `NOT_FOUND`: cart item not found in this cart

---

### DELETE /api/v1/cart

**Auth:** optional
**Role:** public (guest or BUYER)

Clears all items from the cart.

**Request:**
```
Headers:
  X-Session-Token: 550e8400-e29b-41d4-a716-446655440000   (guest only)
```

**Response:** `204 No Content`

**Errors:**
- none (idempotent)

---

### POST /api/v1/cart/merge

**Auth:** required
**Role:** BUYER

Call immediately after login to merge a guest cart into the authenticated buyer's cart.

**Request:**
```json
{
  "sessionKey": "550e8400-e29b-41d4-a716-446655440000"
}
```

`sessionKey`: UUID that was used as `X-Session-Token` while browsing as guest

**Response:** `204 No Content`

**Errors:**
- `UNAUTHORIZED`: buyer profile not found for authenticated user
- `VALIDATION_ERROR`: sessionKey is not a valid UUID
- `CART_STORE_MISMATCH`: guest cart and buyer cart are from different stores

---

## Checkout

Both checkout endpoints require an authenticated buyer (`BUYER` role).

### GET /api/v1/checkout/preview

**Auth:** required
**Role:** BUYER

Returns a summary of the current cart for review before placing the order. Use this to display an order summary page.

**Request:** no params

**Response 200:**
```json
{
  "storeId": "store-uuid-0001",
  "storeName": "Texno Shop",
  "items": [
    {
      "productId": "prod-uuid-0001",
      "variantId": "var-uuid-0001",
      "title": "iPhone 15 Pro",
      "variantTitle": "Чёрный, 256 ГБ",
      "quantity": 1,
      "unitPrice": 13500000,
      "subtotal": 13500000
    }
  ],
  "subtotal": 13500000,
  "currencyCode": "UZS",
  "stockWarnings": []
}
```

`stockWarnings`: array of item IDs where requested quantity exceeds current stock (buyer should adjust cart before confirming)

**Errors:**
- `UNAUTHORIZED`: buyer profile not found
- `CART_NOT_FOUND`: cart is empty or does not exist

---

### POST /api/v1/checkout/confirm

**Auth:** required
**Role:** BUYER

Places the order. Stock is reserved atomically at this point. Cart is cleared after success.

**Request:**
```json
{
  "deliveryAddress": {
    "street": "ул. Навои 15, кв. 3",
    "city": "Ташкент",
    "region": "Ташкентская область",
    "postalCode": "100000",
    "country": "UZ"
  },
  "buyerNote": "Позвоните перед доставкой",
  "deliveryFee": 25000
}
```

`deliveryAddress`: required object
  - `street`: required
  - `city`: required
  - `region`: optional
  - `postalCode`: optional
  - `country`: optional, defaults to `"UZ"`
`buyerNote`: optional, max 500 characters
`deliveryFee`: optional, integer >= 0 (in UZS)

Note: buyer phone must be verified (`isPhoneVerified: true`) before checkout is allowed. If unverified, first call `POST /auth/request-otp` with `purpose: "checkout"`.

**Response 201:**
```json
{
  "id": "order-uuid-0001",
  "storeId": "store-uuid-0001",
  "buyerId": "buyer-uuid-0001",
  "status": "PENDING",
  "totalAmount": 13525000,
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
  "createdAt": "2026-03-21T14:30:00.000Z"
}
```

**Errors:**
- `UNAUTHORIZED`: buyer profile not found or phone not verified
- `CART_NOT_FOUND`: cart is empty
- `VALIDATION_ERROR`: invalid delivery address fields
- `INSUFFICIENT_STOCK`: one or more items ran out of stock between preview and confirm (re-fetch preview)

---

## Orders

### GET /api/v1/buyer/orders

**Auth:** required
**Role:** BUYER

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
      "status": "CONFIRMED",
      "totalAmount": 13525000,
      "currencyCode": "UZS",
      "deliveryAddress": {
        "street": "ул. Навои 15, кв. 3",
        "city": "Ташкент",
        "region": "Ташкентская область",
        "postalCode": "100000",
        "country": "UZ"
      },
      "deliveryFee": 25000,
      "createdAt": "2026-03-20T14:30:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 3
  }
}
```

**Errors:**
- `UNAUTHORIZED`: buyer profile not found

---

### GET /api/v1/buyer/orders/:id

**Auth:** required
**Role:** BUYER

**Request:** no body

**Response 200:** full order with line items:
```json
{
  "id": "order-uuid-0001",
  "storeId": "store-uuid-0001",
  "status": "CONFIRMED",
  "totalAmount": 13525000,
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
  "store": {
    "name": "Texno Shop",
    "telegramContactLink": "https://t.me/texnoshop"
  },
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
  "updatedAt": "2026-03-20T15:10:00.000Z"
}
```

**Errors:**
- `UNAUTHORIZED`: buyer profile not found
- `NOT_FOUND`: order not found or does not belong to this buyer

---

### PATCH /api/v1/buyer/orders/:id/status

**Auth:** required
**Role:** BUYER

Buyers can only cancel orders. Any other status value is rejected.

**Request:**
```json
{
  "status": "CANCELLED",
  "reason": "Нашёл дешевле в другом магазине"
}
```

`status`: must be `"CANCELLED"` — only allowed transition for buyers
`reason`: optional, max 500 characters

Valid buyer transitions:
- `PENDING` → `CANCELLED`
- `CONFIRMED` → `CANCELLED`

**Response 200:** updated order object

**Errors:**
- `UNAUTHORIZED`: buyer profile not found
- `NOT_FOUND`: order not found or does not belong to this buyer
- `FORBIDDEN`: status is not `CANCELLED` (buyers may only cancel)
- `VALIDATION_ERROR`: invalid status enum value
- `CONFLICT`: order is already in a terminal state (`DELIVERED`, `CANCELLED`, `REFUNDED`) or has been shipped (`SHIPPED`)

---

## Chat

### GET /api/v1/chat/threads

**Auth:** required
**Role:** BUYER

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
    "unreadCount": 1,
    "lastMessage": {
      "id": "msg-uuid-0100",
      "text": "Ваш заказ отправлен, ожидайте доставку завтра",
      "senderRole": "SELLER",
      "createdAt": "2026-03-21T09:45:00.000Z"
    }
  }
]
```

**Errors:**
- `BUYER_NOT_IDENTIFIED`: buyer profile not found for authenticated user

---

### POST /api/v1/chat/threads

**Auth:** required
**Role:** BUYER

Opens a new chat thread linked to a product or order. Only buyers can create threads.

**Request:**
```json
{
  "contextType": "ORDER",
  "contextId": "order-uuid-0001",
  "firstMessage": "Здравствуйте, хочу уточнить срок доставки"
}
```

`contextType`: `"PRODUCT"` | `"ORDER"`
`contextId`: UUID of the product or order
`firstMessage`: required, max 2000 characters

**Response 201:**
```json
{
  "id": "thread-uuid-0002",
  "contextType": "ORDER",
  "contextId": "order-uuid-0001",
  "buyerId": "buyer-uuid-0001",
  "sellerId": "sel-uuid-0001",
  "status": "OPEN",
  "createdAt": "2026-03-21T10:00:00.000Z"
}
```

**Errors:**
- `BUYER_NOT_IDENTIFIED`: buyer profile not found
- `NOT_FOUND`: product or order not found for given contextId
- `VALIDATION_ERROR`: invalid contextType or empty firstMessage
- `CONFLICT`: a thread for this context already exists

---

### GET /api/v1/chat/threads/:id/messages

**Auth:** required
**Role:** BUYER

**Request:**
Query params (all optional):
- `limit`: integer 1–100, default `50`
- `before`: UUID — returns messages older than this message ID (cursor pagination)

**Response 200:**
```json
{
  "messages": [
    {
      "id": "msg-uuid-0001",
      "threadId": "thread-uuid-0001",
      "text": "Здравствуйте, хочу уточнить срок доставки",
      "senderRole": "BUYER",
      "createdAt": "2026-03-21T09:30:00.000Z"
    },
    {
      "id": "msg-uuid-0002",
      "threadId": "thread-uuid-0001",
      "text": "Доставка будет 22 марта, с 10 до 18",
      "senderRole": "SELLER",
      "createdAt": "2026-03-21T09:40:00.000Z"
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
**Role:** BUYER

**Request:**
```json
{
  "text": "Хорошо, буду ждать. Спасибо!"
}
```

`text`: required, max 2000 characters

**Response 201:**
```json
{
  "id": "msg-uuid-0003",
  "threadId": "thread-uuid-0001",
  "text": "Хорошо, буду ждать. Спасибо!",
  "senderRole": "BUYER",
  "createdAt": "2026-03-21T09:50:00.000Z"
}
```

**Errors:**
- `NOT_FOUND`: thread not found
- `FORBIDDEN`: current user is not a participant in this thread
- `VALIDATION_ERROR`: empty or too-long text

---

## Notifications

### GET /api/v1/notifications/inbox

**Auth:** required
**Role:** BUYER

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
      "id": "notif-uuid-0010",
      "userId": "usr-uuid-buyer-0001",
      "title": "Статус заказа обновлён",
      "body": "Ваш заказ #order-uuid-0001 подтверждён продавцом и готовится к отправке",
      "isRead": false,
      "createdAt": "2026-03-21T15:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1
  }
}
```

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### GET /api/v1/notifications/inbox/unread-count

**Auth:** required
**Role:** BUYER

**Request:** no params

**Response 200:**
```json
{
  "count": 1
}
```

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### PATCH /api/v1/notifications/inbox/read-all

**Auth:** required
**Role:** BUYER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `UNAUTHORIZED`: missing or invalid JWT

---

### PATCH /api/v1/notifications/inbox/:id/read

**Auth:** required
**Role:** BUYER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: notification not found
- `FORBIDDEN`: notification belongs to a different user

---

### DELETE /api/v1/notifications/inbox/:id

**Auth:** required
**Role:** BUYER

**Request:** no body

**Response:** `204 No Content`

**Errors:**
- `NOT_FOUND`: notification not found
- `FORBIDDEN`: notification belongs to a different user
