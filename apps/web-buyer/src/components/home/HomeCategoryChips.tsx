// apps/web-buyer/src/components/home/HomeCategoryChips.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useGlobalCategoriesTree } from '@/hooks/use-storefront';
import { colors, pill, pillActive } from '@/lib/styles';

const MAX_CHIPS = 6;

export function HomeCategoryChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { data, isLoading } = useGlobalCategoriesTree();
  const selectedSlug = searchParams.get('cat');

  const roots = useMemo(() => {
    const all = data ?? [];
    return all
      .filter((c) => c.parentId === null)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, MAX_CHIPS);
  }, [data]);

  function setCat(slug: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (slug) params.set('cat', slug);
    else params.delete('cat');
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  if (isLoading && roots.length === 0) {
    return (
      <section className="px-4 sm:px-6 mt-6 max-w-7xl mx-auto">
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="flex-shrink-0 h-8 w-24 rounded-full animate-pulse"
              style={{ background: colors.skeleton }}
            />
          ))}
        </div>
      </section>
    );
  }

  if (roots.length === 0) return null;

  return (
    <section className="px-4 sm:px-6 mt-6 max-w-7xl mx-auto">
      <div className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">
        <Chip active={!selectedSlug} onClick={() => setCat(null)} label="Все" />
        {roots.map((c) => (
          <Chip
            key={c.id}
            active={selectedSlug === c.slug}
            onClick={() => setCat(c.slug)}
            icon={c.iconEmoji}
            label={c.nameRu}
          />
        ))}
      </div>
    </section>
  );
}

function Chip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon?: string | null;
  label: string;
}) {
  const style = active ? pillActive : pill;
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 h-8 rounded-full text-sm font-semibold transition-colors"
      style={style}
    >
      {icon && <span aria-hidden>{icon}</span>}
      <span>{label}</span>
    </button>
  );
}
