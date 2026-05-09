import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, apiUpload } from '@/lib/api';
import { connectSocket, joinRoom } from '@/lib/socket';
import { refreshChatUnread } from '@/lib/chatUnread';
import { useChatTyping } from '@/lib/useChatTyping';
import { useTelegram } from '@/providers/TelegramProvider';
import { Spinner } from '@/components/ui/Spinner';
import { Skeleton, ThreadRowSkeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/components/ui/Toast';
import { SocketStatusBadge } from '@/components/ui/SocketStatusBadge';
import { glass } from '@/lib/styles';
import { clickableA11y } from '@/lib/a11y';

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
  editedAt?: string | null;
  isDeleted?: boolean;
  mediaUrl?: string | null;
  messageType?: string;
  parentMessage?: { id: string; text: string; senderRole: 'BUYER' | 'SELLER' } | null;
}

const EDIT_WINDOW_MS = 15 * 60 * 1000;
function canEditMessage(m: ChatMessage): boolean {
  if (m.senderRole !== 'SELLER') return false;
  if (m.isDeleted) return false;
  return Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;
}
function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

export default function SellerChatPage() {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { tg, viewportWidth } = useTelegram();
  const isDesktop = (viewportWidth ?? 0) >= 1024;

  // ── Thread list ──────────────────────────────────────────────────────────────
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [threadsError, setThreadsError] = useState(false);

  // ── Conversation ─────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [msgLoading, setMsgLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [showBuyerInfo, setShowBuyerInfo] = useState(false);

  // ── Long-press menu / Edit / Reply / Delete ────────────────────────────────
  const [actionTarget, setActionTarget] = useState<ChatMessage | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [reportTarget, setReportTarget] = useState<ChatMessage | null>(null);
  const [reporting, setReporting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bottomRef = useRef<HTMLDivElement>(null);

  // FEAT-005-FE: typing indicator
  const { isOtherTyping, emitTyping } = useChatTyping(threadId ?? null, 'SELLER');

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

  // ── Load thread list (TMA-SELLER-CHAT-PERF-001: AbortController) ────────────
  const threadsAbortRef = useRef<AbortController | null>(null);
  const loadThreads = () => {
    threadsAbortRef.current?.abort();
    const ac = new AbortController();
    threadsAbortRef.current = ac;
    setLoading(true);
    setThreadsError(false);
    api<ChatThread[]>('/chat/threads', { signal: ac.signal })
      .then((data) => {
        if (ac.signal.aborted) return;
        setThreads(data ?? []);
      })
      .catch((err) => {
        if (ac.signal.aborted) return;
        setThreadsError(true);
        const msg = err instanceof Error ? err.message : 'Не удалось загрузить чаты';
        showToast(`❌ ${msg}`, 'error');
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
  };
  useEffect(() => {
    loadThreads();
    return () => threadsAbortRef.current?.abort();
  }, []);

  // ── Load messages + connect socket when threadId changes ─────────────────────
  const messagesAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!threadId) return;

    messagesAbortRef.current?.abort();
    const ac = new AbortController();
    messagesAbortRef.current = ac;

    setMsgLoading(true);
    setMessages([]);
    setShowBuyerInfo(false);

    api<{ messages: ChatMessage[]; hasMore: boolean }>(`/chat/threads/${threadId}/messages`, { signal: ac.signal })
      .then((res) => { if (!ac.signal.aborted) setMessages((res.messages ?? []).slice().reverse()); })
      .catch((err) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        navigate('/seller/chat', { replace: true });
      })
      .finally(() => { if (!ac.signal.aborted) setMsgLoading(false); });

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
      api(`/chat/threads/${threadId}/read`, { method: 'PATCH' })
        .then(() => { void refreshChatUnread(); })
        .catch(() => {});
    };

    const onEdited = (msg: { id: string; text: string; editedAt: string | null }) => {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, text: msg.text, editedAt: msg.editedAt } : m));
    };
    const onDeleted = (msg: { id: string }) => {
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isDeleted: true, text: '' } : m));
    };

    socket.on('chat:message', onMessage);
    socket.on('chat:message:edited', onEdited);
    socket.on('chat:message:deleted', onDeleted);

    return () => {
      ac.abort();
      socket.emit('leave-chat-room', { threadId });
      socket.off('chat:message', onMessage);
      socket.off('chat:message:edited', onEdited);
      socket.off('chat:message:deleted', onDeleted);
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
    const parentId = replyTo?.id;
    const parentSnapshot = replyTo ? { id: replyTo.id, text: replyTo.text, senderRole: replyTo.senderRole } : null;
    setSending(true);
    setText('');
    setReplyTo(null);

    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, threadId, text: msgText, senderRole: 'SELLER', createdAt: new Date().toISOString(), parentMessage: parentSnapshot },
    ]);

    try {
      await api(`/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: { text: msgText, parentMessageId: parentId },
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

  // TMA-PHOTO-UPLOAD-DIAG-001: было 2 бага — (1) `api()` JSON.stringify'ил FormData,
  // файл терялся; (2) destructure `uploadRes.id` — API возвращает `mediaFileId`.
  // Перешёл на `apiUpload` (XHR с правильным multipart).
  const sendPhoto = async (file: File) => {
    if (!threadId || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', 'chat_photo');
      const { mediaFileId } = await apiUpload<{ mediaFileId: string; url: string }>(
        '/media/upload',
        formData,
      );
      await api(`/chat/threads/${threadId}/messages`, {
        method: 'POST',
        body: { mediaId: mediaFileId, ...(replyTo ? { parentMessageId: replyTo.id } : {}) },
      });
      setReplyTo(null);
      tg?.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось отправить фото';
      showToast(`❌ ${msg}`, 'error');
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const submitEdit = async () => {
    if (!editingId || !threadId || !editText.trim()) return;
    const newText = editText.trim();
    const id = editingId;
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, text: newText, editedAt: new Date().toISOString() } : m));
    setEditingId(null);
    setEditText('');
    try {
      await api(`/chat/threads/${threadId}/messages/${id}`, {
        method: 'PATCH',
        body: { text: newText },
      });
      tg?.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось изменить';
      showToast(`❌ ${msg}`, 'error');
      tg?.HapticFeedback.notificationOccurred('error');
    }
  };

  const deleteMsg = async (id: string) => {
    if (!threadId) return;
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isDeleted: true, text: '' } : m));
    try {
      await api(`/chat/threads/${threadId}/messages/${id}`, { method: 'DELETE' });
      tg?.HapticFeedback.notificationOccurred('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось удалить';
      showToast(`❌ ${msg}`, 'error');
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

  // ── Long-press menu ──────────────────────────────────────────────────────────
  const startLongPress = (msg: ChatMessage) => {
    if (msg.isDeleted || msg.id.startsWith('temp_')) return;
    longPressTimer.current = setTimeout(() => {
      tg?.HapticFeedback.impactOccurred('medium');
      setActionTarget(msg);
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

  // Контекст thread'а: показываем мелким шрифтом подзаголовок если у нас есть
  // товар или номер заказа. Помогает различать несколько диалогов с одного
  // покупателя — раньше две строки `+998904840748` было неотличимо.
  const threadContext = (t: ChatThread): string | null => {
    if (t.productTitle) return `📦 ${t.productTitle}`;
    if (t.orderNumber) return `🧾 Заказ #${t.orderNumber.replace(/^ORD-/, '')}`;
    return null;
  };

  // Мелкая «аватарка» — последние 2 цифры телефона, цвет hash'ируется по id треда.
  const avatarColors = [
    { bg: 'rgba(168,85,247,0.20)', fg: '#A855F7' },
    { bg: 'rgba(34,211,238,0.20)', fg: '#22D3EE' },
    { bg: 'rgba(52,211,153,0.20)', fg: '#34D399' },
    { bg: 'rgba(251,191,36,0.20)', fg: '#FBBF24' },
    { bg: 'rgba(248,113,113,0.20)', fg: '#F87171' },
  ];
  const avatarStyle = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];
  const avatarLabel = (t: ChatThread): string => {
    if (t.buyerPhone) return t.buyerPhone.slice(-2);
    return '💬';
  };

  const activeThread = threads.find((t) => t.id === threadId) ?? null;

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (threadId) {
    return (
      <>
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
                aria-label="Назад к диалогам"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.70)',
                  fontSize: 22,
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
                <div className="flex items-center gap-2 min-w-0">
                  {activeThread && (
                    <span className="text-xs truncate" style={{ color: activeThread.status === 'OPEN' ? '#22D3EE' : 'rgba(255,255,255,0.55)' }}>
                      <span aria-hidden="true">{activeThread.status === 'OPEN' ? '✓ ' : '🔒 '}</span>
                      {activeThread.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                      {activeThread.productTitle && ` · ${activeThread.productTitle}`}
                    </span>
                  )}
                  <SocketStatusBadge />
                </div>
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
                  <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>Покупатель</p>
                  <p className="text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.85)', fontFamily: 'monospace' }}>
                    {activeThread.buyerPhone}
                  </p>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(activeThread.buyerPhone!)
                      .then(() => showToast('✅ Скопировано'))
                      .catch(() => showToast('❌ Не удалось скопировать', 'error'));
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
              <div className="flex flex-col gap-3 py-4">
                <Skeleton style={{ height: 40, width: '60%', alignSelf: 'flex-start' }} />
                <Skeleton style={{ height: 40, width: '70%', alignSelf: 'flex-end' }} />
                <Skeleton style={{ height: 40, width: '50%', alignSelf: 'flex-start' }} />
                <Skeleton style={{ height: 40, width: '65%', alignSelf: 'flex-end' }} />
              </div>
            )}
            {!msgLoading && messages.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-12">
                <span aria-hidden="true" style={{ fontSize: 36 }}>💬</span>
                <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Сообщений пока нет</p>
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
                onContextMenu={(e) => { e.preventDefault(); if (!m.isDeleted && !m.id.startsWith('temp_')) setActionTarget(m); }}
              >
                {m.isDeleted ? (
                  <div
                    className="px-3 py-2 rounded-xl text-xs italic"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.40)' }}
                  >
                    🗑 Сообщение удалено
                  </div>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
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
                    {m.parentMessage && (
                      <div className="px-3 pt-2">
                        <div
                          className="px-2 py-1 rounded-md text-[11px] truncate"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            borderLeft: '3px solid rgba(168,85,247,0.70)',
                            color: 'rgba(255,255,255,0.65)',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'rgba(168,85,247,0.95)' }}>
                            ↩ {m.parentMessage.senderRole === 'SELLER' ? 'Вы' : 'Покупатель'}
                          </span>
                          <span className="ml-1.5">{m.parentMessage.text.slice(0, 60) || '📷 Фото'}</span>
                        </div>
                      </div>
                    )}
                    {m.mediaUrl && (
                      <img src={m.mediaUrl} alt="" className="w-full" style={{ maxHeight: 320, objectFit: 'cover', display: 'block' }} />
                    )}
                    {m.text && <div className="px-3 py-2 text-sm">{m.text}</div>}
                  </div>
                )}
                <span
                  className="text-[10px] mt-0.5 flex items-center gap-1"
                  style={{ color: 'rgba(255,255,255,0.30)', alignSelf: m.senderRole === 'SELLER' ? 'flex-end' : 'flex-start' }}
                >
                  {m.id.startsWith('temp_') ? '...' : timeStr(m.createdAt)}
                  {m.editedAt && !m.isDeleted && <span style={{ fontStyle: 'italic' }}>· изменено</span>}
                </span>
              </div>
            ))}
            {isOtherTyping && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 self-start rounded-xl"
                style={{ background: 'rgba(255,255,255,0.06)', maxWidth: 100 }}
                aria-live="polite"
              >
                <span className="typing-dot" style={{ animationDelay: '0ms' }} />
                <span className="typing-dot" style={{ animationDelay: '180ms' }} />
                <span className="typing-dot" style={{ animationDelay: '360ms' }} />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input / closed notice */}
          {(activeThread?.status === 'OPEN' || !activeThread) ? (
            <div className="flex flex-col gap-1.5 pt-2 shrink-0">
              {replyTo && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(168,85,247,0.12)', borderLeft: '3px solid rgba(168,85,247,0.70)' }}>
                  <span style={{ fontSize: 16 }}>↩</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-semibold" style={{ color: 'rgba(168,85,247,0.95)' }}>
                      Ответ {replyTo.senderRole === 'SELLER' ? 'себе' : 'покупателю'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.65)' }}>{replyTo.text || '📷 Фото'}</p>
                  </div>
                  <button onClick={() => setReplyTo(null)} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: 12 }} aria-label="Отменить ответ">✕</button>
                </div>
              )}
              {editingId && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(34,211,238,0.12)', borderLeft: '3px solid rgba(34,211,238,0.70)' }}>
                  <span style={{ fontSize: 16 }}>✎</span>
                  <p className="flex-1 text-xs" style={{ color: '#22D3EE' }}>Редактирование сообщения</p>
                  <button onClick={() => { setEditingId(null); setEditText(''); }} className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.55)', fontSize: 12 }} aria-label="Отменить">✕</button>
                </div>
              )}
              <div className="flex gap-2">
                {!editingId && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) sendPhoto(file);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingPhoto || sending}
                      aria-label="Прикрепить фото"
                      style={{ padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.70)', fontSize: 18, cursor: uploadingPhoto ? 'wait' : 'pointer', opacity: uploadingPhoto ? 0.5 : 1 }}
                    >
                      {uploadingPhoto ? '⏳' : '📎'}
                    </button>
                  </>
                )}
                <input
                  value={editingId ? editText : text}
                  onChange={(e) => {
                    if (editingId) {
                      setEditText(e.target.value);
                    } else {
                      setText(e.target.value);
                      if (e.target.value.trim()) emitTyping(true);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (editingId) {
                        if (editText.trim()) submitEdit();
                      } else if (text.trim()) {
                        emitTyping(false);
                        sendMsg();
                      }
                    }
                  }}
                  placeholder={editingId ? 'Изменить сообщение... (Enter ↵)' : 'Сообщение... (Enter ↵)'}
                  style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#fff', fontSize: 14, padding: '10px 14px', outline: 'none' }}
                />
                <button
                  onClick={() => { if (!editingId) emitTyping(false); (editingId ? submitEdit : sendMsg)(); }}
                  disabled={editingId ? !editText.trim() : (!text.trim() || sending)}
                  aria-label={editingId ? 'Сохранить' : 'Отправить'}
                  style={{ padding: '10px 16px', borderRadius: 12, background: 'rgba(124,58,237,0.40)', border: '1px solid rgba(124,58,237,0.50)', color: '#fff', fontSize: 18, cursor: 'pointer', opacity: (editingId ? editText.trim() : (text.trim() && !sending)) ? 1 : 0.4, minWidth: 46 }}
                >
                  {editingId ? '✓' : (sending ? <Spinner size={14} /> : '➤')}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-center text-[12px] shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Диалог закрыт — новые сообщения недоступны
            </div>
          )}

          {/* Action menu */}
          {actionTarget && (
            <div className="fixed inset-0 z-50 flex items-end" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={() => setActionTarget(null)}>
              <div className="w-full rounded-t-2xl flex flex-col" style={{ background: '#1a1035', border: '1px solid rgba(255,255,255,0.10)', maxWidth: 600, margin: '0 auto' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full" style={{ background: 'rgba(255,255,255,0.18)' }} /></div>
                <div className="flex flex-col">
                  <button onClick={() => { setReplyTo(actionTarget); setActionTarget(null); }} className="text-left px-5 py-3 text-sm flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>↩</span> Ответить
                  </button>
                  {canEditMessage(actionTarget) && (
                    <button onClick={() => { setEditingId(actionTarget.id); setEditText(actionTarget.text); setActionTarget(null); }} className="text-left px-5 py-3 text-sm flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>✎</span> Изменить
                    </button>
                  )}
                  {actionTarget.senderRole === 'SELLER' && (
                    <button onClick={() => { deleteMsg(actionTarget.id); setActionTarget(null); }} className="text-left px-5 py-3 text-sm flex items-center gap-3" style={{ color: '#f87171', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>🗑</span> Удалить
                    </button>
                  )}
                  {actionTarget.senderRole === 'BUYER' && (
                    <button onClick={() => { setReportTarget(actionTarget); setActionTarget(null); }} className="text-left px-5 py-3 text-sm flex items-center gap-3" style={{ color: 'rgba(255,255,255,0.70)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span>⚠️</span> Пожаловаться
                    </button>
                  )}
                  <button onClick={() => setActionTarget(null)} className="text-center px-5 py-3 text-sm font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>Отмена</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // THREAD LIST VIEW (desktop = list left + placeholder right)
  // ════════════════════════════════════════════════════════════════════════════
  const threadList = (
    <div className="flex flex-col gap-2">
      <h1 className="text-base font-bold mb-2" style={{ color: 'rgba(255,255,255,0.90)' }}>
        Сообщения
      </h1>

      {loading && [1, 2, 3].map((i) => <ThreadRowSkeleton key={i} />)}

      {!loading && threadsError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <span aria-hidden="true" style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 14 }}>Не удалось загрузить чаты</p>
          <button
            onClick={loadThreads}
            className="text-xs font-semibold py-2 px-4 rounded-full"
            style={{ background: 'rgba(168,85,247,0.18)', border: '1px solid rgba(168,85,247,0.35)', color: '#A855F7' }}
          >
            ↻ Повторить
          </button>
        </div>
      )}

      {!loading && !threadsError && threads.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <span style={{ fontSize: 40 }}>💬</span>
          <p style={{ color: 'rgba(255,255,255,0.40)', fontSize: 14 }}>Диалогов пока нет</p>
        </div>
      )}

      {threads.map((t) => {
        const ctx = threadContext(t);
        const ac = avatarStyle(t.id);
        const unread = t.unreadCount ?? 0;
        return (
          <div
            key={t.id}
            {...clickableA11y(() => navigate(`/seller/chat/${t.id}`))}
            aria-label={`Чат с покупателем${unread > 0 ? `, ${unread} непрочитанных` : ''}`}
            className="flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer active:opacity-70 transition-all"
            style={glass}
          >
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: ac.bg, border: `1px solid ${ac.fg}33` }}
            >
              <span style={{ color: ac.fg, fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
                {avatarLabel(t)}
              </span>
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: '#A855F7', color: '#fff' }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: unread > 0 ? '#fff' : 'rgba(255,255,255,0.88)' }}>
                  {threadLabel(t)}
                </p>
                {t.lastMessageAt && (
                  <span className="text-[10px] shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }}>
                    {new Date(t.lastMessageAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
              {ctx && (
                <p className="text-[11px] truncate" style={{ color: 'rgba(168,85,247,0.85)' }}>
                  {ctx}
                </p>
              )}
              <p className="text-xs truncate" style={{ color: unread > 0 ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.50)', fontWeight: unread > 0 ? 500 : 400 }}>
                {t.lastMessage ?? (t.status === 'OPEN' ? 'Диалог открыт' : '🔒 Закрыт')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (isDesktop) {
    return (
      <div
        className="grid gap-4"
        style={{
          gridTemplateColumns: '380px 1fr',
          height: 'calc(var(--tg-viewport-stable-height, 100dvh) - 7.5rem)',
        }}
      >
        <div className="overflow-y-auto pr-1">{threadList}</div>
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px dashed rgba(255,255,255,0.08)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 56, opacity: 0.35 }}>💬</span>
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
            Выберите диалог слева
          </p>
        </div>
      </div>
    );
  }

  return <div className="flex flex-col gap-3">{threadList}</div>;
}
