// apps/web-buyer/src/components/store/store-types.ts
//
// Shared data-shape types for store components. Kept in a plain (non-'use client')
// module so a server component (e.g. (shop)/[slug]/page.tsx) can import the type
// without pulling in a client component module.

/** Pre-computed category chip for the store page — `href` is resolved server-side. */
export interface StoreCategoryItem {
  id: string;
  name: string;
  sortOrder: number;
  href: string;
}
