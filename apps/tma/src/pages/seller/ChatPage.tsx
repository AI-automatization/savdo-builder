import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { connectSocket, joinRoom } from '@/lib/socket';
import { useTelegram } from '@/providers/TelegramProvider';
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

export default function SellerChatPage() {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  // ── Thread list ──────────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Conversation ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showBuyerInfo, setShowBuyerInfo] = useState(false);

  // ── Report ───────────────────────────────────────────────────────────────────
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reporting, setReporting] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Back button ──────────────────────────────────────────────────────────────
  useEffect(() => {
    tg?.BackButton.show();
    const goBack = () => {
      if (threadId) {
        setShowBuyerInfo(false);
        navigate('/seller/chat', { replace: true });
      } else {
        navigate('/seller');
      }
    };
    tg?.BackButton.onClick(goBack);
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [navigate, tg, threadId]);

  // ── Load thread list ─────────────────────────────────────────────────────────
  useEffect(() => {
    api<ChatThread[]>('/chat/threads')
      .then(setThreads)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Load messages + connect socket when threadId changes ─────────────────────
  useEffect(() => {
    if (!threadId) return;

    setMsgLoading(true);
    setMessages([]);
    setShowBuyerInfo(false);

    api<{ messages: ChatMessage[]; hasMore: boolean }>(`/chat/threads/${threadId}/messages`)
      .then((res) => setMessages((res.messages ?? []).slice().reverse()))
      .catch(() => {
        showToast('❌ Ошибка загрузки сообщений', 'error');
        navigate('/seller/chat', { replace: true });
      })
      .finally(() => setMsgLoading(false));

    const socket = connectSocket();
    joinRoom(socket, threadId);

    const onMessage = (msg: ChatMessage) => {
      if (msg.threadId !== threadId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        let tempIdx = -1;
        for (let i = prev.length - 1; i >= 0; i--) {
          if (prev[i].id.startsWith('temp_') && prev[i].text === msg.text && prev[i].senderRole === msg.senderRole) {
            tempIdx = i;
            break;
          }
        }
        if (tempIdx >= 0) {
          const next = [...prev];
          next[tempIdx] = msg;
          return next;
        }
        return [...prev, msg];
      });
      api(`/chat/threads/${threadId}/read`, { method: 'PATCH' }).catch(() => {});
    };

    socket.on('chat:message', onMessage);

    return () => {
      socket.emit('leave-chat-room', { threadId });
      socket.off('chat:message', onMessage);
    };
  }, [threadId, navigate]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message (optimistic) ────────────────────────────────────────────────
  const sendMsg = async () => {
    if (!text.trim() || !threadId || sending) return;
    const msgText = text.trim();
    setSending(true);
    setText('');

    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, threadId, text: msgText, senderRole: 'SELLER', createdAt: new Date().toISOString() },
    ]);

    try {
      await api(`/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: { text: msgText },
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(msgText);
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Не удалось отправить', 'error');
    } finally {
      setSending(false);
    }
  };

  // ── Resolve thread ───────────────────────────────────────────────────────────
  const resolveThread = async () => {
    const active = threads.find((t) => t.id === threadId);
    if (!active || active.status !== 'OPEN') return;
    setResolving(true);
    try {
      await api(`/chat/threads/${threadId}/resolve`, { method: 'PATCH' });
      setThreads((prev) => prev.map((t) => t.id === threadId ? { ...t, status: 'CLOSED' } : t));
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Диалог закрыт');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Не удалось закрыть', 'error');
    } finally {
      setResolving(false);
    }
  };

  // ── Report message ───────────────────────────────────────────────────────────
  const startLongPress = (msg: ChatMessage) => {
    longPressTimer.current = setTimeout(() => {
      tg?.HapticFeedback.impactOccurred('medium');
      setReportTarget(msg);
    }, 500);
  };
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const submitReport = async () => {
    if (!reportTarget || reporting) return;
    setReporting(true);
    try {
      await api(`/chat/messages/${reportTarget.id}/report`, { method: 'PATCH' });
      showToast('✅ Жалоба отправлена');
    } catch {
      showToast('❌ Не удалось отправить жалобу', 'error');
    } finally {
      setReporting(false);
      setReportTarget(null);
    }
  };

  const threadLabel = (t: ChatThread) => {
    if (t.buyerPhone) return t.buyerPhone;
    if (t.productTitle) return `Товар: ${t.productTitle}`;
    if (t.orderNumber) return `Заказ: ${t.orderNumber}`;
    return 'Покупатель';
  };

  const activeThread = threads.find((t) => t.id === threadId) ?? null;

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (threadId) {
    return (
      
        {/* Report confirmation dialog */}
        {reportTarget && (
          <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setReportTarget(null)}
          >
            <div
              className="w-full rounded-t-2xl p-5 flex flex-col gap-4"
              style={{ background: '#1a1035', border: '1px solid rgba(255,255,255,0.10)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-center" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Пожаловаться на сообщение?
              </p>
              <p className="text-xs text-center px-4 py-2 rounded-xl truncate"
                style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.50)' }}>
                «{reportTarget.text.slice(0, 80)}{reportTarget.text.length > 80 ? '…' : ''}»
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReportTarget(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.60)' }}
                >
                  Отмена
                </button>
                <button
                  onClick={submitReport}
                  disabled={reporting}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.35)', color: '#f87171' }}
                >
                  {reporting ? '...' : 'Пожаловаться'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div
          className="flex flex-col"
          style={{ height: 'calc(var(--tg-viewport-stable-height, 100dvh) - 7.5rem)' }}
        >
          {/* Header */}
          <div className="pb-2 mb-2 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setShowBuyerInfo(false); navigate('/seller/chat', { replace: true }); }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.70)',
                  fontSize: 16,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  cursor: 'pointer',
                }}
              >
                ‹
              </button>
              <button
                onClick={() => setShowBuyerInfo((v) => !v)}
                className="flex flex-col min-w-0 flex-1 text-left"
              >
                <h2 className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  {activeThread ? threadLabel(activeThread) : <span style={{ opacity: 0.4 }}>Загрузка...</span>}
                </h2>
                {activeThread && (
                  <span className="text-[11px]" style={{ color: activeThread.status === 'OPEN' ? '#22D3EE' : 'rgba(255,255,255,0.35)' }}>
                    {activeThread.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                    {activeThread.productTitle && ` · ${activeThread.productTitle}`}
                  </span>
                )}
              </button>
              {activeThread?.status === 'OPEN' && (
                <button
                  onClick={resolveThread}
                  disabled={resolving}
                  className="text-[11px] px-3 py-1 rounded-lg shrink-0"
                  style={{
                    background: 'rgba(34,197,94,0.12)',
                    border: '1px solid rgba(34,197,94,0.25)',
                    color: '#4ade80',
                    opacity: resolving ? 0.5 : 1,
                  }}
                >
                  {resolving ? '...' : 'Закрыть тред'}
                </button>
              )}
            </div>

            {/* Buyer info card */}
            {showBuyerInfo && activeThread?.buyerPhone && (
              <div
                className="mt-2 px-3 py-2 rounded-xl flex items-center justify-between gap-3"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)' }}
              >
                <div>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Покупатель</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
                    {activeThread.buyerPhone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeThread.buyerPhone!).catch(() => {});
                    showToast('✅ Скопировано');
                  }}
                  className="text-[11px] px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(124,58,237,0.20)', border: '1px solid rgba(124,58,237,0.30)', color: '#a78bfa' }}
                >
                  Копировать
                </button>
              </div>
            )}
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
                className="flex flex-col max-w-[80%] select-none"
                style={{ alignSelf: m.senderRole === 'SELLER' ? 'flex-end' : 'flex-start' }}
                onTouchStart={() => startLongPress(m)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onContextMenu={(e) => { e.preventDefault(); setReportTarget(m); }}
              >
                <div
                  className="px-3 py-2 rounded-xl text-sm"
                  style={{
                    background: m.id.startsWith('temp_')
                      ? 'rgba(124,58,237,0.20)'
                      : m.senderRole === 'SELLER'
                        ? 'rgba(124,58,237,0.30)'
                        : 'rgba(255,255,255,0.08)',
                    border: `1px solid ${m.senderRole === 'SELLER' ? 'rgba(124,58,237,0.40)' : 'rgba(255,255,255,0.12)'}`,
                    color: 'rgba(255,255,255,0.88)',
                    opacity: m.id.startsWith('temp_') ? 0.7 : 1,
                  }}
                >
                  {m.text}
                </div>
                <span
                  className="text-[10px] mt-0.5"
                  style={{ color: 'rgba(255,255,255,0.25)', textAlign: m.senderRole === 'SELLER' ? 'right' : 'left' }}
                >
                  {m.id.startsWith('temp_') ? '...' : new Date(m.createdAt).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input / closed notice */}
          {(activeThread?.status === 'OPEN' || !activeThread) ? (
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
              Диалог закрыт — новые сообщения недоступны
            </div>
          )}
        </div>
      
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THREAD LIST VIEW
  // ════════════════════════════════════════════════════════════════════════════
  return (
    
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Сообщения
        </h1>

        {loading && [1, 2, 3].map((i) => <ThreadRowSkeleton key={i} />)}

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
            onClick={() => navigate(`/seller/chat/${t.id}`)}
            className="flex items-center gap-3 p-4 rounded-2xl cursor-pointer active:opacity-70"
            style={glass}
          >
            <div
              className="relative w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.15)' }}
            >
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
    
  );
}
