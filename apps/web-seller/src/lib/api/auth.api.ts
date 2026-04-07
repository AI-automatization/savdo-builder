import type {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  AuthTokensResponse,
  AuthUser,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from 'types';
import { apiClient } from './client';

export async function requestOtp(data: RequestOtpRequest): Promise<RequestOtpResponse> {
  const res = await apiClient.post<RequestOtpResponse>('/auth/request-otp', data);
  return res.data;
}

export async function verifyOtp(data: VerifyOtpRequest): Promise<AuthTokensResponse> {
  const res = await apiClient.post<AuthTokensResponse>('/auth/verify-otp', data);
  return res.data;
}

export async function refreshToken(data: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  const res = await apiClient.post<RefreshTokenResponse>('/auth/refresh', data);
  return res.data;
}

export async function getMe(): Promise<AuthUser> {
  const res = await apiClient.get<{ success: boolean; data: AuthUser }>('/auth/me');
  return res.data.data;
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout');
}
