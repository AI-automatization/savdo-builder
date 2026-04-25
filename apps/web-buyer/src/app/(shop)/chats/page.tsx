"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { BottomNavBar } from "@/components/layout/BottomNavBar";
import { OtpGate } from "@/components/auth/OtpGate";
import { UserRole } from "types";
import type { ChatThread } from "types";
import { getThreadDisplay } from "@/lib/api/chat.api";
import { useAuth } from "@/lib/auth/context";
import { useThreads, useMessages, useSendMessage, useChatSocket } from "@/hooks/use-chat";
import { MessageSquare, Store } from "lucide-react";
import { glass, glassDim } from "@/lib/styles";
import { EmojiPicker } from "@/components/emoji-picker";

const inputStyle = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.13)",
  color: "#fff",
  outline: "none",
} as const;

// ── Helpers ────────────────────────────────────────────────────────────────

function timeLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "вчера";
  return date.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
}


// ── Icons ──────────────────────────────────────────────────────────────────

const IcoShop    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg>;
const IcoCart    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"/></svg>;
const IcoChat    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;
const IcoOrders  = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z"/></svg>;
const IcoProfile = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>;
const IcoBack    = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"/></svg>;
const IcoSend    = () => <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/></svg>;


// ── Icons (used in OtpGate) ───────────────────────────────────────────────

const IcoChatGate = () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-[22px] h-[22px]"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/></svg>;

// ── Thread Item ────────────────────────────────────────────────────────────

function ThreadItem({ thread, active, onClick }: { thread: ChatThread; active: boolean; onClick: () => void }) {
  const { title, subtitle } = getThreadDisplay(thread);
  const unread = thread.unreadCount ?? 0;
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5"
      style={active ? { background: "rgba(167,139,250,.10)" } : {}}>
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={{ background: "rgba(167,139,250,.22)", color: "#A78BFA", border: "1px solid rgba(167,139,250,.30)" }}>
        <MessageSquare size={20} style={{ color: '#A78BFA' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate" style={unread > 0 ? { fontWeight: 600 } : undefined}>
          {title}
        </p>
        <p className="text-xs mt-0.5 truncate" style={{ color: unread > 0 ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.38)" }}>
          {thread.lastMessage ?? subtitle ?? "Нет сообщений"}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {thread.lastMessageAt && (
          <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
            {timeLabel(thread.lastMessageAt)}
          </span>
        )}
        {unread > 0 && (
          <span className="min-w-[18px] h-[18px] px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: "#A78BFA", color: "#0d0d1f" }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </div>
    </button>
  );
}

// ── Chat View ──────────────────────────────────────────────────────────────

function ChatView({ thread }: { thread: ChatThread }) {
  const { data, isLoading } = useMessages(thread.id);
  useChatSocket(thread.id);
  const sendMutation = useSendMessage(thread.id);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messages = data?.messages ?? [];
  const { title, subtitle } = getThreadDisplay(thread);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText("");
    await sendMutation.mutateAsync({ text: trimmed });
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <button onClick={() => {/* handled by parent */}} className="w-8 h-8 flex items-center justify-center rounded-xl text-white/60 md:hidden" style={glassDim}>
          <IcoBack />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{title}</p>
          <p className="text-[11px] truncate" style={{ color: "rgba(255,255,255,0.35)" }}>
            {subtitle ? `${subtitle} · ` : ""}
            {thread.status === "OPEN" ? "Открыт" : "Закрыт"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-2.5">
        {isLoading && (
          <div className="flex flex-col gap-2.5">
            {[1, 2].map((i) => (
              <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
                <div className="h-9 w-48 rounded-2xl animate-pulse" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            ))}
          </div>
        )}

        {!isLoading && messages.length === 0 && (
          <p className="text-center text-sm py-8" style={{ color: "rgba(255,255,255,0.28)" }}>Нет сообщений</p>
        )}

        {messages.map((m) => {
          const isBuyer = m.senderRole === UserRole.BUYER;
          return (
            <div key={m.id} className={`flex ${isBuyer ? "justify-end" : "justify-start"}`}>
              {!isBuyer && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 mr-2 self-end"
                  style={{ background: "rgba(167,139,250,.22)", color: "#A78BFA" }}><Store size={18} /></div>
              )}
              <div className="max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm text-white"
                style={isBuyer
                  ? { background: "linear-gradient(135deg, rgba(124,58,237,.55), rgba(167,139,250,.40))", borderBottomRightRadius: 4 }
                  : { ...glassDim, borderBottomLeftRadius: 4 }}>
                <p>{m.text}</p>
                <p className="text-[10px] mt-0.5 text-right" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      {thread.status === "OPEN" && (
        <div className="flex items-center gap-2 px-3 py-3 flex-shrink-0" style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          <EmojiPicker onPick={(emoji) => setText((prev) => prev + emoji)} />
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Написать сообщение..."
            className="flex-1 h-10 px-3.5 rounded-xl text-sm text-white placeholder-white/25 outline-none"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.11)" }}
          />
          <button onClick={handleSend} disabled={!text.trim() || sendMutation.isPending}
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)" }}
            aria-label="Отправить">
            <IcoSend />
          </button>
        </div>
      )}
      {thread.status === "CLOSED" && (
        <div className="px-4 py-3 text-center text-xs flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
          Чат закрыт продавцом
        </div>
      )}
    </div>
  );
}

// ── Authenticated Chats ────────────────────────────────────────────────────

function ChatsView() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const { data: threads, isLoading, isError } = useThreads();
  const activeThread = threads?.find((t) => t.id === activeId) ?? null;

  useEffect(() => {
    if (!activeId && threads && threads.length > 0) setActiveId(threads[0].id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  // Mobile: show list or chat
  const showList = !activeId || !activeThread;

  return (
    <>
      {/* Desktop: side-by-side / Mobile: single view */}
      <div className="flex gap-0 h-[calc(100vh-11rem)] rounded-2xl overflow-hidden" style={glass}>

        {/* Thread list */}
        <div className={`${activeThread ? "hidden md:flex" : "flex"} flex-col w-full md:w-72 md:border-r flex-shrink-0`}
          style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="px-4 py-3.5 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
            <p className="text-sm font-semibold text-white">Чаты с продавцами</p>
          </div>
          <div className="flex-1 overflow-y-auto divide-y" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
            {isLoading && (
              <div className="flex flex-col">
                {[1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="w-10 h-10 rounded-full animate-pulse flex-shrink-0" style={{ background: "rgba(255,255,255,0.10)" }} />
                    <div className="flex-1 flex flex-col gap-2">
                      <div className="h-3 w-28 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.10)" }} />
                      <div className="h-2.5 w-36 rounded-full animate-pulse" style={{ background: "rgba(255,255,255,0.07)" }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isError && <p className="px-4 py-6 text-xs text-center" style={{ color: "rgba(248,113,113,.70)" }}>Ошибка загрузки</p>}
            {!isLoading && !isError && threads?.length === 0 && (
              <div className="px-4 py-10 text-center flex flex-col items-center gap-3">
                <MessageSquare size={28} style={{ color: 'rgba(255,255,255,0.3)' }} />
                <div>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.60)" }}>Чатов пока нет</p>
                  <p className="text-xs mt-1.5 leading-relaxed" style={{ color: "rgba(255,255,255,0.35)" }}>
                    Откройте магазин или заказ и нажмите<br />кнопку чата — напишите продавцу
                  </p>
                </div>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold mt-1"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", color: "white" }}
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
            {/* Mobile back button */}
            <div className="md:hidden flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <button onClick={() => setActiveId(null)} className="flex items-center gap-1.5 text-xs font-medium" style={{ color: "#A78BFA" }}>
                <IcoBack /> Все чаты
              </button>
            </div>
            <ChatView thread={activeThread} />
          </div>
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center p-8">
            <div className="text-center max-w-sm">
              <MessageSquare size={32} style={{ color: 'rgba(255,255,255,0.3)', margin: '0 auto 10px' }} />
              {threads && threads.length === 0 ? (
                <>
                  <p className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.55)" }}>Здесь появятся ваши диалоги</p>
                  <p className="text-xs mt-2 leading-relaxed" style={{ color: "rgba(255,255,255,0.30)" }}>
                    Зайдите в любой магазин, откройте товар и нажмите фиолетовую кнопку чата — отправьте первое сообщение продавцу.
                  </p>
                </>
              ) : (
                <p className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Выберите чат</p>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function ChatsPage() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}>
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 360, height: 360, top: -100, right: -80, background: "radial-gradient(circle, rgba(167,139,250,.20) 0%, transparent 70%)", filter: "blur(32px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: 140, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.13) 0%, transparent 70%)", filter: "blur(28px)" }} />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 pt-6 pb-28" style={{ zIndex: 1 }}>
        <h1 className="text-xl font-bold text-white mb-5">Чаты</h1>
        {isAuthenticated ? <ChatsView /> : (
          <OtpGate
            icon={<IcoChatGate />}
            title="Войдите для доступа к чатам"
          />
        )}
      </div>

      <BottomNavBar active="chats" />
    </div>
  );
}
