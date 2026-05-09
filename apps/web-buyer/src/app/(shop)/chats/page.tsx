"use client";

import { useState, useRef, useEffect, useMemo, Fragment } from "react";
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
import { MessageSquare, MoreVertical, Pencil, Search, Send, Store, Trash2 } from "lucide-react";
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

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return "Сегодня";
  if (diffDays === 1) return "Вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}

function sameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate();
}

function ThreadItem({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  const { title } = getThreadDisplay(thread);
  const unread = thread.unreadCount ?? 0;
  const storeBrand = colors.brand;
  const initial = (thread.storeName ?? title ?? "?").charAt(0).toUpperCase();

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex gap-3 px-4 py-3 border-b transition"
      style={{
        background: active ? colors.brandMuted : unread > 0 ? colors.brandMuted : "transparent",
        borderColor: colors.divider,
      }}
    >
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center font-bold flex-shrink-0 text-sm"
        style={{ background: storeBrand, color: colors.brandTextOnBg }}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-baseline">
          <div
            className="text-[13px] truncate"
            style={{ color: colors.textStrong, fontWeight: unread > 0 ? 700 : 500 }}
          >
            {thread.storeName ?? title ?? "Магазин"}
          </div>
          {thread.lastMessageAt && (
            <div className="text-[10px] flex-shrink-0 ml-2" style={{ color: colors.textMuted }}>
              {timeLabel(thread.lastMessageAt)}
            </div>
          )}
        </div>
        <div className="flex justify-between items-center mt-0.5">
          <div
            className="text-xs truncate"
            style={{
              color: unread > 0 ? colors.textBody : colors.textMuted,
              fontWeight: unread > 0 ? 600 : 400,
            }}
          >
            {thread.lastMessage ?? "Нет сообщений"}
          </div>
          {unread > 0 && (
            <div
              className="ml-2 min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center flex-shrink-0"
              style={{ background: storeBrand, color: colors.brandTextOnBg }}
            >
              {unread > 9 ? "9+" : unread}
            </div>
          )}
        </div>
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
  const messages = useMemo(() => {
    const raw = data?.messages ?? [];
    return [...raw].sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
  }, [data?.messages]);
  const { title } = getThreadDisplay(thread);
  const storeName = thread.storeName ?? title ?? "Магазин";
  const storeBrand = colors.brand;
  const storeInitial = storeName.charAt(0).toUpperCase();

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
    try {
      await sendMutation.mutateAsync({ text: trimmed });
    } catch {
      // Restore text so the user can retry — clearing on error loses their message.
      setText(trimmed);
    }
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
      {/* Thread header */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0 border-b"
        style={{ background: colors.surface, borderColor: colors.divider }}
      >
        <button
          onClick={onBack}
          className="md:hidden text-lg flex-shrink-0 transition-opacity hover:opacity-70"
          style={{ color: colors.textBody, background: "transparent", border: "none" }}
          aria-label="Назад"
        >
          ←
        </button>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0"
          style={{ background: storeBrand, color: colors.brandTextOnBg }}
        >
          {storeInitial}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-bold truncate" style={{ color: colors.textStrong }}>
            {storeName}
          </div>
          <div className="text-[10px] truncate" style={{ color: colors.textMuted }}>
            {thread.status === "OPEN" ? "Открыт" : "Закрыт"}
          </div>
        </div>
        <button
          onClick={() => setConfirmDeleteThread(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-opacity hover:opacity-80 flex-shrink-0"
          style={{ background: "rgba(220,38,38,0.08)", color: colors.danger, border: "1px solid rgba(220,38,38,0.25)" }}
          aria-label="Удалить чат"
          title="Удалить чат"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Confirm delete message modal */}
      {confirmDeleteMsg && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: "rgba(15,17,21,0.5)" }}>
          <div
            className="rounded-lg p-5 max-w-xs w-full flex flex-col gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <p className="text-sm font-semibold" style={{ color: colors.textStrong }}>Удалить сообщение?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Продавец увидит «Сообщение удалено» вместо текста.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteMsg(null)}
                className="flex-1 py-2.5 rounded-md text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textBody, border: `1px solid ${colors.border}` }}
              >
                Отмена
              </button>
              <button
                onClick={() => handleDeleteMessage(confirmDeleteMsg)}
                disabled={deleteMessageMutation.isPending}
                className="flex-1 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ background: colors.danger, color: colors.brandTextOnBg }}
              >
                {deleteMessageMutation.isPending ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete thread modal */}
      {confirmDeleteThread && (
        <div className="absolute inset-0 z-20 flex items-center justify-center p-6" style={{ background: "rgba(15,17,21,0.5)" }}>
          <div
            className="rounded-lg p-5 max-w-xs w-full flex flex-col gap-3"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <p className="text-sm font-semibold" style={{ color: colors.textStrong }}>Удалить этот чат?</p>
            <p className="text-xs" style={{ color: colors.textMuted }}>
              Чат исчезнет из вашего списка. Продавец продолжит видеть историю.
            </p>
            <div className="flex gap-2 mt-1">
              <button
                onClick={() => setConfirmDeleteThread(false)}
                className="flex-1 py-2.5 rounded-md text-sm font-medium"
                style={{ background: colors.surfaceMuted, color: colors.textBody, border: `1px solid ${colors.border}` }}
              >
                Отмена
              </button>
              <button
                onClick={handleDeleteThread}
                disabled={deleteThreadMutation.isPending}
                className="flex-1 py-2.5 rounded-md text-sm font-semibold disabled:opacity-50"
                style={{ background: colors.danger, color: colors.brandTextOnBg }}
              >
                {deleteThreadMutation.isPending ? "..." : "Удалить"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto px-4 py-3.5 flex flex-col gap-2"
        style={{ background: colors.bg }}
      >
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className="h-9 w-48 animate-pulse" style={{ background: colors.surfaceMuted, borderRadius: 14 }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: colors.textMuted }}>Нет сообщений</p>
        )}

        {messages.map((m, i) => {
          const isBuyer = m.senderRole === UserRole.BUYER;
          const isEditing = editingId === m.id;
          const ageMs = Date.now() - new Date(m.createdAt).getTime();
          const canEdit = isBuyer && !m.isDeleted && ageMs < EDIT_WINDOW_MS;
          const canDelete = isBuyer && !m.isDeleted;
          const showMenu = openMenuId === m.id;
          const isFirstOfDay = i === 0 || !sameDay(messages[i - 1].createdAt, m.createdAt);

          return (
            <Fragment key={m.id}>
              {isFirstOfDay && (
                <div className="text-center text-[10px] my-1" style={{ color: colors.textMuted }}>
                  {formatDateLabel(m.createdAt)}
                </div>
              )}
              <div className={`flex ${isBuyer ? "justify-end" : "justify-start"} group`}>
                {!isBuyer && (
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2 self-end font-bold text-xs"
                    style={{ background: storeBrand, color: colors.brandTextOnBg }}
                  >
                    {storeInitial}
                  </div>
                )}
                <div className={`relative max-w-[75%] flex items-end gap-1 ${isBuyer ? "flex-row-reverse" : ""}`}>
                  <div
                    className="px-3 py-2 text-[13px] leading-snug"
                    style={
                      m.isDeleted
                        ? {
                            background: colors.surfaceMuted,
                            color: colors.textMuted,
                            fontStyle: "italic",
                            border: `1px solid ${colors.border}`,
                            borderRadius: "14px 14px 14px 4px",
                          }
                        : isBuyer
                          ? {
                              background: colors.brand,
                              color: colors.brandTextOnBg,
                              borderRadius: "14px 14px 4px 14px",
                            }
                          : {
                              background: colors.surface,
                              color: colors.textStrong,
                              border: `1px solid ${colors.divider}`,
                              borderRadius: "14px 14px 14px 4px",
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
                          className="w-full rounded-md p-2 text-sm outline-none resize-none"
                          style={{
                            background: colors.brandTextOnBg,
                            border: `1px solid ${colors.brandHover}`,
                            color: colors.textStrong,
                          }}
                        />
                        <div className="flex gap-2 justify-end">
                          <button
                            type="button"
                            onClick={() => { setEditingId(null); setEditingText(""); }}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold"
                            style={{ background: "transparent", border: `1px solid ${colors.brandTextOnBg}`, color: colors.brandTextOnBg }}
                          >
                            Отмена
                          </button>
                          <button
                            type="button"
                            onClick={saveEdit}
                            disabled={!editingText.trim() || editMessageMutation.isPending}
                            className="px-2.5 py-1 rounded-md text-[11px] font-semibold disabled:opacity-50"
                            style={{ background: colors.brandTextOnBg, color: colors.brand }}
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
                        className="text-[9px] mt-1"
                        style={{
                          color: isBuyer ? "rgba(251,247,240,0.7)" : colors.textMuted,
                          textAlign: isBuyer ? "right" : "left",
                        }}
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
                        className="w-7 h-7 rounded-full flex items-center justify-center transition-opacity opacity-60 hover:opacity-100 focus:opacity-100"
                        style={{ background: colors.surface, color: colors.textStrong, border: `1px solid ${colors.border}` }}
                        aria-label="Действия с сообщением"
                      >
                        <MoreVertical size={13} />
                      </button>
                      {showMenu && (
                        <div
                          className={`absolute z-10 top-full mt-1 ${isBuyer ? "right-0" : "left-0"} rounded-md overflow-hidden min-w-[140px]`}
                          style={{ background: colors.surface, border: `1px solid ${colors.border}`, boxShadow: "0 4px 12px rgba(31,26,18,0.08)" }}
                        >
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => startEdit(m.id, m.text)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover-soft"
                              style={{ color: colors.textStrong }}
                            >
                              <Pencil size={12} /> Редактировать
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => { setConfirmDeleteMsg(m.id); setOpenMenuId(null); }}
                              className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left hover-soft"
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
            </Fragment>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      {thread.status === "OPEN" && (
        <div
          className="sticky bottom-0 flex items-center gap-2 p-2.5 border-t flex-shrink-0"
          style={{ background: colors.surface, borderColor: colors.divider }}
        >
          <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Сообщение..."
            className="flex-1 px-3 py-2.5 rounded-full text-xs outline-none"
            style={{ background: colors.surfaceMuted, color: colors.textBody }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sendMutation.isPending}
            className="w-9 h-9 rounded-full flex items-center justify-center text-base disabled:opacity-50 flex-shrink-0 transition-opacity hover:opacity-90"
            style={{ background: colors.brand, color: colors.brandTextOnBg, border: "none" }}
            aria-label="Отправить"
          >
            <Send size={15} />
          </button>
        </div>
      )}
      {thread.status === "CLOSED" && (
        <div
          className="px-4 py-3 text-center text-xs flex-shrink-0 border-t"
          style={{ color: colors.textMuted, borderColor: colors.divider, background: colors.surface }}
        >
          Чат закрыт продавцом
        </div>
      )}
    </div>
  );
}

function ChatsView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const { data: threads, isLoading, isError } = useThreads();
  const activeThread = threads?.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId && threads && threads.length > 0) setActiveId(threads[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  const filteredThreads = useMemo(() => {
    let list = threads ?? [];
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      list = list.filter(
        (t) =>
          (t.storeName ?? "").toLowerCase().includes(q) ||
          (t.lastMessage ?? "").toLowerCase().includes(q)
      );
    }
    if (filter === "unread") {
      list = list.filter((t) => (t.unreadCount ?? 0) > 0);
    }
    return list;
  }, [threads, searchQuery, filter]);

  const unreadCount = useMemo(
    () => (threads ?? []).filter((t) => (t.unreadCount ?? 0) > 0).length,
    [threads]
  );

  return (
    <div
      className="flex h-[calc(100vh-9rem)] md:h-[calc(100vh-7rem)] rounded-lg overflow-hidden"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      {/* Thread list panel */}
      <div
        className={`${activeThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 flex-shrink-0`}
        style={{ borderRight: `1px solid ${colors.divider}` }}
      >
        {/* Header */}
        <div className="px-4 py-3.5 flex-shrink-0 border-b" style={{ borderColor: colors.divider }}>
          <h1 className="text-2xl font-bold tracking-tight" style={{ color: colors.textStrong }}>Чаты</h1>
        </div>

        {/* Search */}
        <div className="px-4 py-2.5 flex-shrink-0">
          <div
            className="flex items-center gap-2 px-3 py-2.5 rounded-md"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <Search size={14} style={{ color: colors.textMuted }} />
            <input
              type="text"
              placeholder="Поиск магазинов"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-xs"
              style={{ color: colors.textBody }}
            />
          </div>
        </div>

        {/* Filter chips */}
        <div className="px-4 pb-2 flex gap-1.5 flex-shrink-0">
          <button
            onClick={() => setFilter("all")}
            className="px-3 py-1.5 text-[11px] font-semibold rounded transition"
            style={
              filter === "all"
                ? { background: colors.textStrong, color: colors.brandTextOnBg }
                : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
            }
          >
            Все · {threads?.length ?? 0}
          </button>
          <button
            onClick={() => setFilter("unread")}
            className="px-3 py-1.5 text-[11px] font-semibold rounded transition"
            style={
              filter === "unread"
                ? { background: colors.textStrong, color: colors.brandTextOnBg }
                : { background: colors.surface, color: colors.textBody, border: `1px solid ${colors.border}` }
            }
          >
            Непрочитанные · {unreadCount}
          </button>
        </div>

        {/* Thread list */}
        <div className="flex-1 overflow-y-auto" style={{ background: colors.surface }}>
          {isLoading && (
            <div className="flex flex-col">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor: colors.divider }}>
                  <div className="w-11 h-11 rounded-full animate-pulse flex-shrink-0" style={{ background: colors.surfaceMuted }} />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 w-28 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
                    <div className="h-2.5 w-36 rounded-full animate-pulse" style={{ background: colors.surfaceMuted }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {isError && (
            <p className="px-4 py-6 text-xs text-center" style={{ color: colors.danger }}>
              Ошибка загрузки
            </p>
          )}
          {!isLoading && !isError && (threads?.length ?? 0) === 0 && (
            <div className="px-4 py-10 text-center flex flex-col items-center gap-3">
              <MessageSquare size={28} style={{ color: colors.textMuted }} />
              <div>
                <p className="text-sm font-medium" style={{ color: colors.textStrong }}>Чатов пока нет</p>
                <p className="text-xs mt-1.5 leading-relaxed" style={{ color: colors.textMuted }}>
                  Откройте магазин или заказ и нажмите кнопку чата
                </p>
              </div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold mt-1 transition-opacity hover:opacity-90"
                style={{ background: colors.brand, color: colors.brandTextOnBg }}
              >
                <Store size={14} /> Перейти к магазинам
              </Link>
            </div>
          )}
          {!isLoading && !isError && (threads?.length ?? 0) > 0 && filteredThreads.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="text-sm" style={{ color: colors.textMuted }}>Нет совпадений</p>
            </div>
          )}
          {filteredThreads.map((thread) => (
            <ThreadItem
              key={thread.id}
              thread={thread}
              active={thread.id === activeId}
              onClick={() => setActiveId(thread.id)}
            />
          ))}
        </div>
      </div>

      {/* Chat thread panel */}
      {activeThread ? (
        <div className="flex-1 flex flex-col min-w-0">
          <ChatView
            thread={activeThread}
            onBack={() => setActiveId(null)}
            onDeleted={() => setActiveId(null)}
          />
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center p-8" style={{ background: colors.surfaceMuted }}>
          <div className="text-center max-w-sm">
            <MessageSquare size={32} style={{ color: colors.textMuted, margin: "0 auto 10px" }} />
            {threads && threads.length === 0 ? (
              <>
                <p className="text-sm font-medium" style={{ color: colors.textStrong }}>Здесь появятся ваши диалоги</p>
                <p className="text-xs mt-2 leading-relaxed" style={{ color: colors.textMuted }}>
                  Зайдите в любой магазин, откройте товар и нажмите кнопку чата.
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
    <div className="min-h-screen" style={{ background: colors.bg, color: colors.textStrong }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-28 md:pb-12">
        {isAuthenticated ? (
          <ChatsView />
        ) : (
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
