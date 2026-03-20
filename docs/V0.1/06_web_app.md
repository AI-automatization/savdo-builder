# 06_web_app.md

## 1. Web Application Overview

Web layer проекта состоит из двух отдельных клиентских поверхностей:

- Buyer Web Application
- Seller Web Dashboard

Admin panel вынесен в отдельный документ и рассматривается как самостоятельная поверхность системы.

Web-часть не должна восприниматься как второстепенная по отношению к mobile.  
Для текущего продукта web — это критически важный слой, потому что:

- storefront ссылки удобно распространять через Telegram
- buyer часто открывает магазин из Telegram прямо в браузере
- seller dashboard удобнее для управления магазином с desktop/tablet
- web push важен для оперативной работы seller-а
- buyer web может быть основной точкой входа до массового роста mobile adoption

---

## 2. Web Goals

### Buyer Web Goals
- быстрый вход в магазин по ссылке
- просмотр товаров
- выбор варианта
- корзина
- checkout
- product/order chat
- Telegram как альтернативный канал
- web push notifications

### Seller Web Goals
- onboarding
- создание и настройка магазина
- создание и редактирование товаров
- управление категориями
- управление вариантами товаров
- просмотр и обработка заказов
- работа с чатами
- настройка store contacts and delivery settings

---

## 3. Recommended Stack

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- Zustand or lightweight client state store
- React Hook Form
- Zod
- i18next / next-intl / react-i18next
- Socket.IO client
- Web Push integration

### Why Next.js
Next.js предпочтителен для web-слоя, потому что он даёт:

- route-based architecture
- удобную работу с публичными storefront pages
- SEO readiness
- server rendering / static rendering options
- удобный deep linking behavior
- хорошую основу для performance optimization

---

## 4. App Separation Strategy

Рекомендуется разделить buyer web и seller web логически, даже если они живут в одном monorepo.

### Suggested monorepo layout

```bash
/apps
  /web-buyer
  /web-seller
  /admin

  Why Separate

разные layouts

разные auth rules

разные release priorities

меньше role branching

меньше риска “смешанного интерфейса”

Acceptable Alternative

На раннем этапе можно держать buyer web и seller web в одном Next.js приложении с раздельными route groups, если это ускоряет старт.

Но даже в этом случае:

layouts must be isolated

auth boundaries must be explicit

shared code must be intentional, not accidental

5. Buyer Web Architecture
5.1 Buyer Web Product Role

Buyer web — это не общий маркетплейс.
Это storefront surface для отдельных магазинов.

То есть buyer чаще всего:

переходит по прямой ссылке

смотрит конкретный магазин

взаимодействует с товарами одного seller-а

Эта логика должна быть отражена в IA и UX.

5.2 Core Buyer Sections

store page

product page

cart

checkout

order detail

chat

profile/session light layer if needed

6. Seller Web Architecture
6.1 Seller Web Product Role

Seller web dashboard — основной рабочий инструмент продавца для управления магазином.

Именно здесь продавец должен делать:

onboarding

most product management

variant management

category management

order handling

settings changes

Seller mobile остаётся операционным инструментом, а не полным заменителем dashboard.

6.2 Core Seller Sections

onboarding status

dashboard home

products

product create/edit

categories

orders

order detail

chats

store settings

profile / notifications settings

7. Buyer Route Structure
Suggested structure
/app
  /(public)
    /store/[slug]
    /product/[productId]
    /cart
    /checkout
    /orders/[orderId]
    /chat/[threadId]
    /auth
Notes

core entry point is store slug page

product page may be nested under store path or standalone by id

checkout should stay minimal and focused

order/chat routes should support deep linking from notifications

8. Seller Route Structure
Suggested structure
/app
  /(seller)
    /login
    /verify
    /onboarding
    /dashboard
    /products
    /products/new
    /products/[id]
    /products/[id]/edit
    /categories
    /orders
    /orders/[id]
    /chats
    /chats/[threadId]
    /store
    /store/settings
    /profile
Notes

seller area must be fully protected

onboarding and verification gating must happen before full dashboard access

order/chat routes must be optimized for fast operational access

9. Rendering Strategy
9.1 Buyer Storefront Rendering

Storefront should prioritize performance and shareability.

Recommended approach

public store page: SSR or hybrid rendering

product page: SSR or ISR-compatible strategy

cart/checkout/chat: client-side interactive rendering

Why

Telegram users open shared links directly

public pages benefit from metadata

performance and social previews matter

checkout and cart are highly interactive and can remain client-heavy

9.2 Seller Dashboard Rendering

Seller dashboard is primarily authenticated app-like UI.

Recommended:

client-heavy protected app

server rendering only where useful

strong caching discipline for non-volatile data

10. Buyer Core Screens
10.1 Storefront Page

Main responsibilities:

display store branding

display categories

display products

display Telegram contact option

display store delivery basics

route buyer into product detail and cart

Required blocks

store header

category navigation

product grid/list

active filters if needed

empty states

loading skeletons

10.2 Product Detail Page

Responsibilities:

display media

display pricing

display sale state

display stock/availability

display variants

display product description

add to cart

ask seller

open Telegram alternative

Required UX

variant selection must be clear

unavailable combinations must be handled gracefully

price must react to selected variant if override exists

10.3 Cart Page

Responsibilities:

show cart items

enforce one-store context

quantity editing

subtotal display

entry to checkout

Required behavior

fast quantity changes

invalid item handling if variant became unavailable

explicit store context

10.4 Checkout Page

Responsibilities:

collect buyer data

collect phone

collect delivery/pickup preference

collect address/comment

display order summary

create order

Required UX

minimal friction

field validation

clear success/failure state

lightweight identity creation flow

10.5 Orders / Order Detail

order status

item snapshots

totals

delivery/pickup details

access to chat

cancellation ability if status allows

10.6 Chat

thread list or direct thread view

order/product context

message timeline

image attachments

seller identity cues

notification hooks

11. Seller Core Screens
11.1 Onboarding Page

Responsibilities:

show seller verification state

show missing requirements

collect required data

submit store for review

Required blocks

progress/status card

seller data form

document upload

Telegram/contact inputs

store basic setup

11.2 Dashboard Home

Should not become a bloated analytics panel on V0.1.

Main role:

quick operational overview

Suggested blocks:

verification status

pending orders count

unread chats count

quick actions

store publication state

11.3 Products List

Responsibilities:

view products

filter by status

search within seller catalog

quick edit

quick stock overview

Important

Products list must scale well even when seller has many items.

11.4 Product Create/Edit Page

This is one of the most important seller flows.

Responsibilities:

basic product info

pricing

sale pricing

category mapping

media upload

option groups

option values

variants generation/editing

stock

SKU handling

UX principle

Product creation cannot feel like an enterprise ERP form.
It must be structured, but digestible.

Recommended form strategy

sectioned form

sticky save area

clear separation:

general info

media

pricing

categories

variants

stock

11.5 Categories Page

create local store categories

reorder categories

activate/deactivate categories

11.6 Orders List

pending / confirmed / completed / cancelled filters

order number

customer name

amount

created time

quick actions

11.7 Order Detail

buyer details

address / pickup

item snapshots

comments

chat entry

confirm / cancel action

11.8 Chats

thread list

unread states

product/order context

message thread view

11.9 Store Settings

store name

branding

description

contacts

Telegram link

delivery settings

public link

12. State Management Strategy
12.1 Server State

Should be handled through TanStack Query.

Use for:

store data

product lists

product detail

cart

orders

chats

seller catalog

seller order queues

12.2 Local UI State

Use lightweight store or component state for:

filters

drawer/modal state

current tab

temporary form helpers

optimistic message states

12.3 Avoid

storing authoritative business entities only in client local store

duplicating server truth unnecessarily

mixing auth state and UI state chaotically

13. Auth and Session Strategy
13.1 Buyer Web

Buyer may stay effectively guest until checkout.

Model:

browsing without forced auth

cart associated with session

checkout triggers lightweight identity confirmation

further order/chat access tied to identity/session

13.2 Seller Web

Seller dashboard requires explicit authenticated session.

Model:

phone/OTP based login

refresh-based session persistence

protected routes

onboarding gate before full seller functionality

13.3 Session Handling

access token short-lived

refresh token rotation

secure cookie or secure storage strategy depending on architecture

protected route middleware where appropriate

14. Buyer Web UX Principles

store must load fast from shared links

product card hierarchy must be obvious

add-to-cart must be frictionless

checkout should ask only for necessary fields

Telegram alternative must be visible but not dominant

product inquiry chat should be easy to access

all flows must work well on mobile browsers

Important

Buyer web in this product is often used from Telegram in a mobile browser.
So “web” cannot be designed only for large desktop screens.

15. Seller Web UX Principles

dashboard must feel operational, not decorative

important actions should take few clicks

product edit should be structured and calm

order handling should be fast

unread chats should be visible

verification blockers should be impossible to miss

Important

Seller web is the place where friction directly kills adoption.
If product creation is painful, sellers will return to Telegram posting.

16. Responsive Strategy
16.1 Buyer Web

Buyer web must be fully responsive and mobile-first.

Key target:

mobile browser from Telegram

small Android screens

average iPhone screens

tablet acceptable

16.2 Seller Web

Seller dashboard should be responsive, but optimized primarily for:

desktop

laptop

tablet

Mobile browser usability desirable, but seller mobile app covers true mobile operational usage.

17. Forms and Validation

Use:

React Hook Form

Zod

Buyer forms

checkout

buyer identity confirmation

address fields

message sending helpers where relevant

Seller forms

onboarding

store settings

product create/edit

category create/edit

delivery settings

Form principles

sectioned validation

inline errors

disable destructive ambiguous behavior

preserve unsaved draft when possible

map backend errors cleanly

18. Product Variant UI Strategy

Товарная модель в проекте сложная, поэтому web UI должен это отражать аккуратно.

18.1 Buyer Side

Buyer must be able to:

choose option groups step-by-step

see unavailable options

understand selected combination

see price changes

add exact purchasable unit

18.2 Seller Side

Seller must be able to:

define option groups

define option values

generate combinations

edit SKU per variant

edit stock per variant

edit variant-level prices if needed

Critical principle

Variant editing should be table-like where needed, but not cryptic.

19. Chat in Web
19.1 Buyer Web Chat

product inquiry before order

order chat after order

thread-specific context header

image sending support

realtime updates

fallback polling/refetch on connection issues

19.2 Seller Web Chat

thread list with context

unread counters

fast switching between threads

order/product info visible near chat

19.3 Implementation Principle

initial data via HTTP

realtime via Socket.IO

optimistic send where appropriate

reliable delivery state

20. Notifications in Web
20.1 Web Push Scope

Web push is required.

Buyer:

order updates

new messages

Seller:

new order

new messages

moderation results

20.2 Notification Entry Points

Push click must deep link to:

order page

chat thread

onboarding/review page

20.3 In-App Notifications

In addition to push, seller dashboard should include:

visible unread badges

pending order indicators

moderation alerts

21. SEO and Shareability
21.1 Storefront SEO

Store pages and product pages should support:

proper metadata

sharable previews

canonical URL structure

good initial render performance

21.2 Telegram Sharing

Because links are often shared in Telegram:

title and preview must be meaningful

store/product pages should generate acceptable metadata

route design should be clean and readable

22. Performance Requirements
22.1 Buyer Web Must Optimize

store page load

image-heavy product grids

product detail rendering

cart responsiveness

checkout responsiveness

22.2 Seller Web Must Optimize

large product lists

order filtering

chat thread switching

product edit forms with many variants

22.3 Recommended Techniques

pagination

route-level code splitting

image optimization

virtualization for large tables/lists if needed

avoid unnecessary refetches

cache query results intelligently

23. Error and Empty States

Каждый важный экран должен иметь:

loading state

empty state

error state

retry option

Buyer examples

store not found

no products

product unavailable

cart empty

order creation failed

chat unavailable temporarily

Seller examples

no products yet

no orders yet

no chats yet

verification pending

store rejected with reason

24. Localization

Поддерживаемые языки:

Uzbek

Russian

24.1 Requirements

all interface strings externalized

route content stays language-safe

category and system labels should support both languages

user language preference persisted where applicable

24.2 Content Behavior

System UI bilingual, while seller-created content may remain in the language entered by seller.

25. Accessibility and Usability Basics

Даже на MVP нужно соблюдать минимальный уровень quality:

clear button states

visible focus states

semantic forms

readable font sizes

contrast discipline

keyboard usability in seller dashboard

screen width stability in tables/forms

Это особенно важно для seller dashboard, где люди работают подолгу.

26. Buyer Web Build Order

storefront page

product page

cart

checkout

order detail

product inquiry chat

order chat

web push

localization polish

27. Seller Web Build Order

auth

onboarding

store settings

products list

product create/edit

local categories

orders list/detail

chats

web push

polish and quality improvements

28. Testing Strategy
28.1 Buyer Web Critical Flows

open store link from mobile browser

open product

select variant

add to cart

checkout

open chat

receive web push and deep link

28.2 Seller Web Critical Flows

login

onboarding submit

create product with variants

edit stock

confirm/cancel order

open and reply in chat

receive web push and navigate to target page

28.3 Test Priorities

На V0.1 важнее всего тестировать не “красоту”, а:

conversion path

seller activation path

order correctness

chat correctness

29. Security Requirements

protected seller routes

protected dashboard API usage

no sensitive data leakage in hydration payloads

upload validation

CSRF-aware strategy where applicable

safe handling of refresh tokens

route-level and server-level authorization both required

30. Final Web Rules

buyer web is storefront-first, not marketplace-first

seller web is operations-first, not vanity dashboard

storefront pages must work excellently from Telegram mobile browser traffic

seller dashboard must reduce friction in product creation and order handling

web push is required, not optional

variant UX must be explicit on both buyer and seller sides

web layer must remain bilingual

backend remains source of truth for permissions, pricing, stock and order state

Главная цель web-части:
сделать путь от Telegram-ссылки до покупки максимально удобным для buyer-а и дать seller-у рабочий инструмент, который действительно лучше хаотичной торговли через чаты.