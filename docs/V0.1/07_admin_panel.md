# 07_admin_panel.md

## 1. Admin Panel Overview

Admin panel — это отдельная управленческая поверхность платформы с полным доступом ко всем ключевым доменам системы.

На V0.1 поддерживается только один тип администратора:
- superadmin

Это означает, что админ-панель должна уже на первом этапе уметь:
- просматривать и изменять все основные сущности
- модерировать sellers и stores
- контролировать товары
- просматривать заказы
- просматривать чаты
- выполнять блокировки, скрытия, одобрения и отклонения
- видеть системное состояние платформы

Admin panel не является “красивым кабинетом с цифрами”.  
Это operational control center для продукта.

---

## 2. Main Goals

Основные цели admin panel на V0.1:

- обеспечить контроль качества sellers и storefronts
- дать ручные инструменты для модерации и вмешательства
- обеспечить прозрачность по заказам и чатам
- дать полный обзор по критическим сущностям
- поддержать запуск MVP без потери контроля над системой

На ранней стадии стартапа именно admin panel часто закрывает те пробелы, которые ещё не автоматизированы продуктом.

---

## 3. Admin Surface Principles

### 3.1 Full Visibility
Админ должен иметь возможность видеть:
- sellers
- stores
- products
- variants
- orders
- chats
- notifications logs
- moderation cases
- audit logs

### 3.2 Manual Intervention First
На V0.1 много процессов ещё не будут полностью автоматизированы, поэтому админ-панель должна позволять:
- исправлять критичные состояния вручную
- принимать moderation decisions
- быстро реагировать на abuse или ошибки

### 3.3 Clarity Over Beauty
Для admin panel важнее:
- читабельность
- фильтрация
- скорость доступа к действиям
- история изменений

Чем визуальная “нарядность”.

### 3.4 Safe Destructive Actions
Все опасные действия должны иметь:
- подтверждение
- понятное описание последствий
- запись в audit log

---

## 4. Recommended Stack

- Next.js
- TypeScript
- Tailwind CSS
- TanStack Query
- React Hook Form
- Zod
- Data table layer
- Role/guarded route middleware
- WebSocket optional for live operational indicators

### Why Separate Admin App
Admin panel должна жить отдельно от buyer/seller web surface, потому что:
- другой security perimeter
- другой routing
- другой набор dependencies
- другой operational purpose
- меньше риск случайного пересечения с публичными интерфейсами

---

## 5. Admin Panel Scope

На V0.1 admin panel должна покрывать следующие домены:

- authentication
- dashboard / overview
- sellers
- stores
- products
- orders
- chats
- moderation
- notifications visibility
- media review visibility
- audit logs
- system settings basics

---

## 6. Route Structure

### Suggested route structure

```bash
/app
  /(admin)
    /login
    /dashboard
    /sellers
    /sellers/[id]
    /stores
    /stores/[id]
    /products
    /products/[id]
    /orders
    /orders/[id]
    /chats
    /chats/[id]
    /moderation
    /moderation/[caseId]
    /notifications
    /audit-logs
    /settings

Notes

every route must be fully protected

admin auth is separate from seller/buyer auth

dashboard is operational entry point, not vanity landing page

7. Admin Authentication
7.1 Auth Model

На V0.1 admin authentication должна быть отдельной от обычного seller/buyer auth flow, даже если backend identity model частично общая.

Requirements

admin-only login surface

admin-only session validation

stronger session monitoring

explicit logout

audit of admin login attempts where possible

7.2 Session Security

Минимальные требования:

refresh token lifecycle

short-lived access token

protected route middleware

forced logout on invalid session

no reuse of seller dashboard auth context

8. Admin Dashboard
8.1 Purpose

Главная страница admin panel должна быстро показывать operational state платформы.

Это не место для перегруженной BI-аналітики.

8.2 Recommended Dashboard Blocks

sellers pending verification

stores pending review

recent orders

unread / recent chats indicator

suspended stores count

hidden products count

recent moderation actions

system alerts if any

8.3 Dashboard Principle

Главная задача dashboard:
дать супер-админу быстрый ответ на вопрос
“что сейчас требует моего внимания?”

9. Seller Management
9.1 Sellers List

Таблица sellers должна включать:

seller id

full name

phone

telegram username

verification status

blocked status

created date

linked store

quick actions

Required filters

pending

approved

rejected

blocked

by date

by store status

9.2 Seller Detail Page

Должна показывать:

seller profile

verification status

uploaded documents

linked store

moderation history

orders summary

chats access link

actions history

9.3 Seller Actions

Admin должен уметь:

approve seller

reject seller

block seller

unblock seller

suspend seller store access if needed

add moderation comment

Все действия должны логироваться.

10. Store Management
10.1 Stores List

Список магазинов должен показывать:

store name

slug

seller

public status

moderation status

primary category

created date

publication date

quick actions

Required filters

draft

pending_review

approved

rejected

suspended

public/non-public

10.2 Store Detail Page

Должна включать:

store info

description

logo

contacts

telegram link

delivery settings

status history

seller linkage

products summary

moderation history

10.3 Store Actions

Admin должен уметь:

approve store

reject store

suspend store

restore store

unpublish store

edit moderation note

11. Product Management
11.1 Products List

Список товаров должен включать:

product title

store

seller

category

status

visibility

stock summary

created date

quick actions

Required filters

by store

by seller

active

hidden

draft

low stock optional later

category

date range

11.2 Product Detail

Должен показывать:

full product info

images

prices

variants

SKU

stock

category mapping

store linkage

moderation actions history

11.3 Product Actions

Admin должен уметь:

hide product

restore product

archive product

inspect variant-level data

review suspicious or invalid content

V0.1 Principle

Pre-approval каждого товара не требуется, но admin должен иметь быстрый способ скрыть проблемный товар.

12. Order Management
12.1 Orders List

Список заказов должен включать:

order number

buyer

seller

store

total amount

payment method

status

created date

quick link to chat

Filters

pending

confirmed

cancelled

completed

payment method

by store

by seller

by date

12.2 Order Detail

Должен показывать:

status timeline

item snapshots

buyer info

address / pickup

comments

payment method

linked chat

linked seller/store

12.3 Admin Order Actions

На V0.1 админ должен в первую очередь видеть и разбирать order states, а не массово управлять ими.

Допустимые действия:

inspect order

manually update status only if policy allows

add internal note later

access related chat

inspect order history

Caution

Нельзя давать слишком лёгкое изменение order state без audit trail.

13. Chat Management
13.1 Why Admin Needs Chat Access

Так как в системе есть buyer ↔ seller communication, админ должен иметь возможность:

разбирать жалобы

видеть контекст заказа

проверять спорные ситуации

реагировать на abuse

13.2 Chats List

Список чатов должен включать:

thread id

thread type (product/order)

buyer

seller

related product/order

last message time

message count optional

status

Filters

thread type

by seller

by buyer

by store

recent activity

13.3 Chat Detail

Должен показывать:

participants

message timeline

attachments

product/order context

related order/store/seller links

13.4 Admin Chat Actions

На V0.1 минимум:

read thread

inspect attachments

see context

create moderation case from thread later if needed

По умолчанию admin не должен “общаться вместо seller-а”, если это не отдельная сознательная функция будущих версий.

14. Moderation Center
14.1 Purpose

Moderation section — это ядро admin panel на MVP.

Она должна собирать всё, что требует review:

seller verification

store publication review

suspicious content

manual cases

14.2 Moderation Queue

Queue должна показывать:

entity type

entity id

case type

current status

created at

assigned admin if assignment later появится

priority optional later

14.3 Moderation Case Detail

Должен показывать:

what is under review

related entity snapshot

seller/store/product links

previous actions

admin comments

decision buttons

14.4 Moderation Actions

approve

reject

suspend

hide

restore

request change later if needed

Каждое действие:

должно сохранять comment/reason if required

должно писать moderation action record

должно писать audit log

15. Audit Logs
15.1 Why Mandatory

Admin panel without audit logs быстро становится опасной.

Нужно всегда знать:

кто сделал действие

над какой сущностью

когда

с каким payload/comment

15.2 Audit Log View

Должен содержать:

actor

actor type

entity type

entity id

action

timestamp

payload preview

Filters

by admin

by entity type

by action

by date

15.3 Required Logged Actions

seller approval/rejection

store approval/rejection

product hide/restore

store suspend/restore

admin login optional

manual order interventions

settings changes

16. Notifications Visibility

Admin не обязательно должен управлять всеми уведомлениями вручную, но должен видеть их operationally.

16.1 Notifications View

Может включать:

recent notification logs

channel

recipient

event type

delivery status

failure reason

16.2 Purpose

Это нужно для:

отладки push

отладки Telegram notifications

разбора delivery failures

17. Media Visibility
17.1 Why Needed

Admin должен видеть:

product images

store branding

seller documents

chat attachments where relevant

17.2 Rules

Нужен контролируемый просмотр:

public media easily visible

protected verification docs only in admin context

media must be linked to owning entity

18. Search and Filtering

Admin panel без сильной фильтрации быстро станет бесполезной.

18.1 Required Searchable Domains

sellers

stores

products

orders

chats

18.2 Search Inputs

На V0.1 достаточно:

id search

phone search

slug search

order number search

seller/store/product name search

18.3 Filtering Principles

filters must be persistent in URL where practical

tables must support pagination

default sorting should be operationally useful

19. Table / List Design

Большая часть admin panel будет table-driven.

19.1 Table Requirements

pagination

sorting

filters

row actions

bulk actions optional later

clickable row to detail page

19.2 Avoid

giant unpaginated tables

hidden critical info behind too many clicks

unstable column layouts

action overload in every row

20. Admin UX Principles

operational speed > visual decoration

status color coding should be clear

destructive actions should be obvious

details pages should connect related entities

moderation should take as few steps as possible

dashboard should surface urgent work

no ambiguity in system states

Important

Admin panel должна помогать удерживать качество продукта вручную там, где автоматизация ещё не зрелая.

21. Security Requirements
21.1 Critical Rules

admin panel must be isolated from public surface

all routes protected

all actions server-authorized

no client-only trust

admin sessions should be auditable

sensitive pages should never leak data in public contexts

21.2 Dangerous Actions

Следующие действия требуют особой осторожности:

block seller

suspend store

hide product

manual order status override

access protected documents

Для них нужны:

explicit confirm modal

strong audit logging

clear UI wording

22. Performance Requirements

На MVP admin panel должна быть быстрой в operational paths:

pending sellers list

store review page

product inspection

orders list

chat detail

Recommended techniques

server-side pagination

filter-driven queries

detail fetch by id

avoid loading giant nested payloads in list view

defer heavy relations until detail page

23. Localization

Admin panel можно запускать на одном основном языке интерфейса на первом внутреннем этапе, но архитектурно лучше поддерживать RU/UZ и здесь тоже.

Minimum requirement

статусы и системные labels должны быть консистентны

admin-created moderation reasons should be clear and structured

if bilingual support is added, key system dictionaries should already be externalized

24. Realtime Needs

Admin panel не требует deep realtime everywhere, но некоторые live indicators полезны:

new pending seller

new moderation case

recent order activity optional

new urgent issue indicators later

Для V0.1 допустимо:

periodic refetch

targeted realtime only where beneficial

25. Recommended Build Order

admin auth

dashboard overview

sellers list/detail

stores list/detail

moderation queue/detail

products list/detail

orders list/detail

chats list/detail

audit logs

notifications visibility

settings basics

26. Testing Priorities
26.1 Critical Admin Flows

login

approve seller

reject seller

approve store

suspend store

hide product

inspect order

inspect chat

write audit entry for destructive actions

26.2 Test Principle

Для admin panel особенно важно тестировать:

permission correctness

destructive action correctness

audit correctness

relation navigation correctness

27. Future Expansion Directions

После V0.1 admin panel может вырасти в:

role-based admin system

support/moderator roles

report/dispute center

fraud review center

payout/payment review

content moderation tooling

system config center

analytics center

Но на MVP этого раздувать не нужно.

28. Final Admin Rules

admin panel is a control surface, not a decorative dashboard

superadmin must see every critical domain

moderation and auditability are first-class requirements

destructive actions must be safe, explicit and logged

order, seller, store, product and chat visibility are mandatory

admin security must be stronger than seller/buyer security

filtering and operational clarity matter more than visual complexity

Главная цель admin panel:
дать платформе ручной operational backbone, который позволит безопасно запустить и контролировать продукт до того, как большинство процессов будут автоматизированы.