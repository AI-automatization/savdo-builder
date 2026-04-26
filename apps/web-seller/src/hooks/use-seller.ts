'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UpdateSellerProfileRequest, GlobalCategory, StoreCategory } from 'types';
import {
  getSellerProfile,
  updateSellerProfile,
  getStore,
  createStore,
  updateStore,
  submitStore,
  publishStore,
  unpublishStore,
  getGlobalCategories,
  getStoreCategories,
  createStoreCategory,
  updateStoreCategory,
  deleteStoreCategory,
  uploadSellerAvatar,
} from '../lib/api/seller.api';
import type { SellerProfile } from 'types';

// ── Profile ────────────────────────────────────────────────────────────────────

export function useSellerProfile() {
  return useQuery({
    queryKey: ['seller', 'profile'],
    queryFn: getSellerProfile,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateSellerProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateSellerProfileRequest) => updateSellerProfile(data),
    onSuccess: (profile) => queryClient.setQueryData(['seller', 'profile'], profile),
  });
}

export function useUploadSellerAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadSellerAvatar(file),
    onSuccess: ({ avatarUrl }) => {
      queryClient.setQueryData<SellerProfile | undefined>(['seller', 'profile'], (old) =>
        old ? { ...old, avatarUrl } : old,
      );
    },
  });
}

// ── Store ──────────────────────────────────────────────────────────────────────

export function useStore(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: ['seller', 'store'],
    queryFn: getStore,
    staleTime: 5 * 60 * 1000,
    enabled: options?.enabled ?? true,
  });
}

export function useCreateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createStore,
    onSuccess: (store) => queryClient.setQueryData(['seller', 'store'], store),
  });
}

export function useUpdateStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateStore,
    onSuccess: (store) => queryClient.setQueryData(['seller', 'store'], store),
  });
}

export function useSubmitStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitStore,
    onSuccess: (store) => queryClient.setQueryData(['seller', 'store'], store),
  });
}

export function usePublishStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: publishStore,
    onSuccess: (store) => queryClient.setQueryData(['seller', 'store'], store),
  });
}

export function useUnpublishStore() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unpublishStore,
    onSuccess: (store) => queryClient.setQueryData(['seller', 'store'], store),
  });
}

// ── Categories ─────────────────────────────────────────────────────────────────

export function useGlobalCategories() {
  return useQuery({
    queryKey: ['categories', 'global'],
    queryFn: getGlobalCategories,
    staleTime: 5 * 60 * 1000,
  });
}

export function useStoreCategories() {
  return useQuery({
    queryKey: ['categories', 'store'],
    queryFn: getStoreCategories,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCreateStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; sortOrder?: number }) => createStoreCategory(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'store'] }),
  });
}

export function useUpdateStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string; name?: string; sortOrder?: number }) =>
      updateStoreCategory(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'store'] }),
  });
}

export function useDeleteStoreCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteStoreCategory(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories', 'store'] }),
  });
}
