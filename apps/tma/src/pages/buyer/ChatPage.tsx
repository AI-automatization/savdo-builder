import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { connectSocket } from '@/lib/socket';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { Spinner } from '@/components/ui/Spinner';
import { ThreadRowSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { glass } from '@/lib/styles';

interface ChatThread {
  id: string;
  threadType: string;
  status: string;
  lastMessageAt: string | null;
  lastMessage: string | null;
  productTitle: string | null;
  orderNumber: string | null;
  storeName: string | null;
  storeSlug: string | null;
  buyerPhone: string | null;
  unreadCount?: number;
}

interface ChatMessage {
  id: string;
  threadId: string;
  text: string;
  senderRole: 'BUYER' | 'SELLER';
  createdAt: string;
}

export default function BuyerChatPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    tg?.BackButton.show();
    const goBack = () => {
      if (activeThread) {
        setActiveThread(null);
        setMessages([]);
      } else {
        navigate('/buyer');
      }
    };
    tg?.BackButton.onClick(goBack);
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [navigate, tg, activeThread]);

  useEffect(() => {
    api<ChatThread[]>('/chat/threads')
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeThread) return;

    setMsgLoading(true);
    setMessages([]);

    api<{ messages: ChatMessage[]; hasMore: boolean }>(`/chat/threads/${activeThread.id}/messages`)
      .then((res) => setMessages((res.messages ?? []).slice().reverse()))
      .catch(() => showToast('❌ Не удалось загрузить сообщения', 'error'))
      .finally(() => setMsgLoading(false));

    // Подключаем сокет с актуальным токеном и присоединяемся к комнате
    const socket = connectSocket();
    socket.emit('join-chat-room', { threadId: activeThread.id });

    const onMessage = (msg: ChatMessage) => {
      if (msg.threadId !== activeThread.id) return;
      setMessages((prev) => [...prev, msg]);
      // Помечаем тред прочитанным при получении нового сообщения
      api(`/chat/threads/${activeThread.id}/read`, { method: 'PATCH' }).catch(() => {});
    };
    socket.on('chat:message', onMessage);

    return () => {
      socket.emit('leave-chat-room', { threadId: activeThread.id });
      socket.off('chat:message', onMessage);
    };
  }, [activeThread]);

  useEffect(() => {
    if (messages.length === 0) return;
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMsg = async () => {
    if (!text.trim() || !activeThread || sending) return;
    const msgText = text.trim();
    setSending(true);
    setText(''); // очищаем сразу для лучшего UX
    try {
      await api(`/chat/threads/${activeThread.id}/messages`, {
        method: 'POST',
        body: { text: msgText },
      });
    } catch {
      setText(msgText); // возвращаем текст если ошибка
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Не удалось отправить', 'error');
    } finally {
      setSending(false);
    }
  };

  const threadLabel = (t: ChatThread) => {
    if (t.storeName) return t.storeName;
    if (t.productTitle) return `Товар: ${t.productTitle}`;
    if (t.orderNumber) return `Заказ: ${t.orderNumber}`;
    return 'Диалог';
  };

  if (activeThread) {
    return (
      <AppShell role="BUYER">
        <div
          className="flex flex-col"
          style={{ height: 'calc(var(--tg-viewport-stable-height, 100dvh) - 7.5rem)' }}
        >
          {/* Header */}
          <div className="pb-2 mb-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <h2 className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {threadLabel(activeThread)}
                </h2>
                <span className="text-[11px]" style={{ color: activeThread.status === 'OPEN' ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}>
                  {activeThread.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                </span>
              </div>
              {activeThread.storeSlug && (
                <button
                  onClick={() => navigate(`/buyer/store/${activeThread.storeSlug}`)}
                  className="text-[11px] px-3 py-1 rounded-lg shrink-0"
                  style={{
                    background: 'rgba(124,58,237,0.15)',
                    border: '1px solid rgba(124,58,237,0.30)',
                    color: '#a78bfa',
                  }}
                >
                  Открыть магазин
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pb-2 min-h-0">
            {msgLoading && (
              <div className="flex justify-center py-8"><Spinner size={24} /></div>
            )}
            {!msgLoading && messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12">
                <span style={{ fontSize: 36 }}>💬</span>
                <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Сообщений пока нет</p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex flex-col max-w-[80%]"
                style={{ alignSelf: m.senderRole === 'BUYER' ? 'flex-end' : 'flex-start' }}
              >
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: m.senderRole === 'BUYER'
                      ? 'rgba(124,58,237,0.30)'
                      : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${m.senderRole === 'BUYER' ? 'rgba(124,58,237,0.40)' : 'rgba(255,255,255,0.12)'}`,
                    color: 'rgba(255,255,255,0.88)',
                  }}
                >
                  {m.text}
                </div>
                <span
                  className="text-[10px] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.25)', textAlign: m.senderRole === 'BUYER' ? 'right' : 'left' }}
                >
                  {new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input / closed notice */}
          {activeThread.status === 'OPEN' ? (
            <div className="flex gap-2 pt-2 shrink-0">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (text.trim()) sendMsg();
                  }
                }}
                placeholder="Сообщение... (Enter ↵)"
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  padding: '10px 14px',
                  outline: 'none',
                }}
              />
              <button
                onClick={sendMsg}
                disabled={!text.trim() || sending}
                aria-label="Отправить сообщение"
                style={{
                  padding: '10px 16px',
                  borderRadius: 12,
                  background: 'rgba(124,58,237,0.40)',
                  border: '1px solid rgba(124,58,237,0.50)',
                  color: '#fff',
                  fontSize: 18,
                  cursor: text.trim() && !sending ? 'pointer' : 'default',
                  opacity: text.trim() && !sending ? 1 : 0.4,
                  minWidth: 46,
                }}
              >
                {sending ? '⏳' : '➤'}
              </button>
            </div>
          ) : (
            <div className="pt-2 text-center text-[12px] shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Диалог закрыт продавцом — новые сообщения недоступны
            </div>
          )}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Сообщения
        </h1>

        {loading && [1,2,3].map((i) => <ThreadRowSkeleton key={i} />)}

        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-16">
            <span style={{ fontSize: 40 }}>💬</span>
            <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>Диалогов пока нет</p>
          </div>
        )}

        {threads.map((t) => (
          <div
            key={t.id}
            role="button"
            tabIndex={0}
            onClick={() => setActiveThread(t)}
            className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer active:opacity-70"
            style={glass}
          >
            <div className="relative w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.15)' }}>
              💬
              {(t.unreadCount ?? 0) > 0 && (
                <span
                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#A855F7', color: '#fff' }}
                >
                  {t.unreadCount! > 9 ? '9+' : t.unreadCount}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {threadLabel(t)}
              </p>
              <p className="text-[11px] truncate" style={{ color: t.status === 'OPEN' ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}>
                {t.lastMessage ?? (t.status === 'OPEN' ? 'Открыт' : 'Закрыт')}
              </p>
            </div>
            {t.lastMessageAt && (
              <span className="text-[11px] shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {new Date(t.lastMessageAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
          </div>
        ))}
      </div>
    </AppShell>
  );
}
