const FALLBACK_ORIGIN = 'http://localhost:3000';

export const API_ORIGIN = process.env.NEXT_PUBLIC_API_URL || FALLBACK_ORIGIN;

export const API_BASE = `${API_ORIGIN}/api/v1`;

if (!process.env.NEXT_PUBLIC_API_URL && typeof window !== 'undefined') {
  console.warn('[savdo] NEXT_PUBLIC_API_URL not set — API requests go to localhost');
}
