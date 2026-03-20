# 08_realtime_chat.md

## 1. Realtime and Chat Overview

Realtime-слой в проекте нужен не “для красоты”, а для поддержки ключевых продуктовых сценариев, где задержка и асинхронность напрямую влияют на качество опыта.

На V0.1 realtime нужен прежде всего для:

- buyer ↔ seller chat
- unread counters
- new order alerts for seller
- order status updates where appropriate
- in-app notification signals

Главная realtime-функция MVP — это чат.  
Именно он требует самой чёткой архитектуры, потому что здесь легко допустить ошибки в:
- доставке сообщений
- порядке сообщений
- unread state
- reconnect behavior
- security
- context binding to product/order

---

## 2. Scope of Realtime on V0.1

## 2.1 In Scope
- product inquiry chat
- order chat
- realtime delivery of new messages
- realtime unread count updates
- seller new order alerts
- buyer/seller order status updates in-app
- web/mobile sync of chat state
- push trigger on offline recipient

## 2.2 Out of Scope
- group chats
- voice messages
- calls
- reactions
- typing indicators
- read receipts with complex multi-state semantics
- ephemeral messaging
- message editing history UI
- chat search across all history
- full messenger replacement

V0.1 не должен превращаться в “Telegram inside the app”.  
Нужен узкий, надёжный commerce-chat.

---

## 3. Chat Product Model

В системе поддерживается два основных типа чатов:

### 3.1 Product Inquiry Thread
Чат, связанный с конкретным товаром до покупки.

Используется для вопросов типа:
- есть ли этот размер?
- оригинал ли товар?
- есть ли другой цвет?
- можно ли уточнить характеристики?

### 3.2 Order Thread
Чат, связанный с конкретным заказом после оформления.

Используется для:
- уточнения деталей заказа
- подтверждения
- комментариев по доставке / pickup
- ручного post-order взаимодействия

### 3.3 Why Separate Thread Types
Это даёт:
- ясный контекст
- понятную связь с доменной моделью
- возможность в будущем разной политики для order/product threads
- корректную навигацию из order/product screens

---

## 4. Realtime Architecture Overview

## 4.1 Main Components

Realtime-архитектура состоит из:

- HTTP API for initial state and persistence-backed fetch
- WebSocket layer for live events
- PostgreSQL for durable message storage
- Redis for queueing and future websocket scaling
- Push notification layer for offline recipients

## 4.2 Core Principle

HTTP = source for initial fetch and recovery  
WebSocket = transport for live updates

Нельзя строить чат так, будто websocket — единственный источник истины.  
Истина всегда в persistent storage.

---

## 5. Recommended Tech Stack

- NestJS WebSocket Gateway
- Socket.IO
- Redis
- BullMQ
- PostgreSQL
- Expo push / FCM / APNs / web push via notification layer

### Why Socket.IO for V0.1
- быстрый production MVP старт
- room model
- reconnect support
- ack support
- mature ecosystem
- удобнее для mixed web/mobile rollout

Если проект позже упрётся в жёсткие масштабы, transport layer можно будет переосмыслить, но для V0.1 это хороший выбор.

---

## 6. Realtime Surface Responsibilities

## 6.1 HTTP Responsibilities
HTTP endpoints отвечают за:
- list chat threads
- get thread details
- get paginated message history
- create thread if needed
- upload attachments
- fetch unread summary
- recover state after reconnect

## 6.2 WebSocket Responsibilities
WebSocket отвечает за:
- new message delivery
- unread counters broadcast
- live thread updates
- direct user event fanout
- seller new order event delivery
- order status change fanout

---

## 7. Gateway Structure

### Suggested structure

```bash
/src/realtime
  /gateways
    chat.gateway.ts
    notifications.gateway.ts
  /auth
    ws-auth.guard.ts
    ws-session.service.ts
  /events
    chat.events.ts
    notification.events.ts
  /adapters
    redis-io.adapter.ts

Separation Principle

chat gateway handles chat rooms and messages

notifications gateway handles direct user-level events

auth layer validates token and actor identity

domain services remain outside gateway

Gateway не должен содержать core business logic.

8. WebSocket Authentication
8.1 Required Strategy

Каждое websocket connection должно быть аутентифицировано.

Recommended flow

client connects with access token in handshake

server validates token

server resolves user identity

server attaches user context to socket

invalid token = reject connection

8.2 Actor Types

Realtime-соединения поддерживаются для:

buyer

seller

admin where needed

Important

Guest browsing without identity не должен получать полноценный authenticated chat socket context.
Для чата нужна устойчивая identity.

9. Room Model

Room strategy должна быть простой и предсказуемой.

9.1 User Rooms

Каждый аутентифицированный actor подключается к room:

user:{userId}

Используется для:

direct notifications

unread counters

order status events

global chat badges

9.2 Thread Rooms

Каждый thread имеет room:

thread:{threadId}

Используется для:

new messages

message status reconciliation

live thread participants sync

9.3 Order Rooms

Опционально для удобства:

order:{orderId}

Можно использовать для order-specific in-app updates, но на V0.1 это не всегда обязательно, если уже есть user-room + thread-room.

10. Thread Lifecycle
10.1 Product Thread Creation

Product thread создаётся, когда buyer начинает product inquiry.

Flow:

buyer initiates chat from product page

backend checks if suitable thread already exists for buyer + seller + product

if yes → returns existing thread

if no → creates new thread

participants created

thread becomes available via HTTP and websocket

10.2 Order Thread Creation

Order thread может:

создаваться автоматически при создании order
или

лениво создаваться при первом открытии chat from order

Для V0.1 предпочтительнее:

создавать order thread автоматически at order creation or immediately after

Плюсы:

predictable UX

easier linking from order detail

simpler push logic

11. Message Model
11.1 Supported Message Types

На V0.1:

text

image

system

text

Обычное текстовое сообщение

image

Сообщение с изображением или attachment reference

system

Системные сообщения, например:

order created

order confirmed

seller joined thread optional later

На старте system messages можно использовать ограниченно.

12. Message Send Flow
12.1 Canonical Flow

client prepares message

optional attachment upload happens first

client emits chat:send_message

gateway authenticates and validates actor

service validates actor participation in thread

message persists to DB in transaction

thread metadata updates

unread counters update

recipients in thread room / user room notified

offline notification job enqueued if needed

12.2 Required Acknowledgement

Socket emission должна иметь ack/response semantics.

Клиенту нужно знать:

accepted

rejected

failed validation

unauthorized

server error

Why

Иначе mobile/web UI не сможет нормально reconcile optimistic messages.

13. Message Delivery Guarantees

На V0.1 цель — practical reliability, а не distributed-systems perfection.

13.1 Guaranteed by System

persisted messages survive reconnect

delivered live if recipient connected

recoverable via HTTP history if live delivery missed

push may notify offline recipient

13.2 Not Guaranteed on V0.1

exactly-once delivery across all network edge cases

full sync under every race condition without refetch

advanced duplicate suppression beyond sane safeguards

Required principle

Система должна быть idempotent enough and recoverable enough.

14. Message Ordering
14.1 Source of Order

Порядок сообщений определяется persisted created_at + stable message id ordering.

UI не должен полагаться только на arrival order over websocket.

14.2 Practical Strategy

server assigns canonical timestamp/order

client sorts by server message metadata

optimistic local messages reconciled when server responds

Это особенно важно при reconnect и multi-device usage.

15. Unread Counter Model

Unread counters — одна из самых легко ломающихся частей чата.

15.1 Required Behaviors

buyer sees unread threads/messages

seller sees unread threads/messages

counts update when new message arrives

counts reset or decrease when thread is read

multi-device state remains sane

15.2 Recommended Source of Truth

Unread counts should be persisted or derived from durable state, not only ephemeral socket memory.

Minimum durable data

per participant last_read_message_id

or equivalent read cursor

From this:

unread count can be computed or cached

15.3 Realtime Updates

Realtime delivers:

thread unread badge update

global unread badge update

But on reconnect:

client should refetch authoritative unread summary

16. Read State Strategy
16.1 V0.1 Simplicity

На V0.1 достаточно read state без сложных “seen/read/delivered” статусов на каждое сообщение.

Нужна модель:

thread last read cursor per participant

16.2 Read Flow

user opens thread

client fetches latest messages

client emits/read API call marks thread as read up to message X

server updates participant read cursor

unread counters recomputed

other UI surfaces updated

Important

Не нужно на V0.1 строить WhatsApp-level read receipts.

17. Attachments Strategy
17.1 Supported Attachments

На V0.1:

images only

17.2 Upload Model (Canonical Flow)

1. User выбирает изображение
2. Client сжимает до разумного размера (max 1.5MB рекомендуется на клиенте)
3. Client отправляет `POST /api/v1/media/upload` с `purpose=chat`
4. Backend валидирует: actor аутентифицирован, mime type, размер
5. Backend сохраняет в storage, создаёт `media_files` запись
6. Backend возвращает `{ mediaId, url }` — где `url` для отображения
7. Client отправляет через Socket.IO: `chat:send_message` с `attachmentMediaId`
8. Gateway/service создаёт `chat_messages` запись с `attachment` metadata
9. Realtime fanout отправляет другим участникам `chat:message_created` payload

**Chat image access:**
- Chat images хранятся в `protected/chat/` namespace
- Для отображения в UI backend генерирует **short-lived signed URL** (TTL: 1 час)
- URL включается в message payload при первой загрузке истории
- При reconnect/refetch client получает новые signed URLs автоматически
- Прямой доступ без signed URL → 403

17.3 Why Not Raw WebSocket File Transport

Потому что:

хуже контролировать размер/валидацию

сложнее retries

сложнее security

нестабильно на слабой сети

**Практически:** даже при 2G/3G upload через HTTP с progress bar надёжнее, чем через WebSocket

18. Product Context in Chat
18.1 Product Thread Context

Каждый product thread должен явно знать:

product id

store id / seller id

buyer id

UI должен показывать:

product preview

title

maybe selected product context

18.2 Why Important

Это даёт:

понятность для seller-а

возможность быстро открыть товар

меньше путаницы при нескольких диалогах

19. Order Context in Chat
19.1 Order Thread Context

Order thread должен быть жёстко связан с order.

UI должен показывать:

order number

status

items preview

open order detail shortcut

19.2 Why Important

Потому что post-order communication без контекста быстро превращается в хаос.

20. Multi-Device Behavior

В системе может быть:

seller on mobile and web at once

buyer on web and mobile at once

20.1 Required Behaviors

new message should appear on all connected devices of same user

unread state should stay coherent enough

read action from one device should sync to others

reconnect should restore state

20.2 Strategy

Broadcast updates to:

thread room

user room

This allows:

active thread updates

badge updates across surfaces

21. Presence and Online Status

На V0.1 полноценный presence system не обязателен.

21.1 Not Required

online/offline badges

last seen

typing indicator

active now

Reason

Это усложняет систему, но не критично для commerce MVP.

21.2 If Added Later

Presence should be isolated as separate concern, not mixed into core message delivery logic.

22. Offline and Reconnect Handling
22.1 Client Principles

При потере соединения клиент должен:

mark socket disconnected

keep existing chat history visible

retry connection

refetch authoritative state after reconnect

22.2 Server Principles

После reconnect:

authenticate again

restore room membership

allow client to fetch thread delta/history

avoid trusting stale local unread state

22.3 Recovery Rule

Любое live состояние должно быть recoverable через normal HTTP APIs.

23. Order Alerts Through Realtime

Кроме чата realtime нужен для seller operational events.

23.1 New Order Event

Когда buyer creates order:

seller should receive immediate in-app event if online

seller should receive push/web push if offline or backgrounded

Event payload should include

order id

order number

amount

buyer name

created time

deep link target

23.2 Order Status Updates

Buyer should receive in-app event when:

order confirmed

order cancelled

order completed

Это может идти через user room rather than separate order rooms.

24. Notification Interaction with Realtime

Realtime и push — не конкуренты, а дополняющие механизмы.

24.1 Realtime Used When

app/tab active

socket connected

user currently online in app

24.2 Push Used When

app backgrounded

user offline

socket disconnected

extra attention needed

24.3 Principle

Realtime delivers immediacy
Push delivers reach

25. Security Model

Чат — чувствительная часть системы.
Нельзя ограничиться только “проверили токен”.

25.1 Required Checks on Every Send

actor authenticated

actor belongs to thread

actor allowed to access thread context

attachment reference belongs to actor or valid upload context

thread not blocked/suspended if such policy active

25.2 Required Checks on Thread Access

seller owns the thread through seller identity

buyer is the actual buyer in thread

admin access is explicitly elevated and audited where needed

25.3 Message Safety

sanitize text input

validate attachment type and size

reject unsupported message payloads

26. Moderation and Admin Access
26.1 Admin Read Access

Admin must be able to inspect thread history for moderation and dispute handling.

26.2 Audit Principle

Admin chat access should be treated as sensitive operational activity.
Where possible, admin access to sensitive threads should be logged or auditable.

26.3 No Silent Admin Participation

На V0.1 admin не должен по умолчанию становиться участником buyer-seller conversation.
Inspection and moderation are separate from active conversation.

27. Performance and Scaling
27.1 Expected Early Load

На MVP основной realtime load likely comes from:

moderate message throughput

bursty seller order alerts

multiple tabs/devices

unread fanout

27.2 First Bottlenecks

large hot threads

excessive unread recomputation

too many DB reads per message

websocket fanout if horizontally scaled without adapter

attachment-heavy chat if media path poor

27.3 Mitigation

keep thread payloads light

paginate history

denormalize only where justified

move side effects to queue

add Redis adapter when scaling horizontally

28. Redis Role in Realtime
28.1 On Early MVP

Redis может использоваться для:

BullMQ queues

light coordination

future socket scaling prep

28.2 When Horizontal Scaling Starts

Need:

Socket.IO Redis adapter

shared event bus for multi-instance delivery

Why

Без shared adapter один instance не знает room membership другого.

29. API Endpoints Supporting Chat
Suggested HTTP endpoints
GET    /api/v1/chat/threads
GET    /api/v1/chat/threads/:threadId
GET    /api/v1/chat/threads/:threadId/messages
POST   /api/v1/chat/threads/product
POST   /api/v1/chat/threads/:threadId/read
POST   /api/v1/media/upload-intent
Suggested WebSocket events
Client → Server

chat:join_thread

chat:leave_thread

chat:send_message

chat:mark_read

Server → Client

chat:message_created

chat:thread_updated

chat:unread_updated

order:new

order:status_updated

30. Event Payload Principles

Payloads должны быть:

compact

explicit

versionable if necessary

sufficient for UI update without overfetch

safe (no sensitive excess data)

Example message event payload

threadId

messageId

senderUserId

messageType

body or attachment refs

createdAt

context summary if needed

31. Testing Strategy
31.1 Critical Realtime Flows

create product inquiry thread

create order thread

send text message

send image message

unread updates

mark as read

reconnect and recover thread

multi-device message sync

seller receives new order in realtime

31.2 Failure Cases to Test

unauthorized thread access

socket reconnect

duplicate send attempts

stale token on socket

attachment upload failure before message send

offline recipient push fallback

admin reading thread

32. Observability and Logging

Realtime layer must be observable.

Recommended logs

socket connect/disconnect

auth failures

message send failures

thread access violations

push fallback enqueue

queue failures linked to message events

Metrics desirable later

active socket count

messages per minute

failed sends

reconnect rate

average message delivery latency

unread sync failures

33. Future Extensions

После V0.1 при необходимости можно добавлять:

typing indicators

read receipts UX

message deletion UX

richer attachments

chat search

canned seller replies

moderation escalation from message

CRM-like conversation tags

Но это не должно ломать базовую архитектуру.

34. Final Realtime and Chat Rules

websocket is for live delivery, not source of truth

persistent storage is the canonical history

chat must stay commerce-contextual, not become a general messenger

every thread must have explicit ownership and access rules

unread state must be recoverable and durable

offline delivery must rely on push fallback

attachments must go through media pipeline, not raw socket transport

reconnect and recovery are first-class requirements

admin access must be controlled and auditable

Главная цель realtime/chat слоя:
дать buyer-у и seller-у быстрый и понятный способ общаться внутри контекста товара и заказа, не теряя надёжность, безопасность и управляемость системы.