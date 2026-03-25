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

export interface AuthUser {
  id: string;
  phone: string;
  role: UserRole;
  isPhoneVerified: boolean;
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
