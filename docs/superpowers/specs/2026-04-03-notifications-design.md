# Notifications Design — web-seller

**Date:** 2026-04-03
**Domain:** apps/web-seller
**Owner:** Азим

---

## Goal

Add in-app notification center for sellers: live badge on bell icon + dedicated /notifications page.

---

## Decisions

| Question | Decision |
|----------|----------|
| Layout | Separate page /notifications (no dropdown, no slide panel) |
| Badge style | Count + CSS pulse animation while unread > 0 |
| Mark as read | Auto read-all on page enter |
| Notification click | Navigate to /orders/:id if order notification, otherwise mark read only |

---

## API (already implemented by Полат)

| Endpoint | Use |
|----------|-----|
| `GET /api/v1/notifications/inbox` | Full list with pagination |
| `GET /api/v1/notifications/inbox/unread-count` | Badge count |
| `PATCH /api/v1/notifications/inbox/read-all` | Mark all read |
| `PATCH /api/v1/notifications/inbox/:id/read` | Mark one read |

Response shape (inbox item):
```json
{
  "id": "notif-uuid",
  "title": "Новый заказ",
  "body": "Поступил новый заказ #order-uuid-0001 на сумму 13 500 000 сум",
  "isRead": false,
  "createdAt": "2026-03-21T14:30:00.000Z"
}
```

---

## Components

### Bell badge (layout.tsx header)

- Polls `GET /inbox/unread-count` every 30s via TanStack Query (`refetchInterval: 30_000`)
- `count > 0` → show badge with number + `@keyframes ping` pulse
- `count === 0` → badge hidden (no empty badge)
- Max displayed: 99, above that show "99+"
- Click → `router.push('/notifications')`

### /notifications page

- `GET /inbox` on mount, `staleTime: 0`
- On mount: fire `PATCH /read-all` (fire-and-forget, invalidates unread-count)
- Client-side tab filter: **Все** / **Непрочитанные**
- "Прочитать все" button at top (fallback if auto-read failed)
- Empty state: "Уведомлений пока нет"
- Loading skeleton: 5 placeholder rows

### Notification row

- Icon based on title keyword: 🛒 order, ✅ approved, ⚠️ rejected, 📦 default
- Title + body text
- Relative time (e.g. "2 минуты назад")
- Unread: highlighted background (`rgba(167,139,250,.10)`)
- Click handler: extract order ID from body string via regex `/orders?\/([a-f0-9-]{36})/i` → if found, `router.push('/orders/' + id)`

---

## New Files

| File | Purpose |
|------|---------|
| `src/lib/api/notifications.api.ts` | API functions: getInbox, getUnreadCount, readAll, readOne |
| `src/hooks/use-notifications.ts` | TanStack Query hooks: useNotifications, useUnreadCount, useReadAll, useReadOne |
| `src/app/(dashboard)/notifications/page.tsx` | /notifications page |

## Modified Files

| File | Change |
|------|--------|
| `src/app/(dashboard)/layout.tsx` | Bell button: live badge + link to /notifications |

---

## Out of Scope

- Push notifications (web push) — REJECTED in MVP scope
- Notification preferences page — already exists in settings, not touched here
- Delete notification — API exists but not surfaced in UI (YAGNI for MVP)
- Pagination — load all (default limit 20 is enough for MVP)
