// apps/web-buyer/src/components/store/StoreCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Store as StoreIcon } from 'lucide-react';
import { colors } from '@/lib/styles';
import { VerifiedBadge } from './VerifiedBadge';
import { StoreRating } from './StoreRating';

interface Props {
  slug: string;
  name: string;
  city: string | null;
  logoUrl: string | null;
  isVerified: boolean;
  avgRating: number | null;
  reviewCount: number;
  /** Compact — для product page seller block. Default — full card для grid. */
  variant?: 'card' | 'compact';
}

export function StoreCard({
  slug,
  name,
  city,
  logoUrl,
  isVerified,
  avgRating,
  reviewCount,
  variant = 'card',
}: Props) {
  if (variant === 'compact') {
    return (
      <Link
        href={`/${slug}`}
        className="flex items-center gap-3 p-3 rounded-md transition-colors hover:opacity-90"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <Logo logoUrl={logoUrl} name={name} size={44} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: colors.textStrong }}>
              {name}
            </span>
            {isVerified && <VerifiedBadge size="sm" bare />}
          </div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
            <StoreRating rating={avgRating} reviewCount={reviewCount} size="sm" />
            {city && (
              <span className="text-[11px]" style={{ color: colors.textMuted }}>
                {city}
              </span>
            )}
          </div>
        </div>
        <span className="text-sm flex-shrink-0" style={{ color: colors.brand }} aria-hidden>
          →
        </span>
      </Link>
    );
  }

  return (
    <Link
      href={`/${slug}`}
      className="block group rounded-md transition-all hover:-translate-y-0.5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}`, padding: 12 }}
    >
      <div className="flex items-center gap-3 mb-2">
        <Logo logoUrl={logoUrl} name={name} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-semibold truncate" style={{ color: colors.textStrong }}>
              {name}
            </span>
            {isVerified && <VerifiedBadge size="sm" bare />}
          </div>
          {city && (
            <span className="text-[11px]" style={{ color: colors.textMuted }}>
              {city}
            </span>
          )}
        </div>
      </div>
      <StoreRating rating={avgRating} reviewCount={reviewCount} size="sm" />
    </Link>
  );
}

function Logo({ logoUrl, name, size }: { logoUrl: string | null; name: string; size: number }) {
  if (logoUrl) {
    return (
      <div className="relative rounded-full overflow-hidden flex-shrink-0" style={{ width: size, height: size, background: colors.surfaceSunken }}>
        <Image src={logoUrl} alt={name} fill className="object-cover" sizes={`${size}px`} />
      </div>
    );
  }
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: colors.brand, color: colors.brandTextOnBg }}
    >
      <StoreIcon size={Math.max(14, size - 22)} />
    </div>
  );
}
