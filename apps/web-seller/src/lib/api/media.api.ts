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

export interface DirectUploadResponse {
  mediaFileId: string;
  url: string;
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

/**
 * Direct multipart upload — file goes through our API, then stored in Telegram channel.
 * Use this when R2 is not configured (presigned URL flow returns 503).
 */
export async function uploadDirect(
  file: File,
  purpose: MediaPurpose,
  onProgress?: (pct: number) => void,
): Promise<DirectUploadResponse> {
  const form = new FormData();
  form.append('file', file);
  form.append('purpose', purpose);

  const { data } = await apiClient.post<DirectUploadResponse>('/media/upload', form, {
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    },
  });
  return data;
}
