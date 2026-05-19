import { UserRole } from '../enums';

// ── Requests ──────────────────────────────────────────────────────────────────

export interface RequestOtpRequest {
  phone: string;
  purpose: 'login' | 'register' | 'checkout';
}

export interface VerifyOtpRequest {
  phone: string;
  code: string;
  purpose: 'login' | 'register' | 'checkout';
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ── Responses ─────────────────────────────────────────────────────────────────

export interface RequestOtpResponse {
  message: string;
  expiresAt: string;
}

export interface BuyerProfile {
  id: string;
  avatarUrl: string | null;
}

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
  /**
   * API-RESPONSE-TYPES-RECONCILE-001: отображаемое имя пользователя (для buyer —
   * собранное из Buyer.firstName + Buyer.lastName). Заполняется только
   * `GET /auth/me`; undefined если имя не задано. Login/telegram-auth ответы
   * имя не присылают.
   */
  name?: string;
  buyer?: BuyerProfile | null;
}

export interface AuthTokensResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
}
