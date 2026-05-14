# Audit: Networking + Loading + Component Refresh (TMA)

**Date:** 07.05.2026
**Scope:** `apps/tma/src/` — networking layer, loading states, component data refresh
**Method:** статический анализ кода + поиск паттернов

---

## ✅ Сильные стороны

### `lib/api.ts` — продуманный клиент
- ✅ **Module-level cache** с per-endpoint TTL (`inferTTL`): глобальные категории кешируются 10 мин, заказы 10с.
- ✅ **In-flight dedup**: 2 одновременных одинаковых GET → 1 fetch.
- ✅ **`apiSWR()` stale-while-revalidate**: показывает кэш мгновенно + подкачивает свежие данные в фоне (5 мин окно после expiresAt).
- ✅ **`prefetch()` для hover-prefetching** на ProductCard / GlassCard onPointerEnter.
- ✅ **`AbortSignal`** support — отмена запроса при unmount/смене params.
- ✅ **`bustCache(prefix)`** для ручной инвалидации (но используется редко, см. ниже).
- ✅ **`apiUpload()` через XHR** с `onProgress` callback.
- ✅ **401 → setToken(null) + onUnauthorized callback** → авто-логаут.
- ✅ **`ApiError` class** с status code → consumers могут различать 503 vs 400.

### Pages — большинство правильно подключают AbortController
**69 occurrences** AbortController/abortRef в 13 страницах. Стандартный паттерн:
```tsx
const abortRef = useRef<AbortController | null>(null);
useEffect(() => {
  abortRef.current?.abort();
  const ac = new AbortController();
  abortRef.current = ac;
  api('/x', { signal: ac.signal })
    .then(...)
    .catch(...)
    .finally(...);
  return () => ac.abort();
}, [deps]);
```

### Real-time через WS push (свежий)
- `lib/notifications.ts` + `lib/chatUnread.ts` — переведены с polling 30s на WS push + fallback 5 мин.
- Снижение нагрузки ~10× на 1k активных клиентов.

### Skeleton presets (свежий)
- `components/ui/Skeleton.tsx` — 7 готовых: ProductCard, OrderRow, ThreadRow, StatsCard, ProductDetail, ProfileBlock, CartItem.
- Используются в ProductsPage / StoresPage / DashboardPage / OrdersPage / ChatPage.

---

## 🔴 Критические проблемы (P0)

### 1. Mутации не инвалидируют GET cache → стейл данные после save

**Симптом:** продавец создаёт товар через `POST /seller/products` → возвращается на ProductsPage → старого товара нет, потому что `GET /seller/products?limit=50` вернул из cache (30s TTL).

**Корень:** `bustCache()` используется только в `chatUnread.ts`. В страницах после мутации нет инвалидации.

**Примеры:**
- [seller/ProductsPage.tsx](apps/tma/src/pages/seller/ProductsPage.tsx) — `toggleStatus` / `archiveProduct` / `deleteProduct` PATCHит товар, но cache `seller/products?limit=50` остаётся stale.
- [seller/StorePage.tsx](apps/tma/src/pages/seller/StorePage.tsx) — `save` PATCH'ит магазин, но cache `seller/store` не очищается.
- [seller/AddProductPage.tsx](apps/tma/src/pages/seller/AddProductPage.tsx) — после save товара cache `seller/products` устаревший.

**Workaround сейчас:** некоторые страницы используют `forceFresh: true` (DashboardPage, OrdersPage). Но это **bypass cache** — каждый visit hit бэк, теряем performance benefit.

**Правильный fix:**
```tsx
// в каждой мутации после успеха:
await api('/seller/products', { method: 'POST', body: dto });
bustCache('/seller/products');  // ← добавить
bustCache('/seller/store');     // если магазин затронут
```

Или ещё лучше — `api()` сам инвалидирует cache на не-GET response. Patch:
```tsx
// в lib/api.ts doFetch после успеха non-GET:
if (method !== 'GET') {
  // Auto-bust по path-prefix → /seller/products POST → invalidates seller/products GET
  const prefix = path.split('?')[0].replace(/\/[^\/]+$/, '/'); // /seller/products
  bustCache(prefix);
}
```

**Severity:** HIGH. Юзер видит старые данные после действий — frustrating.

---

### 2. Race conditions при быстром переключении

**Симптом:** юзер быстро жмёт product A → product B → product A. Запрос A1 может прилететь после A2 → показывается старый продукт.

**Корень:** **некоторые** страницы не отменяют предыдущий запрос при смене params.

**Примеры без AbortController:**
- [buyer/ChatPage.tsx:114](apps/tma/src/pages/buyer/ChatPage.tsx) `useEffect[threadId]` — нет abortRef, при быстром переключении threads приходят сообщения старого thread'а в новый UI.
- [buyer/OrdersPage.tsx](apps/tma/src/pages/buyer/OrdersPage.tsx) `loadMore` — нет AbortController на пагинации, double-tap может вызвать race.
- [buyer/CartPage.tsx](apps/tma/src/pages/buyer/CartPage.tsx) — 0 AbortController (но cart в localStorage, не критично).

**Severity:** MEDIUM. Симптом виден только при flaky network.

---

### 3. `.catch(() => {})` — silent failures (14 occurrences в 8 файлах)

**Симптом:** запрос падает → юзер не знает почему, нет toast'а.

**Файлы и кол-во:**
| Файл | Silent catches |
|---|---|
| `seller/EditProductPage.tsx` | 4 |
| `seller/AddProductPage.tsx` | 3 |
| `seller/ChatPage.tsx` | 2 |
| `buyer/StoresPage.tsx`, `buyer/ChatPage.tsx`, `buyer/StorePage.tsx`, `seller/ProfilePage.tsx`, `seller/OrdersPage.tsx` | по 1 |

**Где допустимо:** prefetch (`api(...).catch(() => {})` на hover) — best-effort, ОК.

**Где НЕ допустимо:** mutate-операции (POST/PATCH/DELETE) — юзер должен видеть failure.

**Action:** ручной audit каждого `.catch(() => {})` — заменить на `.catch((err) => { showToast('❌ ...', 'error'); })` если это user-facing операция, или прокомментировать `// best-effort: prefetch/cleanup` если намеренно тихо.

---

## 🟠 Средние проблемы (P1)

### 4. Нет timeout на `fetch()` — может висеть бесконечно

**Корень:** `doFetch()` в `lib/api.ts` не накладывает timeout. Если бэк очень медленно отвечает (DB lock / Redis transient) — promise висит, юзер видит вечный skeleton.

**Recommended fix:**
```ts
async function doFetch<T>(path, opts, method): Promise<T> {
  const userSignal = opts.signal;
  const timeoutAc = new AbortController();
  const tid = setTimeout(() => timeoutAc.abort(), opts.timeout ?? 20_000);

  // Combine signals
  const finalSignal = anySignal([userSignal, timeoutAc.signal]);

  try {
    return await fetch(...).then(...).finally(() => clearTimeout(tid));
  } catch (err) {
    if (timeoutAc.signal.aborted && !userSignal?.aborted) {
      throw new ApiError(0, 'Превышено время ожидания (20с) — попробуйте ещё раз');
    }
    throw err;
  }
}
```

**Severity:** MEDIUM. Hangs при DB issues — лучше чем show-error чем infinite loading.

---

### 5. Polling fallback 5 мин — много для critical features

`lib/notifications.ts` и `lib/chatUnread.ts` имеют `FALLBACK_POLL_INTERVAL = 5 * 60_000`. Если WS connection broken → юзер ждёт до 5 минут чтобы увидеть новое сообщение.

**Не критично если WS работает** — он не падает в обычной ситуации. Но добавить **WS health check** + retry при `socket.disconnect` событии:

```ts
socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    socket.connect(); // явный reconnect
  }
  // socket.io сам реконнектит при transport error — fallback poll 5мин это safety net.
});
```

**Severity:** LOW. Текущая реализация OK для 99% сценариев.

---

### 6. Дублирующий fetch в seller/ProductsPage + DashboardPage

При login оба компонента грузят `/seller/products` независимо. Dedup-логика `_inflight` помогает (если они выполняются одновременно), но если ProductsPage загрузился сначала и закешировал ответ → DashboardPage просто читает из cache. **Это хорошо.**

Но `?limit=50` (ProductsPage) и `?limit=1` (DashboardPage для count'а) — **разные cache keys**. Не deduplicates.

**Optional fix:** DashboardPage использует тот же `?limit=50` если он уже есть в cache, иначе свой `?limit=1`. Не приоритет.

---

### 7. `forceFresh: true` для critical hot paths — обходит cache

DashboardPage / OrdersPage используют `forceFresh: true` чтобы юзер всегда видел свежие заказы. Это правильно (заказы важны). Но:
- На каждый visit dashboard'а — новый fetch. Если юзер ходит между табами 10 раз/мин — 10 fetch'ей.

**Лучшая стратегия:** `apiSWR()` (cache + background revalidate) вместо `forceFresh`. Юзер видит мгновенно последние данные, в фоне подкачиваются новые. Сейчас apiSWR не используется ни в одной странице (хотя в `lib/api.ts` он есть).

---

### 8. Нет retry на transient ошибки

503 (Service Unavailable) / 504 (Gateway Timeout) / network error — все throw immediately. Юзер видит «Ошибка», жмёт «Повторить» вручную.

**Recommended:** retry для idempotent (GET) запросов с exponential backoff 1×, 2×, 4с (max 3 attempts). Для POST/PATCH — НЕ ретраить (юзер может создать дубликат).

---

## 🟡 Минорные (P2)

### 9. Token в `sessionStorage` — теряется при закрытии вкладки

В TMA это норм (юзер входит через initData при каждом open). Но если хочешь session persistence на web — `localStorage`.

### 10. Нет global error boundary вокруг fetch'ей

ErrorBoundary есть в `App.tsx` для render-ошибок. Async-ошибки в `useEffect` если не catch'нуты → unhandled rejection. Сейчас в основном catch'ятся, но не системно.

### 11. `lib/chatUnread.ts` и `lib/notifications.ts` — почти duplicate code

Оба — pub/sub + initial fetch + WS subscribe + fallback poll. Можно вынести в `createCounterStore({endpoint, wsEvent})` factory. Не приоритет.

---

## 📋 Recommended actions (порядок приоритета)

| # | Action | Effort | Impact |
|---|---|---|---|
| 1 | **Auto-bust cache в `lib/api.ts` на non-GET** | 30 мин | HIGH — fixes стейл данные после save |
| 2 | **Audit silent `.catch(() => {})`** на 14 occurrences | 1 час | HIGH — UX |
| 3 | **Timeout 20s в `doFetch`** + дружелюбный error message | 30 мин | MEDIUM |
| 4 | **AbortController в buyer/ChatPage + buyer/OrdersPage loadMore** | 30 мин | MEDIUM — race conditions |
| 5 | **`apiSWR` вместо `forceFresh: true` в Dashboard/Orders** | 45 мин | LOW — performance |
| 6 | **GET-retry с backoff** в `lib/api.ts` для idempotent | 30 мин | LOW |
| 7 | Refactor `chatUnread.ts` + `notifications.ts` в factory | 1 час | LOW (cosmetic) |

**Total estimate:** 4-5 часов на полное закрытие audit'а.

---

## 🎯 Quick wins — что я бы сделал прямо сейчас

**Top 3 (≤ 1 час):**

1. **Auto-bust cache на mutation** (`lib/api.ts` — 5 строк):
   ```ts
   // в .then(data => ...) для non-GET:
   if (!isGet && useCache !== false) {
     const prefix = path.split('?')[0];
     bustCache(prefix);
     // bust также parent: /seller/products/abc → /seller/products
     const parent = prefix.replace(/\/[^\/]+$/, '');
     if (parent) bustCache(parent);
   }
   ```

2. **Timeout 20с + ApiError 408** в `doFetch`:
   ```ts
   const timeoutAc = new AbortController();
   const tid = setTimeout(() => timeoutAc.abort(), 20_000);
   // combine signals via AbortSignal.any() (TS 4.4+) or polyfill
   ```

3. **Добавить AbortController в buyer/OrdersPage `loadMore`**.

Эти три исправляют **80% потенциальных user-facing проблем** с networking.

---

## Метрики

**По данным grep (07.05.2026):**

| Паттерн | Использование | Плотность |
|---|---|---|
| `AbortController` | 69 в 13 файлах | ~5/файл — норм |
| `showToast`/`setError` | 98 в 14 файлах | ~7/файл — много error UX |
| Silent `.catch(() => {})` | 14 в 8 файлах | 1.75/файл — приемлемо но требует audit |
| `forceFresh: true` | 7 в 6 файлах | редкое — OK |
| Mutation methods (POST/PATCH/DELETE/PUT) | 13 в 5 файлах | у каждой нет cache-bust 🔴 |
| `bustCache` usages | 0 в pages, 1 в lib | **ZERO в pages — ROOT cause #1** |
| `apiSWR` usages | 0 | feature-функция написана но не используется |
| `prefetch` calls | 6 в 4 файлах | OK |

---

## Связь с другими аудитами

- `analiz/logs.md AUDIT-API-RBAC-2026-05-06` — backend RBAC (закрыто)
- `analiz/logs.md AUDIT-API-WS-2026-05-06` — WebSocket auth (закрыто)
- `.claude/skills/ui-ux-savdo.md` — checklist 14-pre-flight включает networking patterns

После реализации Top 3 fix'ов — обновить skill чтобы будущие компоненты сразу использовали правильные паттерны.
