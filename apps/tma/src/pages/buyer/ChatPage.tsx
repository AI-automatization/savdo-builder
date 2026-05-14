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
import { useTranslation } from '@/lib/i18n';

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
  if (m.senderRole !== 'BUYER') return false;
  if (m.isDeleted) return false;
  return Date.now() - new Date(m.createdAt).getTime() < EDIT_WINDOW_MS;
}
function timeStr(iso: string): string {
  return new Date(iso).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
}

export default function BuyerChatPage() {
  const { threadId } = useParams<{ threadId?: string }>();
  const navigate = useNavigate();
  const { tg, viewportWidth } = useTelegram();
  const { t } = useTranslation();
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
  const { isOtherTyping, emitTyping } = useChatTyping(threadId ?? null, 'BUYER');

  // ── Back button ──────────────────────────────────────────────────────────────
  useEffect(() => {
    tg?.BackButton.show();
    const goBack = () => {
      if (threadId) navigate('/buyer/chat', { replace: true });
      else navigate('/buyer');
    };
    tg?.BackButton.onClick(goBack);
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [navigate, tg, threadId]);

  // ── Load thread list ─────────────────────────────────────────────────────────
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
        if (err instanceof Error && err.name === 'AbortError') return;
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
  useEffect(() => {
    if (!threadId) return;

    setMsgLoading(true);
    setMessages([]);

    const msgAc = new AbortController();
    api<{ messages: ChatMessage[]; hasMore: boolean }>(`/chat/threads/${threadId}/messages`, { signal: msgAc.signal })
      .then((res) => { if (!msgAc.signal.aborted) setMessages((res.messages ?? []).slice().reverse()); })
      .catch((err) => {
        if (msgAc.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        navigate('/buyer/chat', { replace: true });
      })
      .finally(() => { if (!msgAc.signal.aborted) setMsgLoading(false); });

    const socket = connectSocket();
    joinRoom(socket, threadId);

    const onMessage = (msg: ChatMessage) => {
      if (msg.threadId !== threadId) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        // Replace optimistic temp message if text + role match
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
      msgAc.abort();
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
      { id: tempId, threadId, text: msgText, senderRole: 'BUYER', createdAt: new Date().toISOString(), parentMessage: parentSnapshot },
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
      showToast(t('chat.sendError'), 'error');
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

  // ── Edit message ─────────────────────────────────────────────────────────────
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

  // ── Delete message ───────────────────────────────────────────────────────────
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
      showToast(t('chat.reportSent'));
    } catch {
      showToast(t('chat.reportError'), 'error');
    } finally {
      setReporting(false);
      setReportTarget(null);
    }
  };

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const threadLabel = (t: ChatThread) => {
    if (t.storeName) return t.storeName;
    if (t.productTitle) return `Товар: ${t.productTitle}`;
    if (t.orderNumber) return `Заказ: ${t.orderNumber}`;
    return 'Диалог';
  };

  // Контекст thread'а: буква бренда магазина для аватарки + 2-я строка с
  // продукт/заказ если они дополняют storeName (раньше storeName съедал контекст).
  const threadContext = (t: ChatThread): string | null => {
    if (t.storeName && t.productTitle) return `📦 ${t.productTitle}`;
    if (t.storeName && t.orderNumber) return `🧾 Заказ #${t.orderNumber.replace(/^ORD-/, '')}`;
    return null;
  };
  const avatarColors = [
    { bg: 'rgba(168,85,247,0.20)', fg: '#A855F7' },
    { bg: 'rgba(34,211,238,0.20)', fg: '#22D3EE' },
    { bg: 'rgba(52,211,153,0.20)', fg: '#34D399' },
    { bg: 'rgba(251,191,36,0.20)', fg: '#FBBF24' },
  ];
  const avatarStyle = (id: string) => avatarColors[id.charCodeAt(0) % avatarColors.length];

  const activeThread = threads.find((t) => t.id === threadId) ?? null;

  // ════════════════════════════════════════════════════════════════════════════
  // CONVERSATION VIEW
  // ════════════════════════════════════════════════════════════════════════════
  if (threadId) {
    return (
      <>
        {reportTarget && (
          <div
            className="fixed inset-0 z-50 flex items-end"
            style={{ background: 'rgba(0,0,0,0.55)' }}
            onClick={() => setReportTarget(null)}
          >
            <div
              className="w-full rounded-t-2xl p-5 flex flex-col gap-4"
              style={{ background: '#1a1035', border: '1px solid var(--tg-border)' }}
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-sm font-semibold text-center" style={{ color: 'var(--tg-text-primary)' }}>
                Пожаловаться на сообщение?
              </p>
              <p className="text-xs text-center px-4 py-2 rounded-xl truncate"
                style={{ background: 'var(--tg-surface-hover)', color: 'var(--tg-text-secondary)' }}>
                «{reportTarget.text.slice(0, 80)}{reportTarget.text.length > 80 ? '…' : ''}»
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setReportTarget(null)}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold"
                  style={{ background: 'var(--tg-surface-hover)', color: 'var(--tg-text-secondary)' }}
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
          <div className="pb-2 mb-2 shrink-0" style={{ borderBottom: '1px solid var(--tg-border-soft)' }}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate('/buyer/chat', { replace: true })}
                aria-label={t('chat.backToThreads')}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'var(--tg-surface-hover)',
                  border: '1px solid var(--tg-border)',
                  color: 'var(--tg-text-secondary)',
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
              <div className="flex flex-col min-w-0 flex-1">
                <h2 className="text-sm font-bold truncate" style={{ color: 'var(--tg-text-primary)' }}>
                  {activeThread ? threadLabel(activeThread) : <span style={{ opacity: 0.4 }}>{t('common.loading')}</span>}
                </h2>
                <div className="flex items-center gap-2">
                  {activeThread && (
                    <span className="text-xs" style={{ color: activeThread.status === 'OPEN' ? '#22D3EE' : 'var(--tg-text-secondary)' }}>
                      <span aria-hidden="true">{activeThread.status === 'OPEN' ? '✓ ' : '🔒 '}</span>
                      {activeThread.status === 'OPEN' ? 'Открыт' : 'Закрыт'}
                    </span>
                  )}
                  <SocketStatusBadge />
                </div>
              </div>
              {activeThread?.storeSlug && (
                <button
                  onClick={() => navigate(`/buyer/store/${activeThread.storeSlug}`)}
                  className="text-xxs px-3 py-1 rounded-lg shrink-0"
                  style={{
                    background: 'var(--tg-accent-bg)',
                    border: '1px solid var(--tg-accent-border)',
                    color: 'var(--tg-accent)',
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
                <p style={{ color: 'var(--tg-text-secondary)', fontSize: 13 }}>{t('chat.empty')}</p>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                className="flex flex-col max-w-[80%] select-none"
                style={{ alignSelf: m.senderRole === 'BUYER' ? 'flex-end' : 'flex-start' }}
                onTouchStart={() => startLongPress(m)}
                onTouchEnd={cancelLongPress}
                onTouchMove={cancelLongPress}
                onContextMenu={(e) => { e.preventDefault(); if (!m.isDeleted && !m.id.startsWith('temp_')) setActionTarget(m); }}
              >
                {m.isDeleted ? (
                  <div
                    className="px-3 py-2 rounded-xl text-xs italic"
                    style={{
                      background: 'var(--tg-surface)',
                      border: '1px solid var(--tg-border-soft)',
                      color: 'var(--tg-text-muted)',
                    }}
                  >
                    🗑 Сообщение удалено
                  </div>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{
                      background: m.id.startsWith('temp_')
                        ? 'var(--tg-accent-bg)'
                        : m.senderRole === 'BUYER'
                          ? 'var(--tg-accent-dim)'
                          : 'var(--tg-border-soft)',
                      border: `1px solid ${m.senderRole === 'BUYER' ? 'var(--tg-accent-border)' : 'var(--tg-border)'}`,
                      color: 'var(--tg-text-primary)',
                      opacity: m.id.startsWith('temp_') ? 0.7 : 1,
                    }}
                  >
                    {m.parentMessage && (
                      <div
                        className="px-3 pt-2"
                      >
                        <div
                          className="px-2 py-1 rounded-md text-xxs truncate"
                          style={{
                            background: 'var(--tg-border-soft)',
                            borderLeft: '3px solid var(--tg-accent)',
                            color: 'var(--tg-text-secondary)',
                          }}
                        >
                          <span style={{ fontWeight: 600, color: 'var(--tg-accent)' }}>
                            ↩ {m.parentMessage.senderRole === 'BUYER' ? 'Вы' : 'Продавец'}
                          </span>
                          <span className="ml-1.5">{m.parentMessage.text.slice(0, 60) || '📷 Фото'}</span>
                        </div>
                      </div>
                    )}
                    {m.mediaUrl && (
                      <img
                        src={m.mediaUrl}
                        alt=""
                        className="w-full"
                        style={{ maxHeight: 320, objectFit: 'cover', display: 'block' }}
                      />
                    )}
                    {m.text && (
                      <div className="px-3 py-2 text-sm">
                        {m.text}
                      </div>
                    )}
                  </div>
                )}
                <span
                  className="text-xxs mt-0.5 flex items-center gap-1"
                  style={{ color: 'var(--tg-text-dim)', alignSelf: m.senderRole === 'BUYER' ? 'flex-end' : 'flex-start' }}
                >
                  {m.id.startsWith('temp_') ? '...' : timeStr(m.createdAt)}
                  {m.editedAt && !m.isDeleted && (
                    <span style={{ fontStyle: 'italic' }}>{t('chat.edited')}</span>
                  )}
                </span>
              </div>
            ))}
            {isOtherTyping && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 self-start rounded-xl"
                style={{ background: 'var(--tg-surface-hover)', maxWidth: 100 }}
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
              {/* Reply banner */}
              {replyTo && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'var(--tg-accent-bg)', borderLeft: '3px solid var(--tg-accent)' }}
                >
                  <span style={{ fontSize: 16 }}>↩</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xxs font-semibold" style={{ color: 'var(--tg-accent)' }}>
                      Ответ {replyTo.senderRole === 'BUYER' ? 'себе' : 'продавцу'}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--tg-text-secondary)' }}>
                      {replyTo.text || '📷 Фото'}
                    </p>
                  </div>
                  <button
                    onClick={() => setReplyTo(null)}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--tg-border-soft)', color: 'var(--tg-text-secondary)', fontSize: 12 }}
                    aria-label={t('chat.cancelReply')}
                  >
                    ✕
                  </button>
                </div>
              )}
              {/* Edit banner */}
              {editingId && (
                <div
                  className="flex items-center gap-2 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(34,211,238,0.12)', borderLeft: '3px solid rgba(34,211,238,0.70)' }}
                >
                  <span style={{ fontSize: 16 }}>✎</span>
                  <p className="flex-1 text-xs" style={{ color: '#22D3EE' }}>{t('chat.editing')}</p>
                  <button
                    onClick={() => { setEditingId(null); setEditText(''); }}
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--tg-border-soft)', color: 'var(--tg-text-secondary)', fontSize: 12 }}
                    aria-label={t('chat.cancelEdit')}
                  >
                    ✕
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                {/* Photo upload */}
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
                      aria-label={t('chat.attachPhoto')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: 'var(--tg-surface-hover)',
                        border: '1px solid var(--tg-border)',
                        color: 'var(--tg-text-secondary)',
                        fontSize: 18,
                        cursor: uploadingPhoto ? 'wait' : 'pointer',
                        opacity: uploadingPhoto ? 0.5 : 1,
                      }}
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
                  placeholder={editingId ? t('chat.editPlaceholder') : t('chat.placeholder')}
                  style={{
                    flex: 1,
                    background: 'var(--tg-surface-hover)',
                    border: '1px solid var(--tg-border)',
                    borderRadius: 12,
                    color: '#fff',
                    fontSize: 14,
                    padding: '10px 14px',
                    outline: 'none',
                  }}
                />
                <button
                  onClick={() => { if (!editingId) emitTyping(false); (editingId ? submitEdit : sendMsg)(); }}
                  disabled={editingId ? !editText.trim() : (!text.trim() || sending)}
                  aria-label={editingId ? 'Сохранить' : 'Отправить сообщение'}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    background: 'var(--tg-accent)',
                    border: '1px solid var(--tg-accent-border)',
                    color: '#fff',
                    fontSize: 18,
                    cursor: 'pointer',
                    opacity: (editingId ? editText.trim() : (text.trim() && !sending)) ? 1 : 0.4,
                    minWidth: 46,
                  }}
                >
                  {editingId ? '✓' : (sending ? <Spinner size={14} /> : '➤')}
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-2 text-center text-xs shrink-0" style={{ color: 'var(--tg-text-dim)' }}>
              Диалог закрыт продавцом — новые сообщения недоступны
            </div>
          )}

          {/* Action menu (long-press / right-click) */}
          {actionTarget && (
            <div
              className="fixed inset-0 z-50 flex items-end"
              style={{ background: 'rgba(0,0,0,0.55)' }}
              onClick={() => setActionTarget(null)}
            >
              <div
                className="w-full rounded-t-2xl flex flex-col"
                style={{ background: '#1a1035', border: '1px solid var(--tg-border)', maxWidth: 600, margin: '0 auto' }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-center pt-3 pb-1">
                  <div className="w-10 h-1 rounded-full" style={{ background: 'var(--tg-text-dim)' }} />
                </div>
                <div className="flex flex-col">
                  <button
                    onClick={() => { setReplyTo(actionTarget); setActionTarget(null); }}
                    className="text-left px-5 py-3 text-sm flex items-center gap-3"
                    style={{ color: 'var(--tg-text-primary)', borderBottom: '1px solid var(--tg-border-soft)' }}
                  >
                    <span>↩</span> Ответить
                  </button>
                  {canEditMessage(actionTarget) && (
                    <button
                      onClick={() => { setEditingId(actionTarget.id); setEditText(actionTarget.text); setActionTarget(null); }}
                      className="text-left px-5 py-3 text-sm flex items-center gap-3"
                      style={{ color: 'var(--tg-text-primary)', borderBottom: '1px solid var(--tg-border-soft)' }}
                    >
                      <span>✎</span> Изменить
                    </button>
                  )}
                  {actionTarget.senderRole === 'BUYER' && (
                    <button
                      onClick={() => { deleteMsg(actionTarget.id); setActionTarget(null); }}
                      className="text-left px-5 py-3 text-sm flex items-center gap-3"
                      style={{ color: '#f87171', borderBottom: '1px solid var(--tg-border-soft)' }}
                    >
                      <span>🗑</span> Удалить
                    </button>
                  )}
                  {actionTarget.senderRole === 'SELLER' && (
                    <button
                      onClick={() => { setReportTarget(actionTarget); setActionTarget(null); }}
                      className="text-left px-5 py-3 text-sm flex items-center gap-3"
                      style={{ color: 'var(--tg-text-secondary)', borderBottom: '1px solid var(--tg-border-soft)' }}
                    >
                      <span>⚠️</span> Пожаловаться
                    </button>
                  )}
                  <button
                    onClick={() => setActionTarget(null)}
                    className="text-center px-5 py-3 text-sm font-semibold"
                    style={{ color: 'var(--tg-text-secondary)' }}
                  >
                    Отмена
                  </button>
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
      <h1 className="text-base font-bold mb-2" style={{ color: 'var(--tg-text-primary)' }}>
        Сообщения
      </h1>

      {loading && [1, 2, 3].map((i) => <ThreadRowSkeleton key={i} />)}

      {!loading && threadsError && (
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: 'var(--tg-text-secondary)', fontSize: 14 }}>{t('chat.loadError')}</p>
          <button
            onClick={loadThreads}
            className="text-xs font-semibold py-2 px-4 rounded-full"
            style={{ background: 'var(--tg-accent-dim)', border: '1px solid var(--tg-accent-border)', color: 'var(--tg-accent)' }}
          >
            ↻ Повторить
          </button>
        </div>
      )}

      {!loading && !threadsError && threads.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16">
          <span aria-hidden="true" style={{ fontSize: 40 }}>💬</span>
          <p style={{ color: 'var(--tg-text-secondary)', fontSize: 14 }}>{t('chat.noThreads')}</p>
        </div>
      )}

      {threads.map((t) => {
        const ctx = threadContext(t);
        const ac = avatarStyle(t.id);
        const unread = t.unreadCount ?? 0;
        const initial = (t.storeName ?? threadLabel(t)).charAt(0).toUpperCase();
        return (
          <div
            key={t.id}
            {...clickableA11y(() => navigate(`/buyer/chat/${t.id}`))}
            aria-label={`Чат: ${threadLabel(t)}${unread > 0 ? `, ${unread} непрочитанных` : ''}`}
            className="flex items-start gap-3 p-3.5 rounded-2xl cursor-pointer active:opacity-70 transition-all"
            style={glass}
          >
            <div
              className="relative w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: ac.bg, border: `1px solid ${ac.fg}33` }}
            >
              <span style={{ color: ac.fg, fontSize: 16, fontWeight: 700 }}>{initial}</span>
              {unread > 0 && (
                <span
                  className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center text-xxs font-bold"
                  style={{ background: 'var(--tg-accent)', color: '#fff' }}
                >
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold truncate" style={{ color: unread > 0 ? '#fff' : 'var(--tg-text-primary)' }}>
                  {threadLabel(t)}
                </p>
                {t.lastMessageAt && (
                  <span className="text-xxs shrink-0" style={{ color: 'var(--tg-text-muted)' }}>
                    {new Date(t.lastMessageAt).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                  </span>
                )}
              </div>
              {ctx && (
                <p className="text-xxs truncate" style={{ color: 'var(--tg-accent)' }}>
                  {ctx}
                </p>
              )}
              <p className="text-xs truncate" style={{ color: unread > 0 ? 'var(--tg-text-primary)' : 'var(--tg-text-secondary)', fontWeight: unread > 0 ? 500 : 400 }}>
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
            background: 'var(--tg-surface)',
            border: '1px dashed var(--tg-border-soft)',
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 56, opacity: 0.35 }}>💬</span>
          <p className="text-sm" style={{ color: 'var(--tg-text-muted)' }}>
            Выберите диалог слева
          </p>
        </div>
      </div>
    );
  }

  return <div className="flex flex-col gap-3">{threadList}</div>;
}
