'use client';

import { useState, useRef, useEffect } from 'react';
import { UserRole } from 'types';
import type { ChatThread } from 'types';
import { getThreadDisplay } from '@/lib/api/chat.api';
import { MessageSquare, User as UserIcon } from 'lucide-react';
import { useThreads, useMessages, useSendMessage, useResolveThread, useChatSocket } from '@/hooks/use-chat';
import { card, cardMuted, colors, inputStyle } from '@/lib/styles';

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
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/5"
      style={active ? { background: colors.accentMuted } : {}}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: colors.accentMuted, color: colors.accent }}
      >
        <UserIcon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">
          {title}
        </p>
        <p className="text-xs truncate" style={{ color: colors.textDim }}>
          {thread.lastMessage ?? subtitle ?? 'Нет сообщений'}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {thread.lastMessageAt && (
          <span className="text-[10px]" style={{ color: colors.textDim }}>
            {timeLabel(thread.lastMessageAt)}
          </span>
        )}
        {thread.status === 'CLOSED' && (
          <span className="text-[10px]" style={{ color: colors.success }}>закрыт</span>
        )}
      </div>
    </button>
  );
}

// ── Chat Window ────────────────────────────────────────────────────────────

function ChatWindow({ thread }: { thread: ChatThread }) {
  const { data, isLoading } = useMessages(thread.id);
  useChatSocket(thread.id);
  const sendMutation = useSendMessage(thread.id);
  const resolveMutation = useResolveThread();
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const { title, subtitle } = getThreadDisplay(thread);

  const messages = data?.messages ?? [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || sendMutation.isPending) return;
    setText('');
    await sendMutation.mutateAsync({ text: trimmed });
  }

  return (
    <div className="flex-1 rounded-2xl flex flex-col overflow-hidden" style={glass}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: colors.accentMuted, color: colors.accent }}>
            <UserIcon size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{title}</p>
            <p className="text-[11px] truncate" style={{ color: colors.textDim }}>
              {subtitle ?? (thread.threadType === 'ORDER' ? 'Заказ' : 'Товар')}
            </p>
          </div>
        </div>
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
      </div>

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
          return (
            <div key={m.id} className={`flex ${isSeller ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[70%] px-3.5 py-2.5 rounded-2xl text-sm text-white"
                style={isSeller
                  ? { background: colors.accent, color: colors.bg, borderBottomRightRadius: 4 }
                  : { ...glassDim, borderBottomLeftRadius: 4 }
                }
              >
                <p>{m.text}</p>
                <p className="text-[10px] mt-1 text-right" style={{ color: colors.textDim }}>
                  {timeLabel(m.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderTop: `1px solid ${colors.divider}` }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={thread.status === 'CLOSED' ? 'Чат закрыт' : 'Написать сообщение...'}
          disabled={thread.status === 'CLOSED'}
          className="flex-1 h-10 px-4 rounded-xl text-sm text-white placeholder-white/25 outline-none disabled:opacity-40"
          style={inputStyle}
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sendMutation.isPending || thread.status === 'CLOSED'}
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 disabled:opacity-40 transition-opacity"
          style={{ background: colors.accent }}
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

  // Auto-select first thread
  useEffect(() => {
    if (!activeId && threads && threads.length > 0) {
      setActiveId(threads[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads]);

  return (
    <div className="flex gap-5 max-w-4xl h-[calc(100vh-10rem)]">

      {/* Thread list */}
      <div className="w-72 flex-shrink-0 rounded-2xl overflow-hidden flex flex-col" style={glass}>
        <div className="px-4 py-3.5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
          <p className="text-sm font-semibold text-white">Чаты</p>
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

      {/* Chat window or empty */}
      {activeThread ? <ChatWindow thread={activeThread} /> : <EmptyState noThreads={!threads || threads.length === 0} />}
    </div>
  );
}
