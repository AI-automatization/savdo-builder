import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';

type Status = 'connecting' | 'connected' | 'disconnected';

// UX-008: показываем pill только при проблемах с соединением.
// Connected = ничего не рендерим (как Telegram WebApp прячет статус когда всё ок).
export function SocketStatusBadge() {
  const [status, setStatus] = useState<Status>(() => getSocket().connected ? 'connected' : 'connecting');

  useEffect(() => {
    const s = getSocket();
    const onConnect = () => setStatus('connected');
    const onDisconnect = () => setStatus('disconnected');
    const onError = () => setStatus('disconnected');
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', onError);
    setStatus(s.connected ? 'connected' : 'connecting');
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      s.off('connect_error', onError);
    };
  }, []);

  if (status === 'connected') return null;

  const config = status === 'connecting'
    ? { bg: 'rgba(251,191,36,0.15)', border: 'rgba(251,191,36,0.30)', color: '#fbbf24', text: 'Подключение…' }
    : { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.30)', color: '#f87171', text: 'Нет связи' };

  return (
    <span
      role="status"
      aria-live="polite"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 8px',
        borderRadius: 8,
        background: config.bg,
        border: `1px solid ${config.border}`,
        color: config.color,
        fontSize: 10,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: 3,
          background: 'currentColor',
          animation: status === 'connecting' ? 'pulse 1.4s ease-in-out infinite' : undefined,
        }}
      />
      {config.text}
    </span>
  );
}
