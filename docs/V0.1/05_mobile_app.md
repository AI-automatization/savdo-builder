# 05_mobile_app.md

## 1. Mobile Application Overview

Мобильная часть проекта состоит из двух отдельных приложений:

- Buyer Mobile Application
- Seller Mobile Application

Оба приложения разрабатываются на Expo / React Native / TypeScript и должны быть production-oriented с первого этапа.

Причины разделения:
- разные user flows
- разные permissions
- разные navigation trees
- разные product priorities
- более чистая codebase
- проще release management

На V0.1 нельзя превращать mobile в “одно приложение для всех ролей”, если это создаёт путаницу в UX и усложняет release cycle.

---

## 2. Mobile Goals

### Buyer App Goals
- удобный storefront browsing
- карточка товара
- варианты товара
- корзина
- checkout
- chat
- order tracking
- push notifications

### Seller App Goals
- мобильная операционная панель
- новые заказы
- управление статусами заказов
- быстрые ответы в чатах
- просмотр товаров
- базовое редактирование товаров
- push notifications

---

## 3. Recommended Mobile Stack

- Expo
- React Native
- TypeScript
- Expo Router or React Navigation
- Zustand or Redux Toolkit
- TanStack Query
- React Hook Form
- Zod for client-side schemas
- i18next / react-i18next
- Expo Notifications
- Socket.IO client
- MMKV or SecureStore where appropriate

### Recommended State Split
Нужно разделять:
- server state
- local UI state
- auth/session state
- ephemeral interaction state

Рекомендуемый подход:
- TanStack Query для server state
- Zustand для lightweight app state
- Secure storage для session artifacts
- form state через React Hook Form

---

## 4. App Separation Strategy

## 4.1 Recommended Repository Structure

```bash
/apps
  /mobile-buyer
  /mobile-seller

/packages
  /api-client
  /types
  /ui
  /utils
  /i18n
  /config

5. Buyer Mobile Architecture
5.1 Main Sections

authentication / lightweight identity

storefront

product detail

cart

checkout

chat

orders

profile / settings

5.2 Navigation Model

Рекомендуется hybrid navigation:

root stack

tab navigation for main buyer surfaces

nested stacks for product/order/chat flows

Suggested main tabs

Home / Storefront

Cart

Orders

Chats

Profile

Если buyer чаще приходит по deep link сразу в магазин, можно сделать стартом storefront flow, а не “home marketplace”.

6. Seller Mobile Architecture
6.1 Main Sections

auth

onboarding status

dashboard

orders

chats

products

store settings

profile

6.2 Navigation Model

Рекомендуется:

root stack

bottom tabs for main seller workflows

Suggested main tabs

Orders

Chats

Products

Store

Profile

Seller Priority Principle

Seller mobile app — не для тяжёлого администрирования каталога, а для оперативной работы.
Основной seller content management всё равно удобнее в web dashboard.

7. Shared Mobile Principles
7.1 Design Priorities

быстрый first interaction

минимальный friction в checkout

стабильность чата

надёжные push notifications

хорошая работа на слабых устройствах

аккуратная работа при плохом интернете

7.2 UX Priorities

нельзя перегружать экраны

mobile-first формы должны быть короткими

важные CTA должны быть видимыми без сложной навигации

error states должны быть понятными

loading states обязательны

8. Navigation Strategy
8.1 Buyer App Suggested Route Tree
app/
  _layout.tsx
  index.tsx
  store/
    [slug].tsx
  product/
    [id].tsx
  cart/
    index.tsx
  checkout/
    index.tsx
    success.tsx
  orders/
    index.tsx
    [id].tsx
  chats/
    index.tsx
    [threadId].tsx
  profile/
    index.tsx
  auth/
    login.tsx
    verify-otp.tsx
8.2 Seller App Suggested Route Tree
app/
  _layout.tsx
  index.tsx
  auth/
    login.tsx
    verify-otp.tsx
  onboarding/
    status.tsx
    store-setup.tsx
    verification.tsx
  orders/
    index.tsx
    [id].tsx
  chats/
    index.tsx
    [threadId].tsx
  products/
    index.tsx
    create.tsx
    [id].tsx
    edit/[id].tsx
  store/
    index.tsx
    settings.tsx
  profile/
    index.tsx
9. Authentication Flow
9.1 Buyer Auth

Buyer может:

browse as guest

add to cart as guest

перейти к checkout

подтвердить phone/identity на checkout этапе

Buyer Auth States

anonymous

pending verification

identified buyer

9.2 Seller Auth

Seller authentication based on phone verification.

Flow:

enter phone

OTP verification

receive session

load onboarding/store status

9.3 Session Persistence

Нужно безопасное хранение:

access token in memory

refresh token in secure storage

minimal session metadata locally

Рекомендуемые инструменты:

Expo SecureStore для чувствительных данных

MMKV для несекретного быстрого state

10. API Consumption Strategy
10.1 Server State

Все network-backed entities должны жить через TanStack Query.

Примеры:

storefront products

product details

cart

orders

chat threads

seller products

seller orders

10.2 Query Keys

Нужна строгая система query keys.

Примеры:

['store', slug]

['product', productId]

['cart', actorKey]

['buyer-orders']

['seller-orders', filters]

['chat-thread', threadId]

10.3 Mutation Principles

Каждая mutation должна:

иметь pending state

иметь success/error feedback

инвалидировать нужные queries

не ломать локальный UX

Примеры:

add to cart

create order

send message

confirm order

update product

11. Local State Strategy
11.1 Use Local State For

UI toggles

selected tab/filter

modal states

unsaved drafts

optimistic message state if needed

transient form helpers

11.2 Avoid Using Local State For

authoritative cart data

order status truth

product source of truth

unread count truth if server-driven

12. Forms Strategy

Использовать:

React Hook Form

Zod resolver

Forms Needed

Buyer:

checkout form

profile edit

address form

Seller:

store setup form

product create/edit form

variant editor

store settings form

Form Principles

mobile keyboard-safe layouts

step-by-step for long forms

autosave optional later

server error mapping back to fields

client validation + server validation both required

13. Buyer Core Screens
13.1 Storefront Screen

Содержит:

store info

categories

product list/grid

filters if needed

entry to Telegram contact

entry to chat/product detail

13.2 Product Detail Screen

Содержит:

images carousel

title

price / old price / sale price

available variants

stock status

description

add to cart

ask seller

Telegram contact option

13.3 Cart Screen

Содержит:

list of cart items

variant labels

quantity control

subtotal

delivery note preview if relevant

proceed to checkout

13.4 Checkout Screen

Содержит:

customer name

phone

address

delivery/pickup

comment

payment method

order summary

confirm action

13.5 Orders Screen

Содержит:

list of buyer orders

status

total

created date

quick access to order detail/chat

13.6 Chat Screen

Содержит:

thread list

order/product context header

messages

image send

unread state

connection / sending state

14. Seller Core Screens
14.1 Onboarding Status Screen

Содержит:

current verification state

next required steps

missing fields

admin decision state

14.2 Orders List Screen

Содержит:

pending/confirmed/completed/cancelled filters

buyer name

total

time

quick actions

14.3 Order Detail Screen

Содержит:

items

variants

prices

buyer contact

address / pickup info

comment

status change actions

open chat

14.4 Chats Screen

Содержит:

thread list

unread badges

order/product context

fast reply access

14.5 Products Screen

Содержит:

product list

stock visibility

create/edit actions

status

search/filter optional

14.6 Store Screen

Содержит:

store information

public link

verification state

settings

Telegram contact

delivery settings

15. Chat Implementation on Mobile
15.1 Transport

initial load via HTTP

realtime updates via Socket.IO

fallback refetch on reconnect

15.2 Message Model in UI

Message object должен поддерживать:

local temp id

server id

sender info

createdAt

pending/sent/failed state

attachments

context labels

15.3 Sending Strategy

При отправке:

create optimistic local message

send through socket or HTTP-backed action

reconcile response

mark failed if not delivered

15.4 Attachment Strategy

Изображения:

сначала upload

затем send message with attachment reference

Нельзя пытаться отправлять большие raw files прямо “как есть” в message event.

16. Push Notifications
16.1 Required Push Types

Buyer:

order created

order confirmed

order cancelled

new message

Seller:

new order

order cancelled

new message

moderation result

store approval/rejection

16.2 Expo Notifications

Для V0.1 можно использовать Expo notifications pipeline, если:

устраивает vendor choice

команда понимает future migration path

Если нужен более прямой control later:

FCM / APNs native path можно заложить позже

16.3 App Behavior on Push Tap

Push tap должен вести:

в order details

в chat thread

в moderation status screen

в product/order context where relevant

Deep linking обязателен.

17. Web Push Relation

Хотя web push относится к web layer, mobile app должна быть согласована по notification semantics.
События, payload naming и route targets должны быть единообразны между mobile и web.

18. Realtime and Connectivity Strategy
18.1 Offline / Weak Network Handling

Нужно предусмотреть:

loading skeletons

retry UI

reconnect handling for chat

stale data display with refetch

clear submission states

18.2 Socket Reconnect

При reconnect:

restore auth context

rejoin needed rooms

refetch unread/thread summary if required

18.3 App Resume Behavior

При возврате приложения в foreground:

refresh critical queries

reconnect socket if disconnected

sync notifications badge state if needed

19. Media Handling in Mobile
19.1 Product Images

optimized remote images

caching strategy

placeholder while loading

proper aspect ratios

19.2 Chat Images

upload compression on client where appropriate

upload progress indicator

tap-to-preview

19.3 Seller Documents

Если seller verification docs загружаются с mobile:

clear validation

crop/compress where necessary

secure upload only

20. Localization

Поддерживаемые языки:

Uzbek

Russian

20.1 i18n Requirements

все UI строки через translation layer

не хардкодить строки в компонентах

key naming predictable

server-driven content must be language-aware where relevant

20.2 Language Strategy

use device language as initial hint

allow manual switch in settings

persist user language choice

21. UI Component Strategy

В monorepo желательно иметь shared UI package, но только для действительно общих primitives.

Good candidates for shared mobile/web concepts

buttons

inputs

badges

chips

typography tokens

spacing tokens

empty states

loading states

Not everything should be shared

Mobile UI не надо насильно унифицировать с web, если это ломает usability.

22. Design System Principles for Mobile

clean surfaces

large tap areas

explicit hierarchy

readable product cards

visible stock/price information

consistent primary actions

clear destructive actions

Buyer UX tone

должен быть проще и легче

Seller UX tone

должен быть функциональным и быстрым

23. Performance Requirements
23.1 Must Optimize

app startup time

large product lists

image-heavy screens

chat screen performance

notification open time

23.2 Recommended Techniques

list virtualization

pagination

image caching

avoid unnecessary re-renders

memoization where justified

split expensive screens/components

23.3 Avoid

giant global stores

over-fetching

blocking app init on too many requests

large unpaginated lists

24. Security Requirements

secure token storage

no sensitive logs

protect admin/seller-only routes on client and server

validate uploads

hide protected resources behind signed access or controlled endpoints

handle logout and session invalidation correctly

Client-side auth alone is never enough.
Backend remains source of truth.

25. Mobile Analytics
25.1 Buyer Events

app_opened

storefront_viewed

product_viewed

variant_selected

add_to_cart

checkout_started

order_created

chat_opened

message_sent

25.2 Seller Events

seller_app_opened

orders_viewed

order_confirmed

order_cancelled

product_created

store_submitted

chat_reply_sent

25.3 Principles

event names consistent with backend analytics model

avoid duplicate firing

capture essential funnel actions only on MVP

26. Error State Design

Каждый критичный экран должен иметь:

loading state

empty state

error state

retry action

Examples

no products

no orders

failed to load messages

failed to create order

failed to upload image

Ошибки не должны быть “тихими”.

27. Testing Strategy
27.1 Required Layers

component tests for critical UI blocks

integration tests for major flows

manual QA for push/chat/navigation

device testing on Android and iPhone

27.2 Critical Flows to Test

Buyer:

open store

select variant

add to cart

checkout

open order chat

receive push and deep link

Seller:

login

see new order

confirm order

reply in chat

edit product basic fields

receive push and open target screen

28. Release Strategy
28.1 Buyer App

Релизится как customer-facing core app.

28.2 Seller App

Релизится как operational app for merchants.

Recommended Approach

TestFlight / internal testing first

Android internal testing first

staged rollout after core flows stable

29. Build Priorities
29.1 Buyer App Build Order

auth foundation

storefront

product detail

cart

checkout

orders

chat

push

localization polish

29.2 Seller App Build Order

auth

onboarding status

orders list/detail

chat

products list/basic edit

store settings

push

polish

30. Final Mobile Rules

buyer and seller apps are separate products

server state and local state must not be mixed carelessly

push and deep linking are first-class requirements

chat must be resilient under weak connectivity

checkout must be simple and fast

seller mobile focuses on operations, not full admin complexity

all strings must support Uzbek and Russian

backend remains source of truth for status, permissions and business rules