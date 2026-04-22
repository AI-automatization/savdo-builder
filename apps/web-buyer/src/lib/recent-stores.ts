const STORAGE_KEY = "savdo:buyer:recent-stores";
const MAX_ENTRIES = 8;

export interface RecentStore {
  slug: string;
  name: string;
  logoUrl: string | null;
  visitedAt: number;
}

function isRecentStore(value: unknown): value is RecentStore {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.slug === "string" &&
    typeof v.name === "string" &&
    (v.logoUrl === null || typeof v.logoUrl === "string") &&
    typeof v.visitedAt === "number"
  );
}

export function getRecentStores(): RecentStore[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecentStore).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

export function pushRecentStore(entry: Omit<RecentStore, "visitedAt">): void {
  if (typeof window === "undefined") return;
  try {
    const current = getRecentStores().filter((s) => s.slug !== entry.slug);
    const next: RecentStore[] = [
      { ...entry, visitedAt: Date.now() },
      ...current,
    ].slice(0, MAX_ENTRIES);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // storage full or disabled — silent fail is fine
  }
}

export function removeRecentStore(slug: string): void {
  if (typeof window === "undefined") return;
  try {
    const next = getRecentStores().filter((s) => s.slug !== slug);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
