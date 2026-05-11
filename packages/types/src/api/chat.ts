import { ThreadType, UserRole } from '../enums';

// ── Message ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  threadId: string;
  text: string;
  senderRole: UserRole;
  createdAt: string;
  editedAt: string | null;
  isDeleted: boolean;
}

// ── Thread ────────────────────────────────────────────────────────────────────

/** Shape returned by GET /chat/threads (list-my-threads use-case) */
export interface ChatThread {
  id: string;
  threadType: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string | null;
  lastMessage: string | null;
  /** PRODUCT-thread context (API-CHAT-THREAD-PRODUCT-PREVIEW-001) — null для ORDER-thread */
  productId: string | null;
  productTitle: string | null;
  /** Resolved CDN URL (sortOrder=0 image), null если фото нет / telegram-expired */
  productImageUrl: string | null;
  /** Effective price: salePrice ?? basePrice; в основной валюте магазина (не minor) */
  productPrice: number | null;
  orderNumber: string | null;
  storeName: string | null;
  storeSlug: string | null;
  buyerPhone: string | null;
  unreadCount: number;
}

// ── Requests ──────────────────────────────────────────────────────────────────

export interface CreateThreadRequest {
  contextType: ThreadType;
  contextId: string;
  firstMessage: string;
}

export interface SendMessageRequest {
  text: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface MessagesResponse {
  messages: ChatMessage[];
  hasMore: boolean;
}
