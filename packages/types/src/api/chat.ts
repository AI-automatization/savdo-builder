import { ThreadType, UserRole } from '../enums';

// ── Message ───────────────────────────────────────────────────────────────────

export interface ChatMessage {
  id: string;
  threadId: string;
  text: string;
  senderRole: UserRole;
  createdAt: string;
}

// ── Thread ────────────────────────────────────────────────────────────────────

export interface ChatThread {
  id: string;
  contextType: ThreadType;
  contextId: string;
  buyerId: string;
  sellerId: string;
  status: 'OPEN' | 'CLOSED';
  lastMessageAt: string | null;
  unreadCount: number;
  lastMessage: Pick<ChatMessage, 'id' | 'text' | 'senderRole' | 'createdAt'> | null;
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
