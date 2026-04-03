// apps/web-seller/src/lib/api/media.api.ts
import { apiClient } from './client';

export type MediaPurpose = 'product_image' | 'store_logo' | 'store_banner';

export interface UploadUrlResponse {
  mediaId: string;
  uploadUrl: string;
  expiresAt: string;
}

export interface ConfirmedMedia {
  id: string;
  url: string;
  mimeType: string;
  purpose: MediaPurpose;
  status: 'CONFIRMED';
  confirmedAt: string;
}

export async function getUploadUrl(
  mimeType: string,
  purpose: MediaPurpose,
  sizeBytes: number,
): Promise<UploadUrlResponse> {
  const { data } = await apiClient.post<UploadUrlResponse>('/media/upload-url', {
    mimeType,
    purpose,
    sizeBytes,
  });
  return data;
}

export async function confirmUpload(mediaId: string): Promise<ConfirmedMedia> {
  const { data } = await apiClient.post<ConfirmedMedia>(`/media/${mediaId}/confirm`);
  return data;
}
