import { UserRole, UserStatus } from './enums';

// ── API Response wrappers ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── User ──────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  isPhoneVerified: boolean;
  createdAt: string;
}

// ── Notification ──────────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}
