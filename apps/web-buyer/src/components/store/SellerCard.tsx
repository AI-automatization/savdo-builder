// apps/web-buyer/src/components/store/SellerCard.tsx
'use client';

import { StoreCard } from './StoreCard';

interface Props {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
}

export function SellerCard(props: Props) {
  return <StoreCard {...props} variant="compact" />;
}
