# Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add live notification badge on bell icon + /notifications page for sellers.

**Architecture:** 3 new files (api, hooks, page) + 1 modified (layout). API layer calls backend directly; hooks wrap with TanStack Query; page renders list with auto read-all on mount. Badge polls unread count every 30s in layout.

**Tech Stack:** Next.js 16 App Router, TanStack Query, axios (`apiClient`), Tailwind + inline glass styles (no DaisyUI classes needed here).

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `apps/web-seller/src/lib/api/notifications.api.ts` | Raw API calls: getInbox, getUnreadCount, readAll |
| Create | `apps/web-seller/src/hooks/use-notifications.ts` | TanStack Query hooks: useNotifications, useUnreadCount, useReadAll |
| Create | `apps/web-seller/src/app/(dashboard)/notifications/page.tsx` | /notifications page UI |
| Modify | `apps/web-seller/src/app/(dashboard)/layout.tsx` | Bell → live badge + router.push('/notifications') |

---

## Task 1: API layer

**Files:**
- Create: `apps/web-seller/src/lib/api/notifications.api.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web-seller/src/lib/api/notifications.api.ts
import { apiClient } from './client';

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface InboxResponse {
  data: NotificationItem[];
  meta: { page: number; limit: number; total: number };
}

export interface UnreadCountResponse {
  count: number;
}

export async function getInbox(): Promise<NotificationItem[]> {
  const { data } = await apiClient.get<InboxResponse>('/notifications/inbox', {
    params: { limit: 20 },
  });
  return data.data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<UnreadCountResponse>(
    '/notifications/inbox/unread-count',
  );
  return data.count;
}

export async function readAll(): Promise<void> {
  await apiClient.patch('/notifications/inbox/read-all');
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/lib/api/notifications.api.ts
git commit -m "feat(web-seller): notifications API layer"
```

---

## Task 2: TanStack Query hooks

**Files:**
- Create: `apps/web-seller/src/hooks/use-notifications.ts`

- [ ] **Step 1: Create the file**

```typescript
// apps/web-seller/src/hooks/use-notifications.ts
'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getInbox, getUnreadCount, readAll } from '../lib/api/notifications.api';

export const NOTIF_KEYS = {
  inbox: ['notifications', 'inbox'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

export function useNotifications() {
  return useQuery({
    queryKey: NOTIF_KEYS.inbox,
    queryFn: getInbox,
    staleTime: 0,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: NOTIF_KEYS.unreadCount,
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 0,
  });
}

export function useReadAll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: readAll,
    onSuccess: () => {
      queryClient.setQueryData(NOTIF_KEYS.unreadCount, 0);
      queryClient.invalidateQueries({ queryKey: NOTIF_KEYS.inbox });
    },
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/hooks/use-notifications.ts
git commit -m "feat(web-seller): notifications hooks"
```

---

## Task 3: Bell badge in layout

**Files:**
- Modify: `apps/web-seller/src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: Add import at top of layout.tsx**

After the existing imports (around line 10), add:

```typescript
import { useUnreadCount } from '../../hooks/use-notifications';
import { useRouter as useNextRouter } from 'next/navigation';
```

Note: `useRouter` is already imported as `useRouter` in the file — `useNextRouter` alias is not needed, just add `useUnreadCount`:

```typescript
import { useUnreadCount } from '../../hooks/use-notifications';
```

- [ ] **Step 2: Call the hook inside DashboardLayout**

After line `const { toasts } = useSellerSocket();`, add:

```typescript
const { data: unreadCount = 0 } = useUnreadCount();
```

- [ ] **Step 3: Replace the static bell button**

Find and replace the existing bell button block (lines ~203–208):

```tsx
{/* OLD — remove this */}
<button className="relative" style={{ color: "rgba(255,255,255,0.45)" }}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full" style={{ background: "#A78BFA" }} />
</button>
```

Replace with:

```tsx
{/* Notifications bell */}
<button
  onClick={() => router.push('/notifications')}
  className="relative"
  style={{ color: "rgba(255,255,255,0.45)" }}
  aria-label="Уведомления"
>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
  </svg>
  {unreadCount > 0 && (
    <>
      <style>{`
        @keyframes savdo-ping {
          75%, 100% { transform: scale(2); opacity: 0; }
        }
      `}</style>
      <span
        className="absolute -top-1 -right-1.5 flex items-center justify-center"
        style={{ minWidth: 16, height: 16, padding: '0 3px', borderRadius: 8, border: '2px solid transparent', background: 'transparent' }}
      >
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: 'rgba(167,139,250,.45)', animation: 'savdo-ping 1.4s cubic-bezier(0,0,.2,1) infinite', borderRadius: 8 }}
        />
        <span
          className="relative flex items-center justify-center rounded-full text-white font-bold"
          style={{ minWidth: 14, height: 14, padding: '0 3px', fontSize: 9, background: '#A78BFA', borderRadius: 7 }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      </span>
    </>
  )}
</button>
```

- [ ] **Step 4: Commit**

```bash
git add apps/web-seller/src/app/(dashboard)/layout.tsx
git commit -m "feat(web-seller): live notification badge in header"
```

---

## Task 4: /notifications page

**Files:**
- Create: `apps/web-seller/src/app/(dashboard)/notifications/page.tsx`

- [ ] **Step 1: Create the page**

```tsx
// apps/web-seller/src/app/(dashboard)/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useNotifications, useReadAll } from '../../../hooks/use-notifications';
import type { NotificationItem } from '../../../lib/api/notifications.api';

// ── Glass token ───────────────────────────────────────────────────────────────

const glass = {
  background: 'rgba(255,255,255,0.07)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.11)',
} as const;

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'только что';
  if (mins < 60) return `${mins} мин назад`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} ч назад`;
  return `${Math.floor(hrs / 24)} дн назад`;
}

function notifIcon(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('заказ') || t.includes('order')) return '🛒';
  if (t.includes('одобр') || t.includes('approved')) return '✅';
  if (t.includes('откло') || t.includes('reject')) return '⚠️';
  return '📦';
}

const ORDER_ID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

// ── Row ───────────────────────────────────────────────────────────────────────

function NotifRow({ item }: { item: NotificationItem }) {
  const router = useRouter();

  function handleClick() {
    const match = item.body.match(ORDER_ID_RE);
    if (match) {
      router.push(`/orders/${match[0]}`);
    }
  }

  return (
    <div
      onClick={handleClick}
      className="flex items-start gap-4 px-5 py-4 rounded-2xl transition-opacity hover:opacity-80 cursor-pointer"
      style={item.isRead ? { ...glass, opacity: 0.7 } : { ...glass, background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.20)' }}
    >
      <span className="text-xl flex-shrink-0 mt-0.5">{notifIcon(item.title)}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{item.title}</p>
        <p className="text-xs mt-0.5 text-white/50 leading-relaxed">{item.body}</p>
      </div>
      <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: 'rgba(255,255,255,0.30)' }}>
        {relativeTime(item.createdAt)}
      </span>
    </div>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-4 px-5 py-4 rounded-2xl animate-pulse" style={glass}>
          <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="flex-1 flex flex-col gap-2">
            <div className="h-3.5 w-40 rounded" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="h-3 w-full rounded" style={{ background: 'rgba(255,255,255,0.05)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread';

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>('all');
  const { data: items = [], isLoading, isError } = useNotifications();
  const readAll = useReadAll();

  // Auto mark-all-read on mount (fire-and-forget)
  useEffect(() => {
    readAll.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = tab === 'unread' ? items.filter(n => !n.isRead) : items;

  return (
    <div className="max-w-2xl flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Уведомления</h1>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Последние {items.length} уведомлений
          </p>
        </div>
        <button
          onClick={() => readAll.mutate()}
          disabled={readAll.isPending}
          className="text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80 disabled:opacity-40"
          style={{ background: 'rgba(167,139,250,0.15)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.25)' }}
        >
          Прочитать все
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {(['all', 'unread'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="text-xs px-4 py-1.5 rounded-xl transition-all"
            style={
              tab === t
                ? { background: 'rgba(167,139,250,0.20)', color: '#A78BFA', border: '1px solid rgba(167,139,250,0.30)' }
                : { background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.45)', border: '1px solid transparent' }
            }
          >
            {t === 'all' ? 'Все' : 'Непрочитанные'}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <Skeleton />
      ) : isError ? (
        <div
          className="rounded-2xl px-5 py-4 text-sm"
          style={{ background: 'rgba(248,113,113,0.10)', border: '1px solid rgba(248,113,113,0.20)', color: 'rgba(248,113,113,0.85)' }}
        >
          Не удалось загрузить уведомления. Попробуйте обновить страницу.
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="rounded-2xl px-5 py-10 text-center"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
        >
          <p className="text-2xl mb-2">🔔</p>
          <p className="text-sm font-medium text-white/60">Уведомлений пока нет</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(item => (
            <NotifRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/web-seller/src/app/(dashboard)/notifications/page.tsx
git commit -m "feat(web-seller): notifications page"
```

---

## Task 5: Manual check

- [ ] **Step 1: Run TypeScript check**

```bash
cd apps/web-seller && npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 2: Verify visually**

Start dev server:
```bash
cd apps/web-seller && pnpm dev
```

Check:
1. Bell in header → если есть непрочитанные — badge с числом + пульс
2. Клик по колокольчику → переход на `/notifications`
3. Страница загружает список, таб "Непрочитанные" работает
4. "Прочитать все" → badge в header исчезает
5. Клик на уведомление о заказе → переход на `/orders/:id`

- [ ] **Step 3: Update analiz/done.md**

Add to `analiz/done.md`:

```markdown
### ✅ [WEB-031] In-app уведомления — seller
- **Важность:** 🔴
- **Дата:** 03.04.2026
- **Файлы:**
  - `apps/web-seller/src/lib/api/notifications.api.ts` (новый)
  - `apps/web-seller/src/hooks/use-notifications.ts` (новый)
  - `apps/web-seller/src/app/(dashboard)/notifications/page.tsx` (новый)
  - `apps/web-seller/src/app/(dashboard)/layout.tsx`
- **Что сделано:** Живой badge с пульсом на колокольчике (polling 30s). Страница /notifications с авто read-all, фильтром по вкладкам, навигацией к заказу по клику.
```

- [ ] **Step 4: Final commit**

```bash
git add analiz/done.md
git commit -m "chore: mark WEB-031 done in analiz"
```
