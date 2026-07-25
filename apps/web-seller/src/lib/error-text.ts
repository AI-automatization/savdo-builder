// Reads the backend's actual error message off an axios/mutation error instead of
// always showing a generic fallback. Pattern originally established in chat/page.tsx.
export function errorText(err: unknown, fallback: string): string {
  type ApiError = { response?: { data?: { message?: string } }; message?: string };
  const e = err as ApiError;
  return e?.response?.data?.message ?? fallback;
}
