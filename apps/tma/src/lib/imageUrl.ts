const R2_BASE: string = import.meta.env.VITE_R2_PUBLIC_URL ?? '';

export function getImageUrl(objectKey: string | undefined | null): string {
  if (!objectKey || !R2_BASE) return '';
  return `${R2_BASE}/${objectKey}`;
}
