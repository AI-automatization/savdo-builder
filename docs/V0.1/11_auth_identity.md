# 11_auth_identity.md

## 1. Authentication and Identity Overview

Auth и identity layer в этом проекте — это не просто “вход в систему”, а фундамент всей продуктовой модели.

Он должен поддерживать одновременно несколько разных сценариев:

- buyer browsing without hard registration wall
- guest-like checkout with identity binding
- seller onboarding and verified access
- superadmin access with elevated control
- multi-platform sessions across web and mobile
- secure access to chats, orders, products and admin actions

На V0.1 auth-система должна быть достаточно зрелой для production MVP, но без избыточной enterprise-сложности.

---

## 2. Main Goals

Основные цели auth/identity слоя:

- минимизировать friction для buyer-а
- обеспечить устойчивую identity для orders, chats и notifications
- дать seller-у простой, но контролируемый onboarding
- отделить admin security perimeter от buyer/seller surfaces
- поддержать web и mobile session lifecycle
- обеспечить основу для future scaling and permissions

---

## 3. Supported Actor Types

Система на V0.1 поддерживает следующие actor types:

- anonymous buyer
- identified buyer
- seller
- admin (superadmin)

## 3.1 Anonymous Buyer
Пользователь, который:
- смотрит store/product pages
- выбирает товары
- добавляет в cart
- ещё не прошёл phone-based identity confirmation

## 3.2 Identified Buyer
Покупатель, у которого уже есть lightweight identity:
- phone confirmed
- buyer profile created or linked
- can access orders
- can use chat
- can receive notifications

## 3.3 Seller
Продавец, который:
- входит через phone-based auth
- имеет seller profile
- проходит verification
- управляет store/products/orders/chat

## 3.4 Admin
Superadmin с отдельным доступом к admin panel и elevated authorization rules.

---

## 4. Identity Philosophy

## 4.1 Buyer Should Not Face Heavy Registration
Buyer не должен упираться в тяжёлую регистрацию до того, как увидел ценность продукта.

Поэтому модель строится так:
- browse first
- identify later at meaningful moment
- preserve continuity after identity creation

## 4.2 Seller Must Be Controlled
Seller onboarding должен быть быстрее, чем традиционный бизнес onboarding, но без полной бесконтрольности.

## 4.3 Admin Must Be Isolated
Admin auth нельзя смешивать с обычным seller/buyer flow на уровне surface и security behavior.

## 4.4 Backend Is Source of Truth
Frontend only reflects auth state.  
Настоящая авторизация и permission model всегда на backend.

---

## 5. Authentication Methods

## 5.1 Primary Method on V0.1
Основной метод auth:
- phone-based authentication via OTP

Это применяется для:
- buyer identity creation at checkout / lightweight access
- seller login
- admin login only if policy chooses unified phone auth

## 5.2 Why Phone-First
Для текущего рынка и продукта phone-based flow лучше подходит, чем email-first:
- ниже friction
- лучше совпадает с local user habits
- ближе к operational communication model

## 5.3 Email
Email не является обязательной частью identity system на V0.1.

Он может существовать как optional field in profile, но не как core auth factor.

---

## 6. Buyer Identity Model

## 6.1 Buyer Journey
Buyer path должен выглядеть так:

1. anonymous browsing
2. add to cart
3. proceed to checkout
4. confirm phone / create identity
5. place order
6. gain access to order history and chat

## 6.2 Lightweight Identity
После подтверждения phone system:
- creates user with buyer role context
- creates buyer profile if needed
- binds current cart/session to buyer
- allows persistent order/chat access

## 6.3 Why This Matters
Без устойчивой identity невозможно нормально реализовать:
- order history
- unread chats
- push notifications
- order status tracking

---

## 7. Seller Identity Model

## 7.1 Seller Journey
Seller path должен выглядеть так:

1. enter phone
2. verify OTP
3. create/get seller identity
4. fill seller profile
5. create store
6. upload required docs
7. submit for review
8. after approval → public store and full operations

## 7.2 Seller Identity vs Seller Activation
Важно разделять:
- authenticated seller
- approved/public seller

Seller может войти в систему и работать над onboarding до того, как магазин станет public.

## 7.3 Benefit
Это снижает friction, но сохраняет контроль публикации.

---

## 8. Admin Identity Model

## 8.1 Separate Surface
Admin должен иметь отдельную login surface и отдельные guard rules.

## 8.2 Superadmin Only
На V0.1 поддерживается только:
- superadmin

Но identity layer уже должен оставлять возможность на будущее:
- more admin roles
- permission matrix
- elevated audit tracking

## 8.3 Security Principle
Даже если admin internally uses same users table, operationally:
- admin auth flow separate
- admin route protection separate
- admin audit stronger

---

## 9. OTP Authentication Design

## 9.1 OTP Purpose
OTP используется для:
- register/login
- buyer identity confirmation
- session recovery where needed

## 9.2 OTP Flow
Canonical flow:

1. client requests OTP for phone + purpose
2. backend validates rate limits
3. backend generates code
4. code stored hashed with expiry
5. code delivered by provider or dev-mode mechanism
6. client submits code
7. backend validates code + purpose + expiry
8. backend creates session or completes identity step

## 9.3 OTP Security Requirements
- short expiration
- limited attempts
- rate limiting by phone/ip/device context where possible
- hashed storage of code
- one-time consumption

## 9.4 No Permanent Trust in OTP Request
Requesting OTP does not mean authentication succeeded.
Only successful verification creates authenticated state.

---

## 10. Session Model

## 10.1 Recommended Token Strategy
Use:
- short-lived access token
- longer-lived refresh token
- refresh token rotation
- stored session record in database

## 10.2 Why This Model
It provides:
- good mobile/web support
- manageable revocation
- multi-device support
- better operational control than single long-lived token

## 10.3 Session Storage
Backend should persist:
- session id
- refresh token hash
- user id
- device metadata
- last seen
- expiration

---

## 11. Access Token Strategy

## 11.1 Purpose
Access token is used for:
- authenticated API requests
- websocket handshake auth
- route access where needed

## 11.2 Principles
- short TTL
- signed securely
- contains only necessary claims
- no excessive payload

## 11.3 Recommended Claims
- user id
- actor role
- session id
- maybe verification flags if safe and useful

Do not overload token with mutable business state.

---

## 12. Refresh Token Strategy

## 12.1 Purpose
Refresh token allows session continuation without frequent re-login.

## 12.2 Requirements
- stored hashed in backend
- rotated on refresh
- revocable per session/device
- invalidated on logout

## 12.3 Why Hash Refresh Tokens
If DB leaks or token store compromised, unhashed refresh tokens create huge risk.

---

## 13. Multi-Device Sessions

## 13.1 Supported Behavior
User may be logged in from:
- mobile
- web
- multiple browsers/devices

## 13.2 Required Capabilities
- separate session records
- independent revocation
- last seen tracking
- sane concurrent usage

## 13.3 Example Scenarios
Seller can:
- use web dashboard on laptop
- use seller mobile app simultaneously

Buyer can:
- browse on web
- later check order in app

Session model must support this cleanly.

---

## 14. Session Revocation

## 14.1 Required Actions
System should support:
- logout current session
- logout all sessions optional later
- force revoke on suspicious auth change
- revoke session on admin action if necessary

## 14.2 Effects
Revoked session:
- no longer refreshes
- current access token expires naturally or is denied if introspection used
- websocket reconnect fails

---

## 15. Buyer Anonymous Session

## 15.1 Anonymous Browsing State
Before identity, buyer may still have:
- cart state
- storefront browsing
- language preference
- lightweight session key

## 15.2 Session Key Role
Anonymous session key can bind:
- cart
- pre-checkout state
- viewed store context

## 15.3 Identity Upgrade — Canonical Flow

Это критичный технический flow. Реализуется строго в следующем порядке:

1. Покупатель бродит анонимно, cart создаётся с `session_key` (UUID в localStorage/cookie), `buyer_id = null`
2. На checkout — отправляет телефон, получает OTP
3. После верификации OTP:
   a. Ищем существующего user с этим phone → если есть, берём его buyer profile
   b. Если нет → создаём нового user (role=buyer) + buyer profile
4. **Cart migration:** находим cart по `session_key` → обновляем `buyer_id = buyer.id`, `session_key = null`
   - если у buyer уже есть активная cart (повторный визит) → merge: items из анонимной cart переносятся в существующую, анонимная cart помечается `converted`
5. Выдаём access token + refresh token для buyer
6. Checkout продолжается уже с authenticated buyer

**Правила merge cart:**
- если один и тот же variant уже есть в обеих cart → берём бОльшее quantity
- если store_id не совпадает между cart-ами → предупреждаем buyer, используем ту что была инициирована на checkout (приоритет текущей)

**Session key:**
- генерируется на клиенте при первом добавлении в cart
- хранится в localStorage (web) / AsyncStorage (mobile)
- передаётся в каждом cart API запросе как header или cookie
- уничтожается после успешного identity upgrade

---

## 16. Route-Level Auth Model

## 16.1 Public Routes
Accessible without authentication:
- storefront pages
- product pages
- anonymous cart access
- public store metadata

## 16.2 Buyer-Protected Routes
Require identified buyer:
- orders
- order detail
- chat thread access
- profile and saved addresses

## 16.3 Seller-Protected Routes
Require authenticated seller:
- dashboard
- products
- store settings
- orders
- seller chat

## 16.4 Admin-Protected Routes
Require authenticated admin:
- all admin panel routes
- moderation actions
- audit visibility
- operational control endpoints

---

## 17. Authorization Model

## 17.1 Role Is Not Enough
Нельзя ограничиться только role checks.

Нужно проверять:
- ownership
- entity relationship
- verification status
- suspension/block state
- action policy

## 17.2 Examples
Seller cannot edit any product just because role = seller.  
Seller can edit only products belonging to own store.

Buyer cannot open any order.  
Buyer can open only own order.

Admin can inspect any domain because elevated policy allows it.

---

## 18. Seller Activation and Verification States

## 18.1 Required Seller States
Seller identity must support at least:
- authenticated but incomplete
- pending verification
- under review
- approved
- rejected
- blocked

## 18.2 Store Publication Dependency
Public store visibility depends not just on auth, but on:
- seller profile completeness
- required docs
- store data completeness
- moderation approval

## 18.3 Important Principle
Auth success != permission to sell publicly

---

## 19. User Status Model

## 19.1 Recommended Statuses
At base user/seller level useful statuses may include:
- active
- suspended
- blocked
- pending_verification

## 19.2 Behavior
Status affects:
- login access
- protected route access
- ability to create/update resources
- ability to receive/store notifications if needed

---

## 20. Admin Authorization Rules

## 20.1 Superadmin on V0.1
Single role, but authorization still should be explicit.

## 20.2 Protected Actions
Admin-only actions include:
- approve/reject seller
- suspend store
- hide product
- inspect chats
- view audit logs
- alter operational states

## 20.3 Audit Requirement
Destructive and sensitive admin actions must be auditable regardless of auth success.

---

## 21. Web Auth Handling

## 21.1 Buyer Web
Buyer web should allow public browsing and delayed identity binding.

## 21.2 Seller Web
Seller web should use protected routes and redirect unauthorized users cleanly.

## 21.3 Recommended Web Strategy
Depending on architecture:
- secure cookie for refresh token
- access token managed client-side or via controlled auth pattern
- route middleware for protected pages
- session refresh flow handled centrally

---

## 22. Mobile Auth Handling

## 22.1 Mobile Requirements
Mobile must support:
- persistent login
- silent refresh
- secure token storage
- logout and invalidation
- websocket auth reuse

## 22.2 Recommended Storage
- refresh token in secure storage
- access token in memory
- limited session metadata locally

## 22.3 App Resume Behavior
On app resume:
- validate/refresh session if needed
- reconnect websocket
- restore authenticated state gracefully

---

## 23. WebSocket Authentication

## 23.1 Need
Realtime layer must not trust unauthenticated sockets.

## 23.2 Flow
- access token sent in handshake
- backend validates token
- socket gets user context
- user joins appropriate rooms

## 23.3 Failure Behavior
Invalid token:
- deny connection
- prompt client re-auth/refresh logic

---

## 24. Protected Resource Access

## 24.1 Buyer Resources
- own orders
- own chats
- own addresses
- own notification preferences

## 24.2 Seller Resources
- own store
- own products
- own orders
- own chats
- own documents and settings

## 24.3 Admin Resources
- broad cross-domain access
- protected by admin guards and audit requirements

---

## 25. Phone Verification Logic

## 25.1 Verified Phone as Trust Anchor
Phone verification is central to identity trust on V0.1.

## 25.2 Usage
Verified phone affects:
- buyer persistent identity
- seller onboarding validity
- notification routing confidence
- account recovery assumptions

## 25.3 Phone Reuse Policy
System should define behavior for:
- repeated login on same phone
- buyer identity becoming seller later
- seller and buyer contexts under same base user

Recommended principle:
one base user can own different role-specific profiles if product model needs it, but V0.1 should keep this logic explicit and controlled.

---

## 26. Recommended Identity Relationship Model

## 26.1 Base User
A common `users` table acts as root identity.

## 26.2 Role-Specific Profiles
Role-specific tables:
- buyers
- sellers
- admin_users

## 26.3 Why This Model
It provides:
- shared auth/session infrastructure
- clear domain separation
- easier future expansion
- flexible multi-role support if needed

---

## 27. Account Linking and Upgrade Paths

## 27.1 Buyer Upgrade
Anonymous session → identified buyer

## 27.2 Seller Onboarding
Authenticated base user → seller profile + store onboarding

## 27.3 Future Possibility
Same phone/user could later become both buyer and seller, but policy must be explicit.
V0.1 can support this structurally even if UX remains simple.

---

## 28. Security Controls

## 28.1 Required Controls
- OTP rate limiting
- hashed OTP storage
- hashed refresh tokens
- short-lived access tokens
- protected admin surface
- ownership checks
- logout invalidation
- device/session records
- sensitive action audit logs

## 28.2 Strongly Recommended
- request throttling on auth endpoints
- IP/device heuristics where feasible
- abuse detection later
- suspicious login handling later

---

## 29. Error Handling

## 29.1 Auth Error Types
System should distinguish:
- invalid OTP
- expired OTP
- too many attempts
- invalid session
- refresh token revoked
- unauthorized access
- forbidden action
- blocked account
- seller not approved for operation

## 29.2 UX Principle
Errors should be actionable and clear:
- retry OTP
- login again
- contact support/admin
- complete onboarding

---

## 30. Localization

Auth and identity flows must support:
- Uzbek
- Russian

This includes:
- OTP screens
- error messages
- verification status messages
- seller onboarding blockers
- admin auth errors where relevant

---

## 31. Testing Priorities

## 31.1 Critical Buyer Flows
- anonymous cart creation
- buyer phone verification at checkout
- cart binding after identity creation
- order access after identity creation

## 31.2 Critical Seller Flows
- seller login via OTP
- incomplete onboarding gating
- approved seller full access
- blocked seller denial
- rejected seller state visibility

## 31.3 Critical Admin Flows
- admin login
- protected route enforcement
- destructive action permission checks

## 31.4 Security Cases
- expired OTP
- wrong OTP
- refresh token reuse
- revoked session
- unauthorized websocket connect
- seller trying to access чужой resource
- buyer trying to access чужой order

---

## 32. Final Auth and Identity Rules

- phone-based auth is the primary identity path on V0.1
- buyer experience should remain low-friction and guest-like until meaningful commitment
- seller auth and seller activation are different things
- admin access must be isolated and stronger
- role checks alone are not enough; ownership and policy checks are mandatory
- refresh-token-based sessions with rotation are required
- websocket auth must be first-class
- phone verification is the core trust anchor
- backend is the only source of truth for permissions and identity state

Главная цель auth/identity слоя:
дать buyer-у минимальный friction, seller-у контролируемый onboarding, а платформе — устойчивую и безопасную основу для orders, chat, notifications and admin control.