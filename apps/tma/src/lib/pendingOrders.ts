import { api, getToken } from './api';

type Listener = (count: number) => void;

let _count = 0;
let _interval: ReturnType<typeof setInterval> | null = null;
const _listeners = new Set<Listener>();

const POLL_INTERVAL = 30_000;

async function fetchCount(): Promise<void> {
  if (!getToken()) return;
  try {
    const res = await api<{ meta: { total: number } }>(
      '/seller/orders?status=PENDING&limit=1&page=1',
      { forceFresh: true },
    );
    const count = res?.meta?.total ?? 0;
    if (count !== _count) {
      _count = count;
      _listeners.forEach((cb) => cb(_count));
    }
  } catch {
    /* tolerable */
  }
}

function ensurePolling(): void {
  if (_interval) return;
  void fetchCount();
  _interval = setInterval(() => { void fetchCount(); }, POLL_INTERVAL);
}

function maybeStop(): void {
  if (_listeners.size === 0 && _interval) {
    clearInterval(_interval);
    _interval = null;
  }
}

export function subscribeToPendingOrders(cb: Listener): () => void {
  _listeners.add(cb);
  cb(_count);
  ensurePolling();
  return () => {
    _listeners.delete(cb);
    maybeStop();
  };
}

export function resetPendingOrders(): void {
  _count = 0;
  _listeners.forEach((cb) => cb(0));
  if (_interval) { clearInterval(_interval); _interval = null; }
}

export function refreshPendingOrders(): Promise<void> {
  return fetchCount();
}
