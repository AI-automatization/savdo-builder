# 02_architecture.md

## 1. Architecture Overview

Проект строится как единая commerce-платформа с несколькими клиентами и одним общим backend-ядром.

Система состоит из следующих основных частей:

- Buyer Web Application
- Buyer Mobile Application
- Seller Web Dashboard
- Seller Mobile Dashboard
- Platform Admin Panel
- Backend API
- Realtime Layer
- PostgreSQL Database
- Media Storage
- Push Notification Infrastructure
- Telegram Integration Layer

На этапе V0.1 MVP система реализуется как **modular monolith**, а не как набор микросервисов.

Это решение выбрано осознанно:
- быстрее разработка
- проще сопровождение
- ниже операционная сложность
- проще менять доменную модель
- меньше риск преждевременной фрагментации системы

При этом внутренняя архитектура должна быть построена так, чтобы в будущем отдельные части можно было выделить в сервисы без полной переделки.


---

## 2. High-Level System Model

### 2.1 Client Applications

#### Buyer Web
Публичная витрина магазинов и buyer-side checkout flow в браузере.

Основные функции:
- просмотр магазинов
- просмотр товаров
- выбор вариантов
- корзина
- checkout
- чат
- просмотр статуса заказа
- web push notifications

#### Buyer Mobile
Основной mobile experience для покупателей.

Основные функции:
- browsing storefront
- cart
- checkout
- chat
- order history
- push notifications

#### Seller Web Dashboard
Рабочая панель продавца для управления магазином через веб.

Основные функции:
- onboarding
- profile/store settings
- CRUD товаров
- управление вариантами товаров
- управление категориями
- просмотр и обработка заказов
- чат с покупателями
- уведомления

#### Seller Mobile Dashboard
Мобильный интерфейс продавца для быстрой операционной работы.

Основные функции:
- просмотр заказов
- подтверждение / отмена заказа
- ответы в чатах
- быстрые изменения товаров
- push notifications

#### Admin Panel
Полная панель управления платформой.

Основные функции:
- moderation
- seller verification
- store management
- product review
- order visibility
- chat access
- content actions
- ban / block / hide / restore actions
- system configuration
- audit visibility


---

## 3. Core Backend Architecture

### 3.1 Architectural Style

Backend строится на NestJS как **domain-oriented modular monolith**.

Каждый крупный бизнес-домен — отдельный модуль:
- auth
- users
- sellers
- buyers
- stores
- catalog
- products
- variants
- carts
- checkout
- orders
- chats
- notifications
- media
- moderation
- admin
- telegram
- analytics

Каждый модуль должен иметь:
- controller layer
- application/service layer
- domain logic layer
- repository/data access layer
- DTO / validation layer
- mapping layer при необходимости

### 3.2 Why Modular Monolith First

Причины выбора:
- доменная модель ещё будет меняться
- команда небольшая
- MVP требует скорости
- микросервисы на этом этапе только увеличат количество ошибок
- realtime, cart, order, auth и chat сильно связаны между собой

На V0.1 нельзя дробить систему “ради модности”.  
Надёжнее сначала собрать сильное ядро.

---

## 4. Logical Domain Boundaries

### 4.1 Identity Domain
Отвечает за:
- регистрацию
- login/session lifecycle
- guest-to-buyer flow
- seller verification state
- admin authentication
- role handling

### 4.2 Store Domain
Отвечает за:
- создание магазина
- store profile
- storefront settings
- store publication state
- Telegram contact data
- store operational settings

### 4.3 Catalog Domain
Отвечает за:
- глобальные категории платформы
- локальные store categories
- product grouping
- product discovery внутри магазина

### 4.4 Product Domain
Отвечает за:
- товары
- media
- варианты товара
- SKU
- stock
- prices
- discounts
- availability

### 4.5 Cart & Checkout Domain
Отвечает за:
- корзину
- cart rules
- one-cart-one-seller constraint
- checkout preparation
- address/contact capture
- order creation trigger

### 4.6 Order Domain
Отвечает за:
- создание заказа
- order status lifecycle
- seller actions
- buyer cancellation before confirmation
- delivery/pickup mode
- pricing snapshot

### 4.7 Chat Domain
Отвечает за:
- product inquiry threads
- order chat threads
- message delivery
- unread counters
- attachments
- moderation visibility

### 4.8 Notification Domain
Отвечает за:
- mobile push
- web push
- notification routing
- event-triggered delivery
- retries and failure logging

### 4.9 Moderation Domain
Отвечает за:
- seller verification review
- store approval
- content blocking
- manual actions by admin
- reports and abuse handling in future

### 4.10 Integration Domain
Отвечает за:
- Telegram contact flow
- Telegram notifications to seller
- future payment integrations
- future logistics integrations if needed

### 4.11 Analytics Domain
Отвечает за:
- event collection
- conversion funnel tracking
- seller activation tracking
- operational metrics
- product metrics


---

## 5. Runtime Architecture

## 5.1 Main Components

### API Layer
Основной HTTP API для:
- web clients
- mobile clients
- admin panel

### Realtime Gateway
Отдельный realtime layer для:
- chat messaging
- unread updates
- order live updates where needed
- notification fanout triggers

Рекомендуемая технология:
- NestJS WebSocket Gateway
- Socket.IO или нативный websocket layer с auth middleware

Для V0.1 Socket.IO допустим, если нужен быстрый и стабильный запуск.

### Job/Queue Layer
Нужен для фоновых задач:
- push notification delivery
- web push dispatch
- Telegram notification dispatch
- media post-processing
- analytics event processing
- retries

Рекомендуемая связка:
- Redis
- BullMQ

### Database Layer
Основная транзакционная база:
- PostgreSQL

### Object Storage Layer
Хранение медиа:
- product images
- chat attachments
- store branding assets
- seller documents for moderation

Рекомендуемая стратегия:
- S3-compatible object storage
- CDN in front of static media in production

---

## 6. Recommended Technical Stack

### 6.1 Backend
- NestJS
- TypeScript
- PostgreSQL
- Prisma ORM or TypeORM

Для этого проекта я рекомендую **Prisma** как основной ORM на MVP/production V0.1 этапе, если команда хочет:
- более быстрый development cycle
- хорошую типизацию
- удобные migrations
- понятный schema-first workflow

TypeORM можно использовать, но для такой доменной модели Prisma обычно даёт чище скорость разработки.

### 6.2 Realtime
- NestJS WebSocket Gateway
- Socket.IO
- Redis adapter later if horizontal scaling starts

### 6.3 Queue / Background Jobs
- Redis
- BullMQ

### 6.4 Storage
- S3-compatible storage
- Cloudflare R2 / AWS S3 / MinIO for dev/self-hosted environments

### 6.5 Mobile
- Expo / React Native
- TypeScript

### 6.6 Web
- Next.js
- TypeScript

Для buyer storefront и seller dashboard Next.js более уместен, чем обычный SPA, потому что:
- storefront needs SEO and sharable pages
- better route structure
- future server-side rendering options
- easier multi-surface consistency

### 6.7 Admin
- отдельный Next.js app
или
- отдельный protected admin workspace внутри monorepo

### 6.8 Infra
- Docker
- Docker Compose for local development
- cloud deployment with separated environments


---

## 7. Monorepo Strategy

Для проекта рекомендуется monorepo.

### 7.1 Why Monorepo
- shared types
- shared UI primitives if needed
- shared validation contracts
- shared API client packages
- shared domain definitions
- единый CI/CD pipeline
- проще поддерживать несколько приложений

### 7.2 Suggested Structure

```bash
/apps
  /web-buyer
  /web-seller
  /mobile-buyer
  /mobile-seller
  /admin
  /api

/packages
  /ui
  /config
  /types
  /api-client
  /utils
  /i18n
  /eslint-config
  /tsconfig