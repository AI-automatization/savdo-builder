"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { UserRole } from "types";
import type { ChatThread } from "types";
import { getThreadDisplay } from "@/lib/api/chat.api";
import { useAuth } from "@/lib/auth/context";
import {
  useThreads,
  useMessages,
  useSendMessage,
  useChatSocket,
  useDeleteThread,
  useDeleteMessage,
  useEditMessage,
} from "@/hooks/use-chat";
import { ArrowLeft, MessageSquare, MoreVertical, Pencil, Send, Store, Trash2 } from "lucide-react";
import { colors } from "@/lib/styles";
import { EmojiPicker } from "@/components/emoji-picker";

const EDIT_WINDOW_MS = 15 * 60 * 1000;

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}

function ThreadItem({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  const { title, subtitle } = getThreadDisplay(thread);
  const unread = thread.unreadCount ?? 0;
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-black/5"
      style={active ? { background: colors.accentMuted } : {}}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
      >
        <MessageSquare size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: colors.textPrimary, fontWeight: unread > 0 ? 600 : 500 }}>
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: unread > 0 ? colors.textPrimary : colors.textMuted }}>
          {thread.lastMessage ?? subtitle ?? "Нет сообщений"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {thread.lastMessageAt && (
          <span className="text-[10px]" style={{ color: colors.textDim }}>
            {timeLabel(thread.lastMessageAt)}
          </span>
        )}
        {unread > 0 && (
          <span
            className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
    </button>
  );
}

function ChatView({ thread, onBack, onDeleted }: { thread: ChatThread; onBack: () => void; onDeleted: () => void }) {
  const { data, isLoading } = useMessages(thread.id);
  useChatSocket(thread.id);
  const sendMutation = useSendMessage(thread.id);
  const deleteThreadMutation = useDeleteThread();
  const deleteMessageMutation = useDeleteMessage(thread.id);
  const editMessageMutation = useEditMessage(thread.id);
  const [text, setText] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [confirmDeleteThread, setConfirmDeleteThread] = useState(false);
  const [confirmDeleteMsg, setConfirmDeleteMsg] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];
  const { title, subtitle } = getThreadDisplay(thread);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    if (!openMenuId) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [openMenuId]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText("");
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
      setEditingText("");
    } catch {
      /* keep edit mode on error */
    }
  }

  async function handleDeleteThread() {
    try {
      await deleteThreadMutation.mutateAsync(thread.id);
      setConfirmDeleteThread(false);
      onDeleted();
    } catch {
      setConfirmDeleteThread(false);
    }
  }

  async function handleDeleteMessage(msgId: string) {
    try {
      await deleteMessageMutation.mutateAsync(msgId);
      setConfirmDeleteMsg(null);
    } catch {
      setConfirmDeleteMsg(null);
    }
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surface }}>
        <button
          onClick={onBack}
          className="w-8 h-8 flex items-center justify-center rounded-xl md:hidden transition-colors hover:bg-black/5"
          style={{ background: colors.surfaceMuted, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
          aria-label="Назад"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>{title}</p>
          <p className="text-[11px] truncate" style={{ color: colors.textMuted }}>
            {subtitle ? `${subtitle} · ` : ""}
            {thread.status === "OPEN" ? "Открыт" : "Закрыт"}
          </p>
        </div>
        <button
          onClick={() => setConfirmDeleteThread(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: 'rgba(220,38,38,0.08)', color: colors.danger, border: `1px solid rgba(220,38,38,0.25)` }}
          aria-label="Удалить чат"
          title="Удалить чат"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Confirm delete message modal */}
      {confirmDeleteMsg && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div
            className="rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
          >
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Удалить сообщение?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Продавец увидит «Сообщение удалено» вместо текста.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteMsg(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteMessage(confirmDeleteMsg)}
                disabled={deleteMessageMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: colors.danger, color: '#FFFFFF' }}
              >
                {deleteMessageMutation.isPending ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete thread modal */}
      {confirmDeleteThread && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: "rgba(0,0,0,0.45)" }}>
          <div
            className="rounded-2xl p-5 max-w-xs w-full flex flex-col gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 12px 32px rgba(0,0,0,0.18)' }}
          >
            <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Удалить этот чат?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Чат исчезнет из вашего списка. Продавец продолжит видеть историю.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteThread(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteThread}
                disabled={deleteThreadMutation.isPending}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: colors.danger, color: '#FFFFFF' }}
              >
                {deleteThreadMutation.isPending ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5" style={{ background: colors.bg }}>
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className="h-9 w-48 rounded-2xl animate-pulse" style={{ background: colors.surfaceMuted }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: colors.textDim }}>Нет сообщений</p>
        )}

        {messages.map((m) => {
          const isBuyer = m.senderRole === UserRole.BUYER;
          const isEditing = editingId === m.id;
          const ageMs = Date.now() - new Date(m.createdAt).getTime();
          const canEdit = isBuyer && !m.isDeleted && ageMs < EDIT_WINDOW_MS;
          const canDelete = isBuyer && !m.isDeleted;
          const showMenu = openMenuId === m.id;

          return (
            <div key={m.id} className={`flex ${isBuyer ? "justify-end" : "justify-start"} group`}>
              {!isBuyer && (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 self-end"
                  style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
                >
                  <Store size={14} />
                </div>
              )}
              <div className={`relative max-w-[75%] flex items-end gap-1 ${isBuyer ? "flex-row-reverse" : ""}`}>
                <div
                  className="px-3.5 py-2.5 rounded-2xl text-sm"
                  style={
                    m.isDeleted
                      ? {
                          background: colors.surfaceMuted,
                          color: colors.textDim,
                          fontStyle: "italic",
                          border: `1px solid ${colors.border}`,
                          borderBottomRightRadius: isBuyer ? 4 : 16,
                          borderBottomLeftRadius: isBuyer ? 16 : 4,
                        }
                      : isBuyer
                        ? {
                            background: colors.accent,
                            color: colors.accentTextOnBg,
                            borderBottomRightRadius: 4,
                          }
                        : {
                            background: colors.surface,
                            color: colors.textPrimary,
                            border: `1px solid ${colors.border}`,
                            borderBottomLeftRadius: 4,
                          }
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
                          background: 'rgba(255,255,255,0.95)',
                          border: `1px solid rgba(255,255,255,0.5)`,
                          color: colors.textPrimary,
                        }}
                      />
                      <div className="flex gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => { setEditingId(null); setEditingText(""); }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                          style={{ background: 'rgba(255,255,255,0.18)', color: colors.accentTextOnBg }}
                        >
                          Отмена
                        </button>
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={!editingText.trim() || editMessageMutation.isPending}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold disabled:opacity-50"
                          style={{ background: '#FFFFFF', color: colors.accent }}
                        >
                          {editMessageMutation.isPending ? "..." : "Сохранить"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p style={{ whiteSpace: "pre-wrap" }}>{m.text}</p>
                  )}
                  {!m.isDeleted && !isEditing && (
                    <p
                      className="text-[10px] mt-0.5 text-right"
                      style={{ color: isBuyer ? 'rgba(255,255,255,0.70)' : colors.textDim }}
                    >
                      {m.editedAt && <span className="mr-1">изменено · </span>}
                      {timeLabel(m.createdAt)}
                    </p>
                  )}
                </div>

                {(canEdit || canDelete) && !isEditing && (
                  <div className="relative" ref={showMenu ? menuRef : undefined}>
                    <button
                      type="button"
                      onClick={() => setOpenMenuId(showMenu ? null : m.id)}
                      className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity opacity-60 hover:opacity-100 focus:opacity-100 active:opacity-100"
                      style={{ background: colors.surface, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
                      aria-label="Действия с сообщением"
                    >
                      <MoreVertical size={13} />
                    </button>
                    {showMenu && (
                      <div
                        className={`absolute z-10 top-full mt-1 ${isBuyer ? "right-0" : "left-0"} rounded-xl overflow-hidden min-w-[140px]`}
                        style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: '0 8px 24px rgba(0,0,0,0.15)' }}
                      >
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => startEdit(m.id, m.text)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-black/5"
                            style={{ color: colors.textPrimary }}
                          >
                            <Pencil size={12} /> Редактировать
                          </button>
                        )}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => { setConfirmDeleteMsg(m.id); setOpenMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-colors hover:bg-black/5"
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
      {thread.status === "OPEN" && (
        <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ borderTop: `1px solid ${colors.divider}`, background: colors.surface }}>
          <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 h-10 px-3.5 rounded-xl text-sm outline-none focus:ring-2"
            style={{
              background: colors.surfaceMuted,
              border: `1px solid ${colors.border}`,
              color: colors.textPrimary,
              ['--tw-ring-color' as string]: colors.accentBorder,
            }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity hover:opacity-90"
            style={{ background: colors.accent, color: colors.accentTextOnBg }}
            aria-label="Отправить"
          >
            <Send size={16} />
          </button>
        </div>
      )}
      {thread.status === "CLOSED" && (
        <div
          className="px-4 py-3 text-center text-xs flex-shrink-0"
          style={{ color: colors.textDim, borderTop: `1px solid ${colors.divider}`, background: colors.surface }}
        >
          Чат закрыт продавцом
        </div>
      )}
    </div>
  );
}

function ChatsView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: threads, isLoading, isError } = useThreads();
  const activeThread = threads?.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId && threads && threads.length > 0) setActiveId(threads[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  return (
    <div
      className="flex h-[calc(100vh-9rem)] md:h-[calc(100vh-7rem)] rounded-2xl overflow-hidden"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* Thread list */}
      <div
        className={`${activeThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 flex-shrink-0`}
        style={{ borderRight: `1px solid ${colors.divider}` }}
      >
        <div className="px-4 py-3.5 flex-shrink-0" style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <p className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Чаты с продавцами</p>
        </div>
        <div className="flex-1 overflow-y-auto" style={{ background: colors.surface }}>
          {isLoading && (
            <div className="flex flex-col">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-10 h-10 rounded-full animate-pulse flex-shrink-0" style={{ background: colors.surfaceMuted }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 w-28 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
                    <div className="h-2.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {isError && <p className="px-4 py-6 text-xs text-center" style={{ color: colors.danger }}>Ошибка загрузки</p>}
          {!isLoading && !isError && threads?.length === 0 && (
            <div className="px-4 py-10 text-center flex flex-col items-center gap-3">
              <MessageSquare size={28} style={{ color: colors.textDim }} />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Чатов пока нет</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: colors.textMuted }}>
                  Откройте магазин или заказ и нажмите кнопку чата
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold mt-1 transition-opacity hover:opacity-90"
                style={{ background: colors.accent, color: colors.accentTextOnBg }}
              >
                <Store size={14} /> Перейти к магазинам
              </Link>
            </div>
          )}
          {threads?.map((thread) => (
            <ThreadItem key={thread.id} thread={thread} active={thread.id === activeId} onClick={() => setActiveId(thread.id)} />
          ))}
        </div>
      </div>

      {/* Chat view */}
      {activeThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatView thread={activeThread} onBack={() => setActiveId(null)} onDeleted={() => setActiveId(null)} />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8" style={{ background: colors.surfaceMuted }}>
          <div className="text-center max-w-sm">
            <MessageSquare size={32} style={{ color: colors.textDim, margin: '0 auto 10px' }} />
            {threads && threads.length === 0 ? (
              <>
                <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Здесь появятся ваши диалоги</p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: colors.textMuted }}>
                  Зайдите в любой магазин, откройте товар и нажмите фиолетовую кнопку чата.
                </p>
              </>
            ) : (
              <p className="text-sm" style={{ color: colors.textMuted }}>Выберите чат</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function ChatsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textPrimary }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-12">
        <h1 className="text-xl sm:text-2xl font-bold mb-5" style={{ color: colors.textPrimary }}>Чаты</h1>
        {isAuthenticated ? <ChatsView /> : (
          <OtpGate
            icon={<MessageSquare size={22} />}
            title="Войдите для доступа к чатам"
          />
        )}
      </div>

      <BottomNavBar active="chats" />
    </div>
  );
}
