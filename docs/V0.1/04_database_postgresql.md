# 04_database_postgresql.md

## 1. Database Overview

Основная база данных проекта — PostgreSQL.

База должна проектироваться не как временная схема “для MVP”, а как production-ready foundation, которую не придётся полностью ломать после первых пользователей.

Основные требования к схеме:

- поддержка seller-centric storefront модели
- поддержка buyer guest/identified flow
- полноценная product/variant architecture
- order snapshot model
- chat threads по товару и заказу
- seller verification and moderation
- push/web push/telegram integrations
- extensibility для V0.2+

---

## 2. Main Design Principles

### 2.1 Relational Core
Ключевые бизнес-сущности должны храниться в нормализованной реляционной модели.

Причины:
- строгие связи
- транзакционная целостность
- сложные выборки по заказам, товарам, sellers
- удобная auditability

### 2.2 Snapshot for Historical Accuracy
Все order-related данные, которые могут измениться после оформления заказа, должны snapshot-иться.

В заказе нельзя полагаться на текущее состояние:
- product title
- variant label
- price
- old_price
- media preview
- store title

### 2.3 Variant as Purchasable Unit
Покупаемой единицей считается не product как абстракция, а конкретный variant.

Даже если у товара один вариант, модель всё равно должна поддерживать variant-level stock/SKU/order line behavior.

### 2.4 Soft Delete Where Needed
Для некоторых сущностей нужен soft delete:
- stores
- products
- variants
- chats
- users

Но для критичных transactional tables soft delete нужно использовать осторожно.

### 2.5 Auditability
Ключевые действия должны быть либо отражены в audit tables, либо сопровождаться event log / action log.

---

## 3. High-Level Entity Map

Основные домены и таблицы:

### Identity
- users
- user_sessions
- otp_requests
- user_devices

### Seller/Store
- sellers
- seller_verification_documents
- stores
- store_contacts
- store_delivery_settings

### Catalog
- global_categories
- store_categories

### Product
- products
- product_images
- product_option_groups
- product_option_values
- product_variants
- product_variant_option_values
- inventory_movements

### Buyer / Checkout
- buyers
- buyer_addresses
- carts
- cart_items

### Orders
- orders
- order_items
- order_status_history

### Chat
- chat_threads
- chat_messages
- chat_message_attachments
- chat_participants

### Notifications
- notification_preferences
- push_subscriptions
- notification_logs

### Admin / Moderation
- admin_users
- moderation_cases
- moderation_actions
- audit_logs

### Analytics / Event Tracking
- analytics_events

---

## 4. Identity Model

## 4.1 users

Единая таблица базовой identity.

```sql
users (
  id uuid pk,
  role varchar(20) not null, -- buyer, seller, admin
  phone varchar(32) unique,
  email varchar(255) null,
  password_hash varchar(255) null,
  status varchar(20) not null default 'active',
  is_phone_verified boolean not null default false,
  language_code varchar(10) not null default 'ru',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null
)

buyers (
  id uuid pk,
  user_id uuid unique not null references users(id),
  first_name varchar(100) null,
  last_name varchar(100) null,
  telegram_username varchar(100) null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

sellers (
  id uuid pk,
  user_id uuid unique not null references users(id),
  full_name varchar(255) not null,
  seller_type varchar(20) not null, -- individual, business
  telegram_username varchar(100) not null,
  telegram_chat_id bigint null,              -- получается когда seller пишет боту
  telegram_notifications_active boolean not null default false,
  verification_status varchar(20) not null default 'pending',
  is_blocked boolean not null default false,
  blocked_reason text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

otp_requests (
  id uuid pk,
  phone varchar(32) not null,
  code_hash varchar(255) not null,
  purpose varchar(30) not null, -- login, register, checkout
  expires_at timestamptz not null,
  consumed_at timestamptz null,
  created_at timestamptz not null
)

user_sessions (
  id uuid pk,
  user_id uuid not null references users(id),
  refresh_token_hash varchar(255) not null,
  device_type varchar(20) null, -- web, ios, android
  device_name varchar(255) null,
  ip_address inet null,
  user_agent text null,
  last_seen_at timestamptz not null,
  expires_at timestamptz not null,
  created_at timestamptz not null
)

stores (
  id uuid pk,
  seller_id uuid unique not null references sellers(id),
  name varchar(255) not null,
  slug varchar(255) unique not null,
  description text null,
  logo_media_id uuid null,
  cover_media_id uuid null,
  status varchar(20) not null default 'draft',
  primary_global_category_id uuid null references global_categories(id),
  city varchar(100) not null,
  region varchar(100) null,
  telegram_contact_link varchar(255) not null,
  is_public boolean not null default false,
  published_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null
)

seller_verification_documents (
  id uuid pk,
  seller_id uuid not null references sellers(id),
  document_type varchar(50) not null, -- passport, business_doc, other
  media_id uuid not null,
  status varchar(20) not null default 'pending',
  admin_comment text null,
  created_at timestamptz not null,
  reviewed_at timestamptz null
)

store_contacts (
  id uuid pk,
  store_id uuid not null references stores(id),
  contact_type varchar(30) not null, -- phone, telegram, instagram, other
  label varchar(100) null,
  value varchar(255) not null,
  is_primary boolean not null default false,
  created_at timestamptz not null
)

store_delivery_settings (
  id uuid pk,
  store_id uuid unique not null references stores(id),
  supports_delivery boolean not null default true,
  supports_pickup boolean not null default false,
  delivery_fee_type varchar(20) not null default 'fixed', -- fixed, manual, none
  fixed_delivery_fee numeric(12,2) null,
  delivery_notes text null,
  pickup_notes text null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

global_categories (
  id uuid pk,
  parent_id uuid null references global_categories(id),
  name_ru varchar(255) not null,
  name_uz varchar(255) not null,
  slug varchar(255) unique not null,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null
)

store_categories (
  id uuid pk,
  store_id uuid not null references stores(id),
  parent_id uuid null references store_categories(id),
  name varchar(255) not null,
  slug varchar(255) not null,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (store_id, slug)
)

products (
  id uuid pk,
  store_id uuid not null references stores(id),
  global_category_id uuid null references global_categories(id),
  store_category_id uuid null references store_categories(id),
  title varchar(255) not null,
  description text null,
  base_price numeric(12,2) not null,
  old_price numeric(12,2) null,
  sale_price numeric(12,2) null,
  currency_code varchar(10) not null default 'UZS',
  status varchar(20) not null default 'draft',
  has_variants boolean not null default false,
  total_stock int not null default 0,
  is_visible boolean not null default true,
  is_featured boolean not null default false,
  sku varchar(100) null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null
)

product_images (
  id uuid pk,
  product_id uuid not null references products(id),
  media_id uuid not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null
)

product_option_groups (
  id uuid pk,
  product_id uuid not null references products(id),
  name varchar(100) not null,
  code varchar(50) not null,
  sort_order int not null default 0,
  created_at timestamptz not null,
  unique (product_id, code)
)

product_option_values (
  id uuid pk,
  option_group_id uuid not null references product_option_groups(id),
  value varchar(100) not null,
  code varchar(50) not null,
  sort_order int not null default 0,
  created_at timestamptz not null,
  unique (option_group_id, code)
)

product_variants (
  id uuid pk,
  product_id uuid not null references products(id),
  sku varchar(100) not null,
  barcode varchar(100) null,
  title_override varchar(255) null,
  price_override numeric(12,2) null,
  old_price_override numeric(12,2) null,
  sale_price_override numeric(12,2) null,
  stock_quantity int not null default 0,
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  deleted_at timestamptz null,
  unique (product_id, sku)
)

product_variant_option_values (
  variant_id uuid not null references product_variants(id),
  option_value_id uuid not null references product_option_values(id),
  primary key (variant_id, option_value_id)
)

variant_images (
  id uuid pk,
  variant_id uuid not null references product_variants(id),
  media_id uuid not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null
)

inventory_movements (
  id uuid pk,
  product_id uuid not null references products(id),
  variant_id uuid null references product_variants(id),
  movement_type varchar(30) not null, -- manual_adjustment, order_reserved, order_released, order_completed
  quantity_delta int not null,
  reference_type varchar(30) null, -- order, admin, seller
  reference_id uuid null,
  note text null,
  created_at timestamptz not null
)

buyer_addresses (
  id uuid pk,
  buyer_id uuid not null references buyers(id),
  label varchar(100) null,
  full_name varchar(255) not null,
  phone varchar(32) not null,
  city varchar(100) not null,
  region varchar(100) null,
  address_line_1 varchar(255) not null,
  address_line_2 varchar(255) null,
  landmark varchar(255) null,
  postal_code varchar(20) null,
  is_default boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

carts (
  id uuid pk,
  buyer_id uuid null references buyers(id),
  session_key varchar(255) null,
  store_id uuid not null references stores(id),
  status varchar(20) not null default 'active',
  currency_code varchar(10) not null default 'UZS',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  expires_at timestamptz null
)

cart_items (
  id uuid pk,
  cart_id uuid not null references carts(id),
  product_id uuid not null references products(id),
  variant_id uuid null references product_variants(id),
  quantity int not null,
  unit_price_snapshot numeric(12,2) not null,
  sale_price_snapshot numeric(12,2) null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (cart_id, variant_id)
)

orders (
  id uuid pk,
  order_number varchar(50) unique not null,
  buyer_id uuid null references buyers(id),
  store_id uuid not null references stores(id),
  seller_id uuid not null references sellers(id),
  cart_id uuid null references carts(id),
  status varchar(20) not null default 'pending',
  payment_method varchar(30) not null, -- cod, manual_transfer, online
  payment_status varchar(20) not null default 'unpaid',
  currency_code varchar(10) not null default 'UZS',
  subtotal_amount numeric(12,2) not null,
  discount_amount numeric(12,2) not null default 0,
  delivery_fee_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null,
  delivery_type varchar(20) not null, -- delivery, pickup
  customer_full_name varchar(255) not null,
  customer_phone varchar(32) not null,
  customer_comment text null,
  city varchar(100) null,
  region varchar(100) null,
  address_line_1 varchar(255) null,
  address_line_2 varchar(255) null,
  landmark varchar(255) null,
  placed_at timestamptz not null,
  confirmed_at timestamptz null,
  cancelled_at timestamptz null,
  completed_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

order_items (
  id uuid pk,
  order_id uuid not null references orders(id),
  product_id uuid null references products(id),
  variant_id uuid null references product_variants(id),
  product_title_snapshot varchar(255) not null,
  product_description_snapshot text null,
  sku_snapshot varchar(100) null,
  variant_label_snapshot varchar(255) null,
  quantity int not null,
  unit_price_snapshot numeric(12,2) not null,
  old_price_snapshot numeric(12,2) null,
  sale_price_snapshot numeric(12,2) null,
  line_total_amount numeric(12,2) not null,
  primary_image_url_snapshot text null,
  created_at timestamptz not null
)

order_status_history (
  id uuid pk,
  order_id uuid not null references orders(id),
  old_status varchar(20) null,
  new_status varchar(20) not null,
  changed_by_user_id uuid null references users(id),
  comment text null,
  created_at timestamptz not null
)

chat_threads (
  id uuid pk,
  thread_type varchar(20) not null, -- product, order
  product_id uuid null references products(id),
  order_id uuid null references orders(id),
  buyer_id uuid null references buyers(id),
  seller_id uuid not null references sellers(id),
  status varchar(20) not null default 'active',
  last_message_id uuid null,
  last_message_at timestamptz null,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

chat_messages (
  id uuid pk,
  thread_id uuid not null references chat_threads(id),
  sender_user_id uuid not null references users(id),
  message_type varchar(20) not null default 'text', -- text, image, system
  body text null,
  product_context_id uuid null references products(id),
  order_context_id uuid null references orders(id),
  is_deleted boolean not null default false,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

notification_preferences (
  id uuid pk,
  user_id uuid unique not null references users(id),
  mobile_push_enabled boolean not null default true,
  web_push_enabled boolean not null default true,
  telegram_enabled boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

push_subscriptions (
  id uuid pk,
  user_id uuid not null references users(id),
  platform varchar(20) not null, -- ios, android, web
  provider varchar(20) not null, -- expo, fcm, webpush
  endpoint text not null,
  p256dh text null,
  auth text null,
  device_name varchar(255) null,
  is_active boolean not null default true,
  created_at timestamptz not null,
  updated_at timestamptz not null
)

notification_logs (
  id uuid pk,
  user_id uuid not null references users(id),
  channel varchar(20) not null, -- mobile_push, web_push, telegram
  event_type varchar(50) not null,
  payload jsonb not null,
  delivery_status varchar(20) not null, -- queued, sent, failed
  failure_reason text null,
  sent_at timestamptz null,
  created_at timestamptz not null
)

media_files (
  id uuid pk,
  owner_user_id uuid null references users(id),
  bucket varchar(50) not null,
  object_key varchar(500) not null,
  mime_type varchar(100) not null,
  file_size bigint not null,
  width int null,
  height int null,
  visibility varchar(20) not null default 'public', -- public, protected, private
  created_at timestamptz not null
)

admin_users (
  id uuid pk,
  user_id uuid unique not null references users(id),
  is_superadmin boolean not null default true,
  created_at timestamptz not null
)

moderation_cases (
  id uuid pk,
  entity_type varchar(30) not null, -- seller, store, product, message
  entity_id uuid not null,
  case_type varchar(30) not null, -- verification, abuse, manual_review
  status varchar(20) not null default 'open',
  reason text null,
  assigned_admin_user_id uuid null references admin_users(id),
  created_at timestamptz not null,
  updated_at timestamptz not null
)

moderation_actions (
  id uuid pk,
  case_id uuid null references moderation_cases(id),
  entity_type varchar(30) not null,
  entity_id uuid not null,
  action_type varchar(30) not null, -- approve, reject, hide, suspend, restore, block
  admin_user_id uuid not null references admin_users(id),
  comment text null,
  created_at timestamptz not null
)

audit_logs (
  id uuid pk,
  actor_user_id uuid null references users(id),
  actor_type varchar(20) not null, -- buyer, seller, admin, system
  entity_type varchar(30) not null,
  entity_id uuid not null,
  action varchar(50) not null,
  payload jsonb null,
  created_at timestamptz not null
)

analytics_events (
  id uuid pk,
  actor_user_id uuid null references users(id),
  actor_type varchar(20) null,
  store_id uuid null references stores(id),
  event_name varchar(100) not null,
  event_payload jsonb not null default '{}'::jsonb,
  session_key varchar(255) null,
  created_at timestamptz not null
)

15. Recommended Constraints and Rules
15.1 One Cart = One Store

На уровне backend должно быть жёсткое правило:

cart принадлежит одному store

cart_items не могут ссылаться на product/variant из другого store

Это проверяется сервисным слоем и, по возможности, усиливается DB-level checks через joins/service validation.

15.2 One Store per Seller on MVP

На уровне V0.1:

stores.seller_id unique

15.3 Product Belongs to Store

каждый product принадлежит одному store

варианты не могут существовать без product

15.4 Order Belongs to One Seller

orders.store_id

orders.seller_id

Это нужно для упрощения checkout, order management и chat flow.

16. Indexing Strategy

Ниже обязательные индексы, которые нужны уже на старте.

16.1 users

unique index on phone

index on role

index on status

16.2 stores

unique index on slug

index on seller_id

index on status

index on is_public

index on primary_global_category_id

16.3 products

index on store_id

index on global_category_id

index on store_category_id

index on status

index on is_visible

gin/trgm index on title later if search grows

16.4 product_variants

unique index on (product_id, sku)

index on product_id

index on is_active

index on stock_quantity

16.5 carts

index on buyer_id

index on session_key

index on store_id

index on status

16.6 cart_items

index on cart_id

index on product_id

index on variant_id

16.7 orders

unique index on order_number

index on buyer_id

index on store_id

index on seller_id

index on status

index on payment_status

index on placed_at

16.8 order_items

index on order_id

index on product_id

index on variant_id

16.9 chat_threads

index on buyer_id

index on seller_id

index on product_id

index on order_id

index on last_message_at

16.10 chat_messages

index on thread_id

index on sender_user_id

index on created_at

16.11 notification_logs

index on user_id

index on channel

index on event_type

index on delivery_status

16.12 analytics_events

index on actor_user_id

index on store_id

index on event_name

index on created_at

17. Recommended PostgreSQL Conventions
17.1 IDs

Рекомендуется использовать uuid для всех публичных сущностей.

17.2 Timestamps

Во всех таблицах использовать timestamptz.

17.3 Money

Использовать numeric(12,2), а не float/double.

17.4 Status Fields

Статусы можно хранить как varchar на MVP для гибкости.
На более зрелом этапе можно перейти к enum types, если это будет оправдано.

17.5 JSONB

Использовать jsonb только там, где действительно нужна гибкость:

analytics payload

audit payload

notification payload

Ключевую бизнес-логику нельзя прятать в jsonb.

18. Transaction-Critical Flows
18.1 Create Order

В одной транзакции должно происходить:

валидация cart

валидация stock

создание order

создание order_items snapshots

обновление cart status

запись order_status_history

при необходимости запись inventory movement

18.2 Seller Approval

В одной транзакции:

update seller verification_status

update store status/is_public

create moderation action

create audit log

18.3 Message Send

В одной транзакции:

create chat_message

create attachments if any metadata already known

update chat_thread.last_message_at

update unread counters metadata if stored synchronously

19. Future-Ready Tables for V0.2+

Следующие сущности пока можно не реализовывать физически, но architecture должна учитывать их появление:

payments

payment_transactions

refunds

coupons

seller_subscriptions

subscription_plans

store_themes

product_reviews

reports

saved_items / wishlist

20. Final Recommendations

Для V0.1 MVP база должна строиться вокруг следующих базовых принципов:

seller/store-centric model

product + variant separation

one-cart-one-store

order snapshots

chat threads tied to product/order context

moderation-first store activation

event/audit visibility

index discipline from day one