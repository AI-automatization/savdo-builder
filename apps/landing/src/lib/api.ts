import type { FeaturedStore } from "@/types/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * Fetch featured stores from storefront API.
 * Cached at the edge for 1 hour (revalidate: 3600).
 * Returns an empty array on failure so landing always renders.
 */
export async function getFeaturedStores(): Promise<FeaturedStore[]> {
  if (!API_URL) return [];

  try {
    const res = await fetch(`${API_URL}/api/v1/storefront/featured`, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return [];

    return data as FeaturedStore[];
  } catch {
    return [];
  }
}
