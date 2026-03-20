# 10_notifications.md

## 1. Notifications Overview

Notification layer в проекте — это не второстепенная функция, а один из ключевых operational механизмов платформы.

Уведомления нужны для того, чтобы:

- seller быстро узнавал о новом заказе
- buyer своевременно видел изменения по заказу
- buyer и seller не пропускали сообщения в чате
- admin при необходимости видел сбои и критичные события
- система оставалась удобной даже вне активной сессии

На V0.1 notifications должны работать как полноценный cross-surface механизм для:

- mobile push
- web push
- Telegram notifications for seller
- in-app live notifications through realtime layer

При этом email в проекте не используется.

---

## 2. Goals

Основные цели notification system на V0.1:

- доставлять критичные события быстро и надёжно
- различать online / offline scenarios
- не спамить пользователя лишними сообщениями
- быть управляемой и наблюдаемой
- поддерживать buyer, seller и admin operational flows
- быть расширяемой под будущие каналы и типы событий

---

## 3. Supported Notification Channels

## 3.1 Mobile Push
Используется для:
- buyer mobile
- seller mobile

Основные сценарии:
- new order for seller
- order status updates for buyer
- new chat message
- moderation decision for seller
- operational alerts where needed

## 3.2 Web Push
Используется для:
- buyer web
- seller web
- admin only if later needed

Основные сценарии:
- new order in seller dashboard
- order updates for buyer
- new chat message
- onboarding / moderation result for seller

## 3.3 Telegram Notifications
Используются только как дополнительный seller-oriented канал.

Основные сценарии:
- new order alert
- new chat message alert where appropriate
- store moderation result optional
- critical operational reminder optional later

### Important
Telegram в V0.1 — это не основной transaction channel, а supporting alert channel.

## 3.4 In-App Realtime Notifications
Используются, когда user already active inside app/web.

Примеры:
- new message arrives in real time
- unread counters update
- seller sees new order without refresh
- buyer sees order status update live

---

## 4. What Is Not Included on V0.1

- email notifications
- promotional campaigns
- segmentation engine
- notification center with complex inbox semantics
- frequency scheduling by advanced rules
- digest notifications
- SMS notifications as standard delivery channel
- notification templates editor for admins
- multi-provider orchestration complexity beyond practical need

---

## 5. Notification Philosophy

## 5.1 Urgency Over Noise
Уведомления должны приходить только там, где они реально помогают действию.

Нельзя перегружать seller-а и buyer-а постоянными сигналами.

## 5.2 Channel by Context
Один и тот же event может идти разными каналами в зависимости от того:
- online ли пользователь
- активен ли tab/app
- есть ли подписка на channel
- критичность события

## 5.3 Backend-Driven Truth
Notification system must be driven by backend domain events, not by arbitrary frontend guesses.

## 5.4 Observable Delivery
Нужно видеть:
- queued ли уведомление
- отправилось ли
- упало ли
- по какому каналу

---

## 6. Main Notification Domains

На V0.1 уведомления возникают из следующих доменов:

- orders
- chat
- seller onboarding / moderation
- admin-triggered actions where relevant
- system-level delivery failures later if needed

---

## 7. Core Event Types

## 7.1 Order Events
- order.created
- order.confirmed
- order.cancelled
- order.completed

## 7.2 Chat Events
- chat.message_sent
- chat.thread_created optional internally
- chat.unread_updated internal only if needed

## 7.3 Seller Lifecycle Events
- seller.approved
- seller.rejected
- store.published
- store.suspended

## 7.4 Admin / Moderation Related
- moderation.case_created internal
- moderation.action_completed
- seller verification decision

---

## 8. Recipient Rules

## 8.1 Buyer as Recipient
Buyer should receive notifications for:
- own order status changes
- new message in own product/order thread
- checkout or order-related success/failure confirmations only when appropriate

## 8.2 Seller as Recipient
Seller should receive notifications for:
- new order
- new incoming message
- buyer cancellation
- moderation/verification outcomes
- critical store state changes

## 8.3 Admin as Recipient
На V0.1 admin notifications can remain minimal.
Operational dashboard and polling/refetch may be enough.

If used:
- new pending seller review
- moderation queue changes
- critical system issues later

---

## 9. Channel Matrix

## 9.1 Buyer Notification Matrix

### order.created
- mobile push: optional confirmation
- web push: optional confirmation
- in-app realtime: yes if active

### order.confirmed
- mobile push: yes
- web push: yes
- realtime: yes if active

### order.cancelled
- mobile push: yes
- web push: yes
- realtime: yes if active

### order.completed
- mobile push: yes
- web push: yes
- realtime: yes if active

### new chat message
- mobile push: yes if not in active thread
- web push: yes if not active/focused appropriately
- realtime: yes if active

## 9.2 Seller Notification Matrix

### order.created
- mobile push: yes
- web push: yes
- Telegram: yes
- realtime: yes if active

### buyer cancellation
- mobile push: yes
- web push: yes
- Telegram: optional/yes by policy
- realtime: yes

### new chat message
- mobile push: yes if not active in thread
- web push: yes
- Telegram: optional for V0.1, but should be conservative to avoid spam
- realtime: yes if active

### seller approved / rejected
- mobile push: yes
- web push: yes
- Telegram: yes
- realtime: yes if active

---

## 10. Notification Priority Levels

Чтобы система не была хаотичной, полезно разделять события по приоритету.

## 10.1 High Priority
- order.created for seller
- order.confirmed for buyer
- order.cancelled
- moderation decision for seller

## 10.2 Medium Priority
- new chat message
- order.completed
- operational reminders later

## 10.3 Low Priority
- informational UI-only alerts
- some in-app summaries
- non-critical account signals

На V0.1 high/medium/low can be internal classification, not necessarily exposed to users.

---

## 11. Notification Routing Strategy

## 11.1 Canonical Flow

1. domain event occurs
2. event handler receives business payload
3. notification service resolves recipients
4. notification service resolves eligible channels
5. notification jobs are enqueued
6. delivery processors send through providers
7. result written to notification log
8. retries happen where applicable

## 11.2 Why Central Routing Matters
Без central notification service быстро появляется хаос:
- duplicated sends
- inconsistent copy
- channel mismatch
- impossible observability

---

## 12. Online vs Offline Logic

## 12.1 Active User Scenario
Если пользователь активен в приложении / открытой вкладке:
- realtime delivery is primary
- push may be suppressed or reduced depending on context

## 12.2 Background / Offline Scenario
Если пользователь не активен:
- mobile push / web push becomes primary
- Telegram may supplement seller alerts

## 12.3 Practical Rule
На V0.1 не нужно строить сверхсложную “presence intelligence”.
Достаточно разумной модели:
- if active in relevant thread/page, suppress noisy push where possible
- otherwise send push

---

## 13. In-App Notification Behavior

## 13.1 Buyer In-App
Buyer should see:
- chat unread badge updates
- order status updates in relevant screens
- optional lightweight in-app banners for major order events

## 13.2 Seller In-App
Seller should see:
- new order indicator
- unread message badges
- moderation status changes
- store verification/publishing status changes

## 13.3 Admin In-App
Admin may rely more on:
- dashboard counts
- polling/refetch
- optional realtime indicators later

---

## 14. Mobile Push Architecture

## 14.1 Token Registration
Mobile app must register push token after auth / app startup as appropriate.

System should store:
- user id
- platform
- provider
- token / endpoint
- device metadata

## 14.2 Token Lifecycle
Need to support:
- new token registration
- token refresh
- token deactivation on logout
- inactive/bad token handling

## 14.3 Mobile Push Triggers
- new order
- new message
- order updates
- moderation result

---

## 15. Web Push Architecture

## 15.1 Subscription Flow
Web apps must request permission intentionally, not blindly on first load.

**Seller Dashboard — trigger:**
- запрашивать permission сразу после первого успешного login и onboarding
- показать явный UI: "Включите уведомления, чтобы получать новые заказы"
- если отказал → показывать reminder при каждом заходе в раздел Orders (ненавязчиво)

**Buyer Web — trigger:**
- NOT на странице магазина при входе
- запрашивать только после создания заказа: "Хотите получать обновления по заказу?"
- это момент максимальной мотивации buyer-а

## 15.2 Stored Subscription Data
Need to persist:
- endpoint
- keys
- user id
- browser/platform metadata
- active state

## 15.3 Web Push Triggers
- seller new order
- seller new message
- buyer order updates
- buyer/seller chat messages where appropriate

---

## 16. Telegram Notification Architecture

## 16.1 Purpose
Telegram notifications support seller workflows because Telegram remains привычным operational environment.

## 16.2 Scope on V0.1
Telegram notifications should be limited to high-value events:
- new order
- moderation result
- optionally new chat message with caution

## 16.3 Why Caution Is Needed
If every chat message duplicates into Telegram aggressively:
- seller may ignore in-app chat
- spam grows
- product loses focus

Telegram should complement the platform, not replace its internal operational loop.

## 16.4 Telegram Bot Setup (Operational Requirements)

Для работы Telegram-нотификаций необходимо:

**1. Создать Telegram Bot**
- Создать бота через `@BotFather` → получить `BOT_TOKEN`
- Сохранить токен в env как `TELEGRAM_BOT_TOKEN`

**2. Seller activation flow**
Проблема: бот не может сам написать пользователю — только если пользователь сначала написал боту.

Решение:
1. Во время onboarding seller вводит свой `telegram_username`
2. Система показывает инструкцию: "Напишите нашему боту `@savdo_bot` слово `START` чтобы активировать уведомления"
3. Бот получает сообщение от seller-а, фиксирует `chat_id` → сохраняет в `sellers.telegram_chat_id`
4. Только после этого нотификации через Telegram активируются

**3. DB изменение**
Добавить в таблицу `sellers`:
```sql
telegram_chat_id bigint null,
telegram_notifications_active boolean not null default false
```

**4. Delivery Strategy**
Telegram sends идут через queue processor и логируются как любой другой channel.

Если `telegram_chat_id` не получен → Telegram-канал для этого seller пропускается, нотификация идёт только через push.

---

## 17. Notification Preferences

## 17.1 Required Preferences
На V0.1 желательно поддерживать basic per-user preferences:
- mobile push enabled
- web push enabled
- Telegram enabled

## 17.2 Defaults
- seller: all enabled by default where supported
- buyer: push enabled once granted/registered
- Telegram only if seller provided and activated it

## 17.3 Future Extensions
Later:
- per-event preferences
- quiet hours
- digest mode
- channel priority preferences

Но не на V0.1.

---

## 18. Delivery Logging

## 18.1 Why Mandatory
Без logging невозможно:
- отлаживать delivery failures
- понимать поведение каналов
- проверять claims “мне ничего не пришло”
- анализировать provider reliability

## 18.2 What to Log
- recipient
- channel
- event type
- payload summary
- attempt count
- delivery status
- failure reason
- sent timestamp

---

## 19. Retry Strategy

## 19.1 Need
Push/web/Telegram providers могут падать, token может быть invalid, network may fail.

## 19.2 Recommended Retry Policy
- retry transient failures
- do not endlessly retry invalid token cases
- mark failed deliveries clearly
- deactivate bad subscriptions when provider indicates invalidity

## 19.3 Queue Ownership
Retry policy should live in queue processors, not in HTTP request path.

---

## 20. Copy and Message Design

## 20.1 Principles
Notification copy should be:
- short
- actionable
- contextual
- not ambiguous

## 20.2 Good Examples
Seller:
- new order with order number and amount
- new message with product/order context

Buyer:
- order confirmed
- order cancelled
- new message from seller

## 20.3 Avoid
- vague generic texts
- overlong body copy
- misleading urgency
- content without deep link target

---

## 21. Deep Linking Strategy

Every push notification should ideally lead user directly to relevant surface.

## 21.1 Buyer Deep Links
- order detail
- chat thread
- relevant product/order context

## 21.2 Seller Deep Links
- order detail
- chat thread
- onboarding/moderation result screen

## 21.3 Web Push and Mobile Push Alignment
Deep link targets should be semantically aligned across mobile and web:
- same intent
- different route implementation acceptable

---

## 22. Deduplication and Spam Control

## 22.1 Problem
Without control, one event may lead to:
- realtime banner
- mobile push
- web push
- Telegram ping
all at once

This becomes noisy and damages trust.

## 22.2 V0.1 Practical Rules
- if user is active in exact thread, suppress extra push for same message if feasible
- do not duplicate low-value events across every channel
- reserve Telegram for seller-important events
- prefer one strong signal over many weak duplicates

## 22.3 Future
Advanced dedupe intelligence can come later, but basic anti-spam discipline is required from the start.

---

## 23. Notification Service Design

## 23.1 Central Service Responsibilities
Notification service should:
- accept normalized domain events
- map event → recipients
- map event → channels
- apply preference checks
- enqueue provider jobs
- log intent and outcome

## 23.2 Suggested Internal Structure

```bash
/modules/notifications
  /services
    notification-routing.service.ts
    notification-preferences.service.ts
    notification-template.service.ts
  /processors
    mobile-push.processor.ts
    web-push.processor.ts
    telegram.processor.ts
  /listeners
    order-created.listener.ts
    message-sent.listener.ts
    moderation-decision.listener.ts

24. Event-to-Notification Mapping
24.1 order.created

Recipient:

seller

Channels:

realtime

mobile push

web push

Telegram

24.2 order.confirmed

Recipient:

buyer

Channels:

realtime

mobile push

web push

24.3 order.cancelled

Recipients:

opposite side depending on actor

possibly both sides depending on source

Channels:

realtime

push

Telegram for seller if relevant

24.4 chat.message_sent

Recipient:

other thread participant

Channels:

realtime

push if not active

Telegram cautiously for seller if enabled by product policy

24.5 seller.approved / seller.rejected

Recipient:

seller

Channels:

realtime

mobile push

web push

Telegram

25. Security and Privacy
25.1 Minimum Disclosure Principle

Notifications should not leak unnecessary sensitive data.

Example

Lock screen mobile push should be careful with:

personal addresses

overly detailed private content

sensitive order metadata

25.2 Channel Safety

Telegram is an external channel, so payload there should be especially conservative.

25.3 Backend Enforcement

Notification generation must be backend-controlled and permission-aware.

26. Admin Visibility and Debugging
26.1 Admin Needs

Admin should be able to inspect:

delivery logs

failed sends

per-channel status

event history where useful

26.2 Why Important

This reduces operational blindness during MVP launch.

27. Performance Considerations
27.1 Do Not Send Inline

Notification sending must never block critical business request completion.

Example

Order creation should:

create order

commit transaction

emit event

enqueue notifications

It should not wait synchronously for Telegram or push provider.

27.2 Queue-Based Scaling

As volume grows:

queue processors can scale separately

providers remain decoupled from API latency

failure handling stays contained

28. Localization

Поддерживаемые языки:

Uzbek

Russian

28.1 Notification Copy Localization

Notification content should be generated in user-preferred language wherever possible.

28.2 Fallback Strategy

If user preference unknown:

use system default

or seller/buyer app language at last known state if available

29. Testing Strategy
29.1 Critical Scenarios

seller receives new order push

buyer receives order confirmed push

buyer receives new chat message push

seller receives web push while dashboard not focused

Telegram notification sent on seller order event

invalid push subscription handled gracefully

logout disables/invalidates delivery as needed

realtime suppresses redundant notification where policy applies

29.2 Failure Cases

provider failure

expired token

invalid web push subscription

Telegram API failure

duplicate delivery attempts

user disabled channel preference

30. Final Notification Rules

notifications are a core operational feature, not a cosmetic add-on

realtime and push must complement each other

seller new order notifications are highest priority

buyer order updates and chat notifications must be reliable

Telegram is a supplemental seller channel, not the primary transaction surface

email is not part of V0.1

all delivery must be backend-driven, queued and logged

notification spam must be avoided from the beginning

every important notification should have a meaningful deep link target

Главная цель notification слоя:
обеспечить timely awareness for buyer and seller without noise, delays or operational blindness, so that orders and chats remain responsive even when users are not actively inside the app.