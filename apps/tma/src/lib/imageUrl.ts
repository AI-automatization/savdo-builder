const R2_BASE: string = import.meta.env.VITE_R2_PUBLIC_URL ?? '';
const API_BASE: string = (import.meta.env.VITE_API_URL as string) ?? '';

export function getImageUrl(objectKey: string | undefined | null, mediaId?: string | null): string {
  if (!objectKey) return '';
  if (objectKey.startsWith('tg:')) {
    if (!mediaId) return '';
    return `${API_BASE}/api/v1/media/proxy/${mediaId}`;
  }
  if (!R2_BASE) return '';
  return `${R2_BASE}/${objectKey}`;
}
