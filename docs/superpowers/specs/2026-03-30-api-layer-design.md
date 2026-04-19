# API Layer Design — web-buyer & web-seller

**Date:** 2026-03-30
**Author:** Азим
**Scope:** Phase B — API integration layer for both web apps

---

## Decisions

| Decision | Choice | Reason |
|---|---|---|
| Location | Separate in each app | Different roles, different token flow, different endpoints |
| HTTP client | axios | JWT interceptors and X-Session-Token logic are much simpler |
| Token storage | accessToken in memory, refreshToken in localStorage | Balance of security and session persistence |
| Data fetching | TanStack Query | Already in tech stack; caching, auto-refetch, clean components |

---

## Architecture

### Data Flow

```
Component
  → hooks/*.ts        (TanStack Query: useQuery / useMutation)
  → api/*.ts          (plain async functions)
  → lib/axios.ts      (axios instance with interceptors)
  → auth-context.tsx  (token storage and user state)
```

Each layer has a single responsibility and can be understood independently.

---

## File Structure

### web-buyer

```
apps/web-buyer/src/lib/
  axios.ts
  auth-context.tsx
  query-keys.ts
  api/
    auth.ts           # requestOtp, verifyOtp, refresh, logout
    storefront.ts     # getCategories, getProducts, getProduct
    cart.ts           # getCart, addItem, updateItem, removeItem, clearCart, merge
    checkout.ts       # getPreview, confirmOrder
    orders.ts         # getOrders, getOrder, cancelOrder
    chat.ts           # getThreads, createThread, getMessages, sendMessage
    notifications.ts  # getInbox, getUnreadCount, markRead, markAllRead, deleteNotif
  hooks/
    useAuth.ts
    useStorefront.ts
    useCart.ts
    useCheckout.ts
    useOrders.ts
    useChat.ts
    useNotifications.ts
```

### web-seller

```
apps/web-seller/src/lib/
  axios.ts
  auth-context.tsx
  query-keys.ts
  api/
    auth.ts           # requestOtp, verifyOtp, refresh, logout
    seller.ts         # getMe, updateMe
    store.ts          # getStore, createStore, updateStore, submit, publish, unpublish
    categories.ts     # getGlobalCategories, getStoreCategories, create, update, delete
    products.ts       # getProducts, getProduct, create, update, delete, updateStatus
    variants.ts       # getVariants, createVariant, updateVariant, deleteVariant, updateStock
    orders.ts         # getOrders, getOrder, updateOrderStatus
    chat.ts           # getThreads, getMessages, sendMessage, resolveThread
    notifications.ts  # getInbox, getUnreadCount, markRead, markAllRead, getPrefs, updatePrefs
    media.ts          # getUploadUrl, confirmUpload, deleteMedia
    analytics.ts      # getSummary
  hooks/
    useAuth.ts
    useSellerProfile.ts
    useStore.ts
    useCategories.ts
    useProducts.ts
    useVariants.ts
    useOrders.ts
    useChat.ts
    useNotifications.ts
    useMedia.ts
    useAnalytics.ts
```

---

## axios.ts

One axios instance per app.

```
baseURL: process.env.NEXT_PUBLIC_API_URL
```

**Request interceptor:**
- Attaches `Authorization: Bearer <accessToken>` from memory (ref/closure) if token exists
- web-buyer only: always attaches `X-Session-Token` from localStorage if present (server uses Authorization first, falls back to session token — both headers can coexist)

**Response interceptor (401 handling):**
1. Read refreshToken from localStorage
2. Call `POST /api/v1/auth/refresh`
3. Store new accessToken in memory, new refreshToken in localStorage
4. Retry the original request
5. If refresh also returns 401 → call `logout()` → redirect to `/login`

**Queue mechanism:** If multiple requests fail with 401 simultaneously, queue them and replay all after a single refresh call.

---

## auth-context.tsx

```typescript
interface AuthContext {
  user: User | null
  isLoading: boolean        // true while checking token on mount
  login(tokens: Tokens, user: User): void
  logout(): void
}
```

**On mount:** If refreshToken exists in localStorage → call `POST /auth/refresh` to restore session. Set `isLoading: false` after.

**login():** Store accessToken in memory ref, refreshToken in localStorage, set user in state.

**logout():** Clear memory ref, clear localStorage, set user to null, redirect to `/login`.

---

## api/*.ts

Plain async functions. No React, no hooks. Accept typed params, return typed responses.

```typescript
// example: api/cart.ts
export async function getCart(): Promise<Cart> {
  const { data } = await apiClient.get('/cart')
  return data
}

export async function addItem(payload: AddItemPayload): Promise<Cart> {
  const { data } = await apiClient.post('/cart/items', payload)
  return data
}
```

Types come from `packages/types` where available (read-only for Азим). If a type is missing, define it locally in `lib/types.ts` and report to Полатр to add it to the shared package.

---

## hooks/*.ts

TanStack Query wrappers. Import api functions, define cache keys from `query-keys.ts`.

```typescript
// example: hooks/useCart.ts
export function useCart() {
  return useQuery({ queryKey: KEYS.cart, queryFn: getCart })
}

export function useAddToCart() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: addItem,
    onSuccess: () => qc.invalidateQueries({ queryKey: KEYS.cart }),
  })
}
```

---

## query-keys.ts

Strict constants to avoid typos during cache invalidation.

```typescript
// web-buyer example
export const KEYS = {
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (id: string) => ['orders', id] as const,
  products: (storeId: string) => ['products', storeId] as const,
  product: (id: string) => ['product', id] as const,
  threads: ['threads'] as const,
  messages: (threadId: string) => ['messages', threadId] as const,
  notifications: ['notifications'] as const,
  unreadCount: ['notifications', 'unread'] as const,
}
```

---

## QueryClient setup

One `QueryClientProvider` in each app's root `layout.tsx`.

```typescript
// Must be a Client Component wrapper
'use client'
const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000 } }
})
```

---

## Dependencies to install

Both apps:
```
axios
@tanstack/react-query
```

---

## Out of scope

- Socket.IO / real-time chat integration (Phase C)
- Optimistic updates (add after backend is stable)
- Error boundary / toast notifications wiring (separate task)
