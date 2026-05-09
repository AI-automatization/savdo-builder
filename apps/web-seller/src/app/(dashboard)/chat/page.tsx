'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { UserRole } from 'types';
import type { ChatThread } from 'types';
import { getThreadDisplay } from '@/lib/api/chat.api';
import { ArrowLeft, MessageSquare, MoreVertical, Pencil, Trash2, User as UserIcon } from 'lucide-react';
import {
  useThreads,
  useMessages,
  useSendMessage,
  useResolveThread,
  useChatSocket,
  useDeleteThread,
  useDeleteMessage,
  useEditMessage,
} from '@/hooks/use-chat';
import { card, cardMuted, colors, inputStyle } from '@/lib/styles';
import { EmojiPicker } from '@/components/emoji-picker';

const EDIT_WINDOW_MS = 15 * 60 * 1000;

const glass = card;
const glassDim = cardMuted;

// ── Helpers ────────────────────────────────────────────────────────────────

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'вчера';
  return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// ── Thread List ────────────────────────────────────────────────────────────

function ThreadItem({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  const { title, subtitle } = getThreadDisplay(thread);
  const unread = thread.unreadCount ?? 0;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-surface-muted)]"
      style={active ? { background: colors.accentMuted } : {}}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: colors.accentMuted, color: colors.accent }}
      >
        <UserIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary, ...(unread > 0 ? { fontWeight: 600 } : null) }}>
          {title}
        </p>
        <p className="text-xs truncate" style={{ color: unread > 0 ? colors.textPrimary : colors.textDim }}>
          {thread.lastMessage ?? subtitle ?? 'Нет сообщений'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {thread.lastMessageAt && (
          <span className="text-[10px]" style={{ color: colors.textDim }}>
            {timeLabel(thread.lastMessageAt)}
          </span>
        )}
        {unread > 0 && (
          <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        {unread === 0 && thread.status === 'CLOSED' && (
          <span className="text-[10px]" style={{ color: colors.success }}>закрыт</span>
        )}
      </div>
    </button>
  );
}

// ── Chat Window ────────────────────────────────────────────────────────────

function ChatWindow({ thread, onDeleted, onBack }: { thread: ChatThread; onDeleted: () => void; onBack: () => void }) {
  const { data, isLoading } = useMessages(thread.id);
  useChatSocket(thread.id);
  const sendMutation = useSendMessage(thread.id);
  const resolveMutation = useResolveThread();
  const deleteThreadMutation = useDeleteThread();
  const deleteMessageMutation = useDeleteMessage(thread.id);
  const editMessageMutation = useEditMessage(thread.id);
  const [text, setText] = useState('');
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [confirmDeleteThread, setConfirmDeleteThread] = useState(false);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { title, subtitle } = getThreadDisplay(thread);

  const messages = useMemo(() => {
    const raw = data?.messages ?? [];
    return [...raw].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [data?.messages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  // Close action menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [openMenuId]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText('');
    await sendMutation.mutateAsync({ text: trimmed });
  }

  function startEdit(msgId: string, currentText: string) {
    setEditingId(msgId);
    setEditingText(currentText);
    setOpenMenuId(null);
  }

  async function saveEdit() {
    const trimmed = editingText.trim();
    if (!editingId || !trimmed) return;
    try {
      await editMessageMutation.mutateAsync({ msgId: editingId, text: trimmed });
      setEditingId(null);
      setEditingText('');
    } catch {
      /* swallow — UI stays in edit mode so user can retry */
    }
  }

  async function handleDeleteThread() {
    try {
      await deleteThreadMutation.mutateAsync(thread.id);
      setConfirmDeleteThread(false);
      onDeleted();
    } catch {
      // keep modal open so error message is visible
    }
  }

  async function handleDeleteMessage(msgId: string) {
    try {
      await deleteMessageMutation.mutateAsync(msgId);
      setConfirmDeleteMsg(null);
    } catch {
      // keep modal open so error message is visible
    }
  }

  function errorText(err: unknown, fallback: string): string {
    if (!err) return fallback;
    type ApiError = { response?: { data?: { message?: string; code?: string } }; message?: string };
    const e = err as ApiError;
    return e?.response?.data?.message ?? e?.message ?? fallback;
  }

  return (
    <div className="relative flex-1 rounded-2xl flex flex-col overflow-hidden" style={glass}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 md:px-5 py-3.5 gap-2 md:gap-3" style={{ borderBottom: `1px solid ${colors.divider}` }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={onBack}
            className="md:hidden w-8 h-8 -ml-1 flex items-center justify-center rounded-lg flex-shrink-0 transition-opacity hover:opacity-80"
            style={{ color: colors.textPrimary }}
            aria-label="Назад к списку"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors.accentMuted, color: colors.accent }}>
            <UserIcon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{title}</p>
            <p className="text-[11px] truncate" style={{ color: colors.textDim }}>
              {subtitle ?? (thread.threadType === 'ORDER' ? 'Заказ' : 'Товар')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {thread.status === 'OPEN' && (
            <button
              onClick={() => resolveMutation.mutate(thread.id)}
              disabled={resolveMutation.isPending}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold disabled:opacity-40 transition-opacity"
              style={{ background: 'rgba(52,211,153,0.13)', color: colors.success, border: '1px solid rgba(52,211,153,0.25)' }}
            >
              {resolveMutation.isPending ? '...' : 'Закрыть чат'}
            </button>
          )}
          <button
            onClick={() => setConfirmDeleteThread(true)}
            className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(248,113,113,0.10)', color: colors.danger, border: '1px solid rgba(248,113,113,0.18)' }}
            aria-label="Удалить чат"
            title="Удалить чат"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Confirm delete message modal */}
      {confirmDeleteMsg && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3" style={glass}>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Удалить сообщение?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Покупатель увидит «Сообщение удалено» вместо текста.
            </p>
            {deleteMessageMutation.isError && (
              <p className="text-xs" style={{ color: colors.danger }}>
                {errorText(deleteMessageMutation.error, 'Не удалось удалить сообщение')}
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteMsg(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteMessage(confirmDeleteMsg)}
                disabled={deleteMessageMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.18)', color: colors.danger }}
              >
                {deleteMessageMutation.isPending ? '...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete thread modal */}
      {confirmDeleteThread && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: 'rgba(0,0,0,0.55)' }}>
          <div className="rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3" style={glass}>
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Удалить этот чат?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Чат исчезнет из вашего списка. Покупатель продолжит видеть историю.
            </p>
            {deleteThreadMutation.isError && (
              <p className="text-xs" style={{ color: colors.danger }}>
                {errorText(deleteThreadMutation.error, 'Не удалось удалить чат')}
              </p>
            )}
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteThread(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteThread}
                disabled={deleteThreadMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: 'rgba(248,113,113,0.18)', color: colors.danger }}
              >
                {deleteThreadMutation.isPending ? '...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
        {isLoading && (
          <>
            {[1, 2, 3].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className="h-9 w-48 rounded-2xl animate-pulse" style={{ background: colors.surfaceElevated }} />
              </div>
            ))}
          </>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: colors.textDim }}>
            Нет сообщений
          </p>
        )}

        {messages.map((m) => {
          const isSeller = m.senderRole === UserRole.SELLER;
          const isEditing = editingId === m.id;
          const ageMs = Date.now() - new Date(m.createdAt).getTime();
          const canEdit = isSeller && !m.isDeleted && ageMs < EDIT_WINDOW_MS;
          const canDelete = isSeller && !m.isDeleted;
          const showMenu = openMenuId === m.id;

          return (
            <div key={m.id} className={`flex ${isSeller ? 'justify-end' : 'justify-start'} group`}>
              <div className={`relative max-w-[70%] flex items-end gap-1 ${isSeller ? 'flex-row-reverse' : ''}`}>
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-sm"
                  style={
                    m.isDeleted
                      ? { background: colors.surfaceMuted, color: colors.textDim, fontStyle: 'italic', borderBottomRightRadius: isSeller ? 4 : 16, borderBottomLeftRadius: isSeller ? 16 : 4 }
                      : isSeller
                        ? { background: colors.accent, color: colors.accentTextOnBg, borderBottomRightRadius: 4 }
                        : { ...glassDim, color: colors.textPrimary, borderBottomLeftRadius: 4 }
                  }
                >
                  {m.isDeleted ? (
                    <p>Сообщение удалено</p>
                  ) : isEditing ? (
                    <div className="flex flex-col gap-2 min-w-[180px]">
                      <textarea
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        rows={2}
                        autoFocus
                        className="w-full rounded-lg p-2 text-sm outline-none resize-none"
                        style={{
                          background: `color-mix(in srgb, ${colors.accentTextOnBg} 18%, transparent)`,
                          color: colors.accentTextOnBg,
                          border: `1px solid color-mix(in srgb, ${colors.accentTextOnBg} 32%, transparent)`,
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditingText(''); }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                          style={{
                            background: `color-mix(in srgb, ${colors.accentTextOnBg} 16%, transparent)`,
                            color: colors.accentTextOnBg,
                          }}
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={!editingText.trim() || editMessageMutation.isPending}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold disabled:opacity-50"
                          style={{ background: colors.accentTextOnBg, color: colors.accent }}
                        >
                          {editMessageMutation.isPending ? '...' : 'Сохранить'}
                        </button>
                      </div>
                      {editingId === m.id && editMessageMutation.isError && (
                        <p className="text-[10px] mt-0.5" style={{ color: colors.accentTextOnBg, opacity: 0.85 }}>
                          {errorText(editMessageMutation.error, 'Не удалось сохранить')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p style={{ whiteSpace: 'pre-wrap' }}>{m.text}</p>
                  )}
                  {!m.isDeleted && !isEditing && (
                    <p className="text-[10px] mt-1 text-right" style={{ color: isSeller ? `color-mix(in srgb, ${colors.accentTextOnBg} 65%, transparent)` : colors.textDim }}>
                      {m.editedAt && <span className="mr-1">изменено · </span>}
                      {timeLabel(m.createdAt)}
                    </p>
                  )}
                </div>

                {/* Action menu trigger — only on own non-deleted, non-editing messages */}
                {(canEdit || canDelete) && !isEditing && (
                  <div className="relative" ref={showMenu ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(showMenu ? null : m.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity opacity-60 hover:opacity-100 focus:opacity-100 active:opacity-100"
                      style={{ background: colors.surfaceMuted, color: colors.textPrimary }}
                      aria-label="Действия с сообщением"
                    >
                      <MoreVertical size={13} />
                    </button>
                    {showMenu && (
                      <div
                        className={`absolute z-10 top-full mt-1 ${isSeller ? 'right-0' : 'left-0'} rounded-xl overflow-hidden min-w-[140px]`}
                        style={{ ...glass, boxShadow: '0 8px 24px rgba(0,0,0,0.35)' }}
                      >
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => startEdit(m.id, m.text)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--color-surface-muted)]"
                            style={{ color: colors.textPrimary }}
                          >
                            <Pencil size={12} /> Редактировать
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => { setConfirmDeleteMsg(m.id); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-[var(--color-surface-muted)]"
                            style={{ color: colors.danger }}
                          >
                            <Trash2 size={12} /> Удалить
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-3" style={{ borderTop: `1px solid ${colors.divider}` }}>
        <div style={{ opacity: thread.status === 'CLOSED' ? 0.4 : 1, pointerEvents: thread.status === 'CLOSED' ? 'none' : 'auto' }}>
          <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />
        </div>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={thread.status === 'CLOSED' ? 'Чат закрыт' : 'Написать сообщение...'}
          disabled={thread.status === 'CLOSED'}
          className="flex-1 h-10 px-4 rounded-xl text-sm outline-none disabled:opacity-40 placeholder:opacity-50"
          style={inputStyle}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending || thread.status === 'CLOSED'}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: colors.accent }}
          aria-label="Отправить"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────

function EmptyState({ noThreads }: { noThreads: boolean }) {
  return (
    <div className="flex-1 rounded-2xl flex items-center justify-center p-8" style={glassDim}>
      <div className="text-center max-w-sm">
        <MessageSquare size={32} style={{ color: colors.textDim, margin: '0 auto 10px' }} />
        {noThreads ? (
          <>
            <p className="text-sm font-medium" style={{ color: colors.textMuted }}>Здесь появятся диалоги с покупателями</p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: colors.textDim }}>
              Продавец не может начать чат первым. Покупатель напишет вам со страницы товара или заказа — диалог сразу появится в списке слева.
            </p>
          </>
        ) : (
          <p className="text-sm" style={{ color: colors.textDim }}>Выберите чат</p>
        )}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ChatPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: threads, isLoading, isError } = useThreads();

  const activeThread = threads?.find((t) => t.id === activeId) ?? null;

  // Auto-select first thread on desktop only — on mobile the thread list
  // is the entry point and user picks one to enter the chat view.
  useEffect(() => {
    if (!activeId && threads && threads.length > 0) {
      if (typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches) {
        setActiveId(threads[0].id);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  return (
    <div className="flex flex-col md:flex-row md:gap-5 h-[calc(100vh-9rem)] md:h-[calc(100vh-10rem)]">

      {/* Thread list — full-width on mobile when no active thread; fixed-width sidebar on desktop */}
      <div
        className={`${activeThread ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-72 flex-shrink-0 rounded-2xl overflow-hidden`}
        style={glass}
      >
        <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Чаты</p>
        </div>
        <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: colors.divider }}>
          {isLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-9 h-9 rounded-full animate-pulse flex-shrink-0" style={{ background: colors.surfaceElevated }} />
                  <div className="flex-1 flex flex-col gap-1.5">
                    <div className="h-3 w-28 rounded-full animate-pulse" style={{ background: colors.surfaceElevated }} />
                    <div className="h-2.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
                  </div>
                </div>
              ))}
            </>
          )}

          {isError && (
            <p className="px-4 py-6 text-xs text-center" style={{ color: colors.danger }}>
              Не удалось загрузить чаты
            </p>
          )}

          {!isLoading && !isError && threads?.length === 0 && (
            <div className="px-4 py-8 text-center flex flex-col items-center gap-3">
              <MessageSquare size={28} style={{ color: colors.textDim }} />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textMuted }}>Чатов пока нет</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: colors.textDim }}>
                  Покупатели первыми пишут вам<br />со страницы товара или заказа
                </p>
              </div>
            </div>
          )}

          {threads?.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              active={thread.id === activeId}
              onClick={() => setActiveId(thread.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat window or empty — full-width on mobile when active thread, always visible on desktop */}
      <div className={`${activeThread ? 'flex' : 'hidden md:flex'} flex-1 min-h-0`}>
        {activeThread ? (
          <ChatWindow thread={activeThread} onDeleted={() => setActiveId(null)} onBack={() => setActiveId(null)} />
        ) : (
          <EmptyState noThreads={!threads || threads.length === 0} />
        )}
      </div>
    </div>
  );
}
