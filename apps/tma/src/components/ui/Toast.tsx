import { useEffect, useState } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface ToastPayload {
  id: number;
  msg: string;
  type: ToastType;
}

const COLORS: Record<ToastType, { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(52,211,153,0.15)', border: 'rgba(52,211,153,0.35)', color: '#34D399' },
  error:   { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.35)',  color: '#F87171' },
  info:    { bg: 'rgba(167,139,250,0.15)', border: 'rgba(167,139,250,0.35)', color: '#A78BFA' },
};

let _id = 0;

export function showToast(msg: string, type: ToastType = 'success', duration = 2400) {
  window.dispatchEvent(new CustomEvent('tma:toast', { detail: { msg, type, duration } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { msg, type, duration } = (e as CustomEvent).detail as { msg: string; type: ToastType; duration: number };
      const id = ++_id;
      setToasts((prev) => [...prev, { id, msg, type }]);
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), duration);
    };
    window.addEventListener('tma:toast', handler);
    return () => window.removeEventListener('tma:toast', handler);
  }, []);

  if (!toasts.length) return null;

  return (
    <div
      className="fixed top-4 left-4 right-4 z-[200] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 420, margin: '0 auto' }}
    >
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            className="px-4 py-3 rounded-2xl text-sm font-semibold"
            style={{
              background: c.bg,
              border: `1px solid ${c.border}`,
              color: c.color,
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}
          >
            {t.msg}
          </div>
        );
      })}
    </div>
  );
}
