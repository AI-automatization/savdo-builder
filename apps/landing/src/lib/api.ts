import type { FeaturedStore } from "@/types/store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type FeaturedStorefrontResponse = {
  topStores: FeaturedStore[];
};

/**
 * Fetch featured stores from storefront API.
 * Endpoint returns `{ topStores, featuredProducts }` — landing only needs
 * `topStores` (see apps/api GetFeaturedStorefrontUseCase).
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

    const data = (await res.json()) as Partial<FeaturedStorefrontResponse>;
    if (!Array.isArray(data.topStores)) return [];

    return data.topStores;
  } catch {
    return [];
  }
}
