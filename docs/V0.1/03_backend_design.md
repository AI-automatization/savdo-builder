# 03_backend_design.md

## 1. Backend Overview

Backend проекта строится на NestJS + TypeScript как **domain-oriented modular monolith** с чётким разделением ответственности между модулями, слоями и инфраструктурными компонентами.

Цели backend-архитектуры:

- обеспечить стабильное API для web, mobile и admin клиентов
- изолировать доменные области друг от друга
- не смешивать бизнес-логику с transport-логикой
- поддерживать realtime interactions
- поддерживать background jobs
- быть готовым к росту без преждевременного перехода в микросервисы

На этапе V0.1 backend должен быть достаточно зрелым для production MVP, но без искусственного усложнения.

---

## 2. Architectural Principles

### 2.1 Modular Monolith First
На V0.1 система остаётся единым приложением, но внутри делится на независимые бизнес-модули.

Причины:
- быстрее разработка
- проще тестирование
- проще деплой
- меньше операционного шума
- доменная модель ещё будет уточняться

### 2.2 Domain-Oriented Design
Модули выделяются по бизнес-сущностям, а не по типу файлов.

Неправильно:
- один огромный `controllers/`
- один огромный `services/`
- один огромный `utils/`

Правильно:
- каждый домен имеет свою изолированную структуру

### 2.3 Thin Controllers
Контроллеры не должны содержать бизнес-логику.

Контроллер отвечает за:
- получение request
- валидацию DTO
- вызов use case / service
- возврат response

### 2.4 Explicit Application Layer
Основные бизнес-сценарии должны жить в application/use-case уровне.

Примеры:
- create order
- approve seller
- create product
- send chat message
- publish store

### 2.5 Repository Isolation
Доступ к данным не должен быть размазан по сервисам хаотичными ORM-запросами.

Нужен единый слой работы с persistence:
- repositories
- query services
- transaction manager

### 2.6 Event-Driven Side Effects
Внешние и побочные действия не должны быть встроены в core transaction flow.

Примеры side effects:
- push notifications
- Telegram notifications
- analytics events
- media processing

Они должны запускаться через internal events + queue.

---

## 3. Recommended Tech Stack

## 3.1 Core Backend Stack
- NestJS
- TypeScript
- PostgreSQL
- Prisma
- Redis
- BullMQ
- Socket.IO
- class-validator
- class-transformer
- zod optional for internal schema safety

### Why Prisma
Для V0.1 Prisma даёт:
- понятную схему данных
- хороший DX
- типизацию
- удобные migrations
- меньше boilerplate, чем во многих альтернативах

### Why BullMQ
Потому что системе нужны очереди для:
- notifications
- Telegram events
- analytics event processing
- retries

### Why Socket.IO
На V0.1 он даёт:
- быстрый старт
- rooms
- reconnect handling
- удобный auth flow

---

## 4. Suggested Monorepo Placement

```bash
/apps
  /api

/packages
  /types
  /config
  /utils
  /i18n

/src
  /common
  /config
  /database
  /modules
  /realtime
  /queue
  /integrations
  /shared
  main.ts
  app.module.ts

/src
  /common
    /decorators
    /dto
    /enums
    /exceptions
    /filters
    /guards
    /interceptors
    /pipes
    /types
    /utils

  /config
    app.config.ts
    auth.config.ts
    db.config.ts
    redis.config.ts
    storage.config.ts
    push.config.ts
    telegram.config.ts

  /database
    prisma.module.ts
    prisma.service.ts
    transactions

  /queue
    queue.module.ts
    jobs
    processors
    producers

  /realtime
    realtime.module.ts
    gateways
    adapters
    auth

  /integrations
    telegram
    storage
    push
    webpush

  /modules
    /auth
    /users
    /buyers
    /sellers
    /stores
    /categories
    /products
    /cart
    /checkout
    /orders
    /chat
    /notifications
    /media
    /moderation
    /admin
    /analytics

  /shared
    /contracts
    /events
    /constants

/modules/products
  products.module.ts
  /controllers
    products.controller.ts
    seller-products.controller.ts
    admin-products.controller.ts
  /dto
    create-product.dto.ts
    update-product.dto.ts
    create-variant.dto.ts
    query-products.dto.ts
  /services
    products.service.ts
    product-variants.service.ts
    product-pricing.service.ts
  /repositories
    products.repository.ts
    product-variants.repository.ts
  /queries
    product-read.service.ts
  /mappers
    product-response.mapper.ts
  /events
    product-created.event.ts
    product-updated.event.ts
  /listeners
    product-created.listener.ts

7. Core Modules
7.1 auth module

Ответственность:

OTP flow

access/refresh tokens

session lifecycle

seller login

buyer lightweight auth

admin auth

Основные use cases:

request OTP

verify OTP

login seller

refresh session

logout session

attach guest cart to buyer

7.2 users module

Ответственность:

базовая identity

user statuses

user profile basics

cross-role shared functionality

7.3 buyers module

Ответственность:

buyer profile

addresses

buyer preferences

buyer account view

7.4 sellers module

Ответственность:

seller profile

seller onboarding

seller verification state

seller operational flags

7.5 stores module

Ответственность:

create store

update store

publish flow

store settings

delivery settings

store contacts

storefront retrieval

7.6 categories module

Ответственность:

global categories

store-local categories

7.7 products module

Ответственность:

CRUD товаров

images

variants

stock

pricing

visibility

product read models

7.8 cart module

Ответственность:

active cart retrieval

add item

update item

remove item

one-seller constraint

7.9 checkout module

Ответственность:

checkout preparation

cart validation

order creation trigger

guest-to-buyer binding

7.10 orders module

Ответственность:

order lifecycle

seller actions

buyer cancellation

order history

status transitions

snapshot persistence

7.11 chat module

Ответственность:

product inquiry threads

order threads

messages

attachments metadata

unread counters

thread membership

7.12 notifications module

Ответственность:

central notification orchestration

notification preferences

delivery routing

logs

7.13 media module

Ответственность:

upload intents

media metadata

entity attachment

visibility rules

7.14 moderation module

Ответственность:

seller review queue

moderation cases

moderation actions

store approval/rejection

product hiding/blocking

7.15 admin module

Ответственность:

admin-facing control endpoints

aggregated search

manual actions

audit views

7.16 analytics module

Ответственность:

event ingestion

event shaping

funnel data

operational metrics exports

8. Controller Strategy

Контроллеры разделяются по actor surface.

Примеры:

buyer-facing controllers

seller-facing controllers

admin-facing controllers

internal/system controllers if needed

/api/v1/auth/*
/api/v1/buyer/*
/api/v1/seller/*
/api/v1/admin/*
/api/v1/storefront/*
/api/v1/chat/*

9. Recommended Route Design
9.1 Public / Storefront
GET    /api/v1/storefront/stores/:slug
GET    /api/v1/storefront/stores/:slug/products
GET    /api/v1/storefront/products/:productId
POST   /api/v1/storefront/products/:productId/chat-thread
9.2 Auth
POST   /api/v1/auth/request-otp
POST   /api/v1/auth/verify-otp
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout
9.3 Buyer
GET    /api/v1/buyer/me
GET    /api/v1/buyer/orders
GET    /api/v1/buyer/orders/:id
POST   /api/v1/buyer/addresses
PUT    /api/v1/buyer/addresses/:id
9.4 Cart / Checkout
GET    /api/v1/cart/current
POST   /api/v1/cart/items
PATCH  /api/v1/cart/items/:id
DELETE /api/v1/cart/items/:id

POST   /api/v1/checkout/preview
POST   /api/v1/checkout/confirm
9.5 Seller
GET    /api/v1/seller/me
POST   /api/v1/seller/store
PUT    /api/v1/seller/store
POST   /api/v1/seller/store/submit
GET    /api/v1/seller/orders
PATCH  /api/v1/seller/orders/:id/confirm
PATCH  /api/v1/seller/orders/:id/cancel
9.6 Products
POST   /api/v1/seller/products
GET    /api/v1/seller/products
GET    /api/v1/seller/products/:id
PUT    /api/v1/seller/products/:id
DELETE /api/v1/seller/products/:id
9.7 Admin
GET    /api/v1/admin/sellers/pending
PATCH  /api/v1/admin/sellers/:id/approve
PATCH  /api/v1/admin/sellers/:id/reject
PATCH  /api/v1/admin/stores/:id/suspend
PATCH  /api/v1/admin/products/:id/hide
GET    /api/v1/admin/orders
GET    /api/v1/admin/chats/:id
10. DTO and Validation Strategy

Все внешние запросы должны проходить через DTO.

Required tools

class-validator

class-transformer

global validation pipe

Validation rules

strict payload validation

whitelist enabled

forbidNonWhitelisted enabled in protected surfaces

transform enabled

Example DTO groups

create-product.dto.ts

create-variant.dto.ts

checkout-confirm.dto.ts

send-message.dto.ts

seller-submit-review.dto.ts

Validation principles

validate shape at DTO layer

validate business rules at service layer

validate persistence assumptions at repository/DB layer

11. Service Layer Design

Сервисный слой должен быть разделён на:

orchestration services

domain services

read services

11.1 Orchestration Services

Отвечают за конкретный use case.

Примеры:

CreateOrderService

ApproveSellerService

SubmitStoreForReviewService

SendChatMessageService

11.2 Domain Services

Содержат переиспользуемую бизнес-логику.

Примеры:

CartPricingService

InventoryValidationService

OrderStatusPolicyService

StorePublicationRulesService

11.3 Read Services

Оптимизированы под чтение и response shaping.

Примеры:

StorefrontQueryService

SellerOrdersReadService

AdminSearchService

12. Repository Layer

Repositories изолируют Prisma queries от прикладной логики.

Example repositories

users.repository.ts

sellers.repository.ts

stores.repository.ts

products.repository.ts

variants.repository.ts

carts.repository.ts

orders.repository.ts

chat.repository.ts

Repository responsibilities

encapsulate data access

hide ORM details

provide transaction-safe methods

centralize common where/order/pagination fragments

Do not

не писать огромные “god repositories”

не смешивать в одном репозитории unrelated entities

не размазывать prisma client по всем сервисам

13. Transaction Strategy

Критичные бизнес-операции должны выполняться в транзакции.

Must be transactional

create order

convert cart to order

update stock during order confirmation/reservation strategy

approve/reject seller

publish store

create message + update thread metadata

Recommended approach

Использовать Prisma.$transaction() через transaction manager abstraction.

Пример:

await this.tx.run(async (db) => {
  const order = await this.ordersRepository.create(db, payload);
  await this.orderItemsRepository.createMany(db, items);
  await this.orderHistoryRepository.create(db, history);
  await this.cartsRepository.markConverted(db, cartId);
});
Principle

Всё, что влияет на целостность заказа, должно быть atomic.

14. Internal Event Model

После успешных core операций система должна публиковать internal domain events.

Example events

seller.registered

seller.approved

store.created

store.published

product.created

product.updated

cart.updated

checkout.started

order.created

order.confirmed

order.cancelled

chat.message_sent

Event usage

События используются для:

notifications

Telegram dispatch

analytics logging

cache invalidation later

external integrations later

Principle

Core transaction commits first, side effects second.

15. Queue / Job Design
15.1 Queue Categories

Рекомендуется разделить очереди по доменам:

notifications

telegram

analytics

media

maintenance

15.2 Job Examples

send mobile push

send web push

send telegram alert

persist analytics event

optimize uploaded image

retry failed notification

15.3 Processor Principles

idempotent handlers

retry support

error logging

dead-letter strategy later if needed

16. Realtime Backend Design
16.1 Realtime Boundaries

Realtime не должен использоваться везде подряд.

На V0.1 realtime покрывает:

chat threads

new messages

unread count updates

new order alerts for seller

order status updates where needed

16.2 Gateway Structure
/realtime
  /gateways
    chat.gateway.ts
    notifications.gateway.ts
  /auth
    ws-auth.guard.ts
    ws-user.context.ts
  /events
16.3 Auth Strategy

WebSocket connection must be authenticated:

access token in handshake

token verification on connect

user context attached to socket

16.4 Room Strategy

user:{userId}

thread:{threadId}

optional order:{orderId}

17. Auth Backend Design
17.1 Authentication Model

Система поддерживает:

buyer lightweight OTP auth

seller auth

admin auth

17.2 Recommended Token Flow

short-lived access token

long-lived refresh token

refresh token stored hashed in DB

session revocation supported

17.3 Session Features

multiple devices

per-device revocation

last seen tracking

session expiration

17.4 Seller Activation Rules

Seller может зарегистрироваться быстро, но магазин не может стать public без:

phone verification

seller profile completion

Telegram data

moderation approval

18. Authorization Design
18.1 Layers

Авторизация должна быть многоуровневой:

route-level guards

role checks

ownership checks

policy checks in services

Example

Недостаточно проверить, что actor = seller.
Нужно ещё проверить, что seller владеет store/product/order.

18.2 Required Guards

access token auth guard

refresh token guard

role guard

admin guard

seller ownership guard where needed

websocket auth guard

19. Response Mapping Strategy

Response mapping нельзя оставлять на случайность ORM output.

Нужны отдельные mappers / presenters:

ProductResponseMapper

OrderDetailMapper

StorefrontProductMapper

ChatThreadMapper

Причины:

API стабилен

можно скрывать internal fields

проще versioning

проще multilingual shaping later

20. Error Handling Strategy
20.1 Standard Error Model

Все ошибки API должны возвращаться в едином формате.

Пример:

{
  "statusCode": 400,
  "code": "CART_STORE_MISMATCH",
  "message": "Cart can contain items from only one store",
  "details": {}
}
20.2 Exception Types

validation errors

auth errors

permission errors

business rule errors

not found errors

conflict errors

rate-limit errors

20.3 Global Exception Filter

Нужен единый Nest exception filter для:

normalization

logging

safe response formatting

21. Logging Strategy

Backend должен логировать не только ошибки, но и системные события.

Recommended logging categories

request logs

auth logs

moderation logs

queue job logs

integration logs

critical business errors

Rules

не логировать OTP/code/token/plain secrets

mask sensitive user data where needed

correlation id for request tracing desirable

Recommended tools

Nest logger abstraction

pino / winston

structured logging

22. File / Media Backend Design
22.1 Media Upload Pattern

Нельзя отправлять тяжёлые файлы через случайные контроллеры.

Правильный flow:

client requests upload intent

backend validates actor and upload type

backend returns upload target or accepts controlled upload

media metadata stored

entity attaches media by media_id

22.2 Media Types

product image

chat image

store logo

seller verification doc

22.3 Security

protected/private media must not be publicly accessible by default

entity ownership must be validated before attachment

23. Notification Backend Design
23.1 Central Notification Service

Нужен единый сервис, который:

принимает domain event

определяет получателей

определяет каналы

enqueue delivery jobs

writes notification log

23.2 Supported Channels

mobile push

web push

Telegram

23.3 Notification Triggers

new order

order confirmed

order cancelled

new chat message

seller approved

moderation decision

24. Telegram Integration Backend Design

На V0.1 Telegram интеграция ограничивается:

Telegram contact link

Telegram notifications for seller

Telegram module responsibilities

format seller notification messages

enqueue Telegram sends

log failures

support disable/enable per seller later

Not in V0.1

Telegram bot storefront

mini app deep operational workflows

full admin control from bot

25. Search / Query Strategy

На V0.1 сложный full-text search по всей платформе не обязателен, но query layer должен быть аккуратным.

Needs

storefront products by store

seller products list

seller orders list

admin lists with filters

chat threads list

Recommended approach

PostgreSQL indexed queries

pagination from day one

avoid unbounded list endpoints

Future

trigram indexes

dedicated search service only if needed

26. Caching Strategy

На старте агрессивный caching не нужен, но точечный caching допустим.

Good candidates

global categories

store public profile

storefront product listings with short TTL

admin dictionaries/settings

Do not cache aggressively yet

cart

chat

order states

moderation queues

27. Background Maintenance Jobs

Нужны регулярные cron-like задачи:

expire OTP requests

expire stale carts

clean old sessions

retry failed notifications

detect broken media references later

aggregate analytics later

Для этого можно использовать:

BullMQ repeatable jobs

Nest schedule module if scope small

28. Testing Strategy
28.1 Required Testing Layers

unit tests for domain services

integration tests for repositories and use cases

e2e tests for critical API flows

28.2 Critical Flows to Cover

seller registration and store submit

create product with variants

add to cart

one-cart-one-seller enforcement

checkout confirm

seller order confirm/cancel

send chat message

admin approve seller

28.3 Testing Principle

Не пытаться покрыть всё.
Покрывать то, что ломает деньги, данные и основной продуктовый путь.

29. Security Requirements
Required from V0.1

hashed refresh tokens

rate limits on auth endpoints

OTP attempt limits

validated uploads

authorization on every protected route

protected admin surface

sanitized input

secure storage access rules

Recommended

helmet

CORS policy

CSRF strategy where relevant for web

request throttling

audit logs for admin actions

30. API Versioning

Нужна версия API с первого дня.

Рекомендуемый формат:

/api/v1/*

Причины:

future breaking changes

mobile compatibility

admin/client separation safety

31. Environment Configuration

Backend должен поддерживать:

local

development

staging

production

Конфигурация должна быть централизована через config module.

Example env groups

app

database

redis

jwt

storage

push

telegram

web push

32. Recommended Coding Standards
Rules

no business logic in controllers

no direct Prisma access from controllers

no cross-module DB access without explicit dependency

explicit DTOs

explicit response mappers

explicit domain errors

no giant utility dumping ground

Naming

use-case oriented service names

repository names by entity/domain

event names in past tense

DTOs by action, not by vague names

33. Migration Strategy

Schema changes должны проходить только через migrations.

Rules

no manual schema drift

every schema change versioned

destructive migrations reviewed carefully

seed data separated from schema migration

Seed candidates

global categories

admin bootstrap user

static configuration dictionaries

34. Recommended Build Order

Последовательность backend разработки:

auth

users / sellers / stores

categories

products + variants

carts

checkout

orders

chat

notifications

moderation / admin

analytics

Это минимизирует блокировки между доменами.

35. Final Backend Rules

Backend V0.1 должен строиться вокруг следующих обязательных правил:

backend — источник истины для всех бизнес-правил

controllers максимально тонкие

critical flows only through transactions

side effects only through events/queues

repositories изолируют data access

role + ownership checks обязательны

chat, orders, products и moderation проектируются сразу как реальные production домены

никакой “временной” архитектуры, которую потом придётся выкинуть