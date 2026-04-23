import type { MessagesResponse, SendMessageRequest, CreateThreadRequest } from 'types';
import { apiClient } from './client';

// ─────────────────────────────────────────────────────────────────────────────
// Local view-model.
//
// Backend changed the thread list response shape in Sprint 31 (commit d794f18):
// - removed  contextType / contextId / buyerId / sellerId / unreadCount
// - removed  lastMessage: { text, ... } object
// - added    threadType, storeName, storeSlug, productTitle, orderNumber, buyerPhone
// - added    lastMessage: string | null
//
// `packages/types/src/api/chat.ts#ChatThread` is not yet updated (owned by Полат),
// so we adapt the raw response to a stable view-model here.
// Tracked in tasks.md as API-CHAT-THREAD-CONTRACT-001.
// ─────────────────────────────────────────────────────────────────────────────

export type ChatThreadView = {
  id: string;
  threadType: 'PRODUCT' | 'ORDER';
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string | null;
  lastMessageText: string | null;
  // Display helpers
  title: string;               // "Магазин …" / phone / product title / order number / fallback
  subtitle: string | null;     // contextual line below the title
  unreadCount: number;
  // Raw fields preserved for navigation / tooling
  storeName: string | null;
  storeSlug: string | null;
  buyerPhone: string | null;
  productTitle: string | null;
  orderNumber: string | null;
};

type RawThread = {
  id?: unknown;
  threadType?: unknown;
  contextType?: unknown;
  status?: unknown;
  lastMessageAt?: unknown;
  lastMessage?: unknown;
  storeName?: unknown;
  storeSlug?: unknown;
  productTitle?: unknown;
  orderNumber?: unknown;
  buyerPhone?: unknown;
  unreadCount?: unknown;
};

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.length > 0 ? v : null;
}

function normalizeThread(raw: RawThread): ChatThreadView {
  const threadTypeRaw = typeof raw.threadType === 'string'
    ? raw.threadType
    : typeof raw.contextType === 'string'
    ? raw.contextType
    : 'PRODUCT';
  const threadType: 'PRODUCT' | 'ORDER' = threadTypeRaw === 'ORDER' ? 'ORDER' : 'PRODUCT';
  const status: 'OPEN' | 'CLOSED' = raw.status === 'CLOSED' ? 'CLOSED' : 'OPEN';

  const storeName    = asString(raw.storeName);
  const storeSlug    = asString(raw.storeSlug);
  const productTitle = asString(raw.productTitle);
  const orderNumber  = asString(raw.orderNumber);
  const buyerPhone   = asString(raw.buyerPhone);

  // Buyer view prefers the store name; fall back through contextual fields.
  const title = storeName ?? productTitle ?? (orderNumber ? `Заказ #${orderNumber}` : null) ?? buyerPhone ?? 'Чат';
  const subtitle = threadType === 'PRODUCT'
    ? productTitle
    : orderNumber ? `Заказ #${orderNumber}` : null;

  // lastMessage is either a flat string (new API) or legacy { text } object.
  let lastMessageText: string | null = null;
  if (typeof raw.lastMessage === 'string') {
    lastMessageText = raw.lastMessage.length > 0 ? raw.lastMessage : null;
  } else if (raw.lastMessage && typeof raw.lastMessage === 'object') {
    const obj = raw.lastMessage as { text?: unknown; body?: unknown };
    lastMessageText = asString(obj.text) ?? asString(obj.body);
  }

  return {
    id: typeof raw.id === 'string' ? raw.id : String(raw.id ?? ''),
    threadType,
    status,
    lastMessageAt: asString(raw.lastMessageAt),
    lastMessageText,
    title,
    subtitle,
    unreadCount: typeof raw.unreadCount === 'number' ? raw.unreadCount : 0,
    storeName,
    storeSlug,
    buyerPhone,
    productTitle,
    orderNumber,
  };
}

export async function getThreads(): Promise<ChatThreadView[]> {
  const res = await apiClient.get<RawThread[]>('/chat/threads');
  return (Array.isArray(res.data) ? res.data : []).map(normalizeThread);
}

export async function createThread(data: CreateThreadRequest): Promise<void> {
  await apiClient.post('/chat/threads', data);
}

export async function getMessages(
  threadId: string,
  params?: { limit?: number; before?: string },
): Promise<MessagesResponse> {
  const res = await apiClient.get<MessagesResponse>(`/chat/threads/${threadId}/messages`, { params });
  return res.data;
}

export async function sendMessage(threadId: string, data: SendMessageRequest): Promise<void> {
  await apiClient.post(`/chat/threads/${threadId}/messages`, data);
}
