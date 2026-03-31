# Web — Завершённые задачи

## Phase A — UI (mock данные) ✅

| Дата | Задача | Примечание |
|------|--------|------------|
| 28-29 мар 2026 | Инициализировать apps/web-buyer (Next.js 16, App Router) | Tailwind + DaisyUI v5 |
| 28-29 мар 2026 | Инициализировать apps/web-seller (Next.js 16, App Router) | Glassmorphism дизайн |
| 28-29 мар 2026 | Landing page web-buyer | Hero, поиск по slug, features |
| 28-29 мар 2026 | Storefront `/:slug` — витрина магазина | Категории, фильтры, mock данные |
| 28-29 мар 2026 | Страница товара `/:slug/products/:id` | Glassmorphism, варианты |
| 28-29 мар 2026 | Корзина `/cart` | Полная логика на клиенте (mock) |
| 28-29 мар 2026 | Чекаут `/checkout` | Форма + success экран |
| 28-29 мар 2026 | Страница заказа `/orders/:id` | Status progress bar |
| 28-29 мар 2026 | Заглушки `/orders`, `/profile` | Placeholder страницы |
| 28-29 мар 2026 | Seller: Login `/login` | OTP форма (только UI) |
| 28-29 мар 2026 | Seller: Dashboard `/dashboard` | Метрики, mock |
| 28-29 мар 2026 | Seller: Products `/products` | Таблица, mock |
| 28-29 мар 2026 | Seller: Orders `/orders` | Таблица, mock |
| 28-29 мар 2026 | Seller: Chat `/chat` | UI, mock |
| 28-29 мар 2026 | Seller: Settings `/settings` | Форма, mock |

## Phase B — API Layer ✅

| Дата | Задача | Примечание |
|------|--------|------------|
| 30 мар 2026 | axios client + JWT interceptors (web-buyer) | Auto-refresh на 401, queue parallel requests |
| 30 мар 2026 | axios client + JWT interceptors (web-seller) | Аналогично |
| 30 мар 2026 | Auth token storage (web-buyer) | accessToken, refreshToken, guest sessionToken |
| 30 мар 2026 | Auth token storage (web-seller) | accessToken, refreshToken |
| 30 мар 2026 | AuthContext + AuthProvider (web-buyer) | login/logout + cart merge при логине |
| 30 мар 2026 | AuthContext + AuthProvider (web-seller) | login/logout |
| 30 мар 2026 | TanStack Query provider (оба приложения) | QueryClient подключён в layout |
| 30 мар 2026 | API functions web-buyer | auth, storefront, cart, checkout, orders |
| 30 мар 2026 | API functions web-seller | auth, seller profile/store, products, orders |
| 30 мар 2026 | TanStack Query hooks web-buyer | use-auth, use-storefront, use-cart, use-checkout, use-orders |
| 30 мар 2026 | TanStack Query hooks web-seller | use-auth, use-seller, use-products, use-orders |
| 31 мар 2026 | Seller login подключён к реальному API | useRequestOtp + useVerifyOtp, редирект на /dashboard |
| 01 апр 2026 | Seller dashboard подключён к реальному API | useStore + useSellerOrders, loading skeletons, live метрики |
| 01 апр 2026 | Seller products подключён к реальному API | useSellerProducts, empty state, loading skeletons |
| 01 апр 2026 | Buyer storefront `/:slug` подключён к реальному API | Server component, serverGetStoreBySlug + serverGetProducts, реальные категории, notFound() при 404 |
| 01 апр 2026 | Buyer product page `/:slug/products/:id` подключён к API | useProduct + useAddToCart, variant selector, image gallery с next/image |
| 01 апр 2026 | ProductCard мигрирован на ProductListItem из packages/types | next/image, реальные данные |
| 01 апр 2026 | storefront-server.ts — server-side fetch helpers | Без axios, ISR revalidate: 30s |
| 01 апр 2026 | useStoreBySlug hook добавлен | use-storefront.ts |
| 01 апр 2026 | GET /storefront/stores/:slug добавлен в контракт | docs/contracts/web-buyer.md |

**Ветка:** `feature/api-layer` (worktree `.worktrees/api-layer`) — запушена на GitHub
