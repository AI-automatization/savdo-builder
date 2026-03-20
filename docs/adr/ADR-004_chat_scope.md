# ADR-004 — Ограниченный scope чата в MVP

**Дата:** 2026-03-21
**Статус:** Accepted

## Контекст

Чат (buyer ↔ seller) — одна из заявленных core features. Но realtime чат — технически сложная фича с множеством edge cases.

## Решение

**Чат включён в MVP, но с жёстко ограниченным scope.**

### Что включено

- Text-only messages
- Два типа thread: `product` (до заказа) и `order` (после заказа)
- Unread counters
- Realtime доставка через Socket.IO
- Только идентифицированные buyers (с телефоном)

### Что явно исключено из MVP

- Вложения / изображения в чате (`PRODUCT_IMAGE_ATTACHMENT_ENABLED=false`)
- Typing indicator
- Read receipts (двойная галочка)
- Delete / Edit messages
- Reactions
- Voice messages
- Chat search
- Presence (online/offline)
- Группы

### Fallback всегда доступен

Кнопка "Написать в Telegram" видна всегда. Это снижает критичность чата.

## Причины

1. **Realtime сложен.** Delivery guarantees, reconnect, unread state, auth edge cases — всё это источники багов.
2. **Чат не критичен для первого заказа.** Buyer может сделать заказ без чата. COD + телефон = достаточно.
3. **Telegram-fallback закрывает большинство нужд.** Seller и buyer уже привыкли к Telegram.
4. **Image attachments в чате = отдельная система.** Нужны: upload, resize, watermark, moderation, signed URLs. Это MVP+1.

## Последствия

- `chat_messages.message_type` = `text` | `system` в MVP (image зарезервировано)
- Feature flag `CHAT_ENABLED` позволяет отключить весь модуль если нужно
- Socket.IO gateway живёт в том же NestJS процессе

## Альтернатива которая была рассмотрена

**Убрать чат полностью из MVP** — заменить на "order comments" + Telegram deeplink. Отклонено, потому что чат является дифференцирующей фичей от чистого Telegram-торговли.
