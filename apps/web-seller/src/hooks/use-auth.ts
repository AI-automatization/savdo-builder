'use client';

import { useMutation } from '@tanstack/react-query';
import type { RequestOtpRequest, VerifyOtpRequest } from 'types';
import { requestOtp, verifyOtp } from '../lib/api/auth.api';
import { useAuth } from '../lib/auth/context';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (data: RequestOtpRequest) => requestOtp(data),
  });
}

export function useVerifyOtp() {
  const { login } = useAuth();
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) => verifyOtp(data),
    onSuccess: (data) => {
      login(data.accessToken, data.refreshToken, data.user);
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();
  return useMutation({ mutationFn: logout });
}
