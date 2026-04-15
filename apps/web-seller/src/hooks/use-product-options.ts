'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createOptionGroup,
  updateOptionGroup,
  deleteOptionGroup,
  createOptionValue,
  updateOptionValue,
  deleteOptionValue,
} from '../lib/api/product-options.api';
import { productKeys } from './use-products';

function useInvalidateProduct(productId: string) {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: productKeys.detail(productId) });
    qc.invalidateQueries({ queryKey: productKeys.variants(productId) });
  };
}

// ── Option Groups ─────────────────────────────────────────────────────────────

export function useCreateOptionGroup(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: (data: { name: string; code: string; sortOrder?: number }) =>
      createOptionGroup(productId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateOptionGroup(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: ({
      groupId,
      ...data
    }: { groupId: string; name?: string; sortOrder?: number }) =>
      updateOptionGroup(productId, groupId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteOptionGroup(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: (groupId: string) => deleteOptionGroup(productId, groupId),
    onSuccess: invalidate,
  });
}

// ── Option Values ─────────────────────────────────────────────────────────────

export function useCreateOptionValue(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: ({
      groupId,
      ...data
    }: { groupId: string; value: string; code: string; sortOrder?: number }) =>
      createOptionValue(productId, groupId, data),
    onSuccess: invalidate,
  });
}

export function useUpdateOptionValue(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: ({
      groupId,
      valueId,
      ...data
    }: { groupId: string; valueId: string; value?: string; sortOrder?: number }) =>
      updateOptionValue(productId, groupId, valueId, data),
    onSuccess: invalidate,
  });
}

export function useDeleteOptionValue(productId: string) {
  const invalidate = useInvalidateProduct(productId);
  return useMutation({
    mutationFn: ({ groupId, valueId }: { groupId: string; valueId: string }) =>
      deleteOptionValue(productId, groupId, valueId),
    onSuccess: invalidate,
  });
}
