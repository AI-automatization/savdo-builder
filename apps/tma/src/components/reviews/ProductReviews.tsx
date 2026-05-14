import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Spinner } from '@/components/ui/Spinner';
import { Stars } from '@/components/ui/Stars';

interface ReviewItem {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  authorName: string;
}

interface ListResponse {
  items: ReviewItem[];
  total: number;
  page: number;
  limit: number;
}

interface Props {
  productId: string;
  /** Денормализованные значения с product detail — показываем сразу до fetch */
  initialAvg?: number | null;
  initialCount?: number;
}

/**
 * FEAT-008-FE: блок отзывов на ProductPage. Загружает первые 20, кнопка
 * «Показать все» открывает остальные. Снизу — top-line стат (avg + count).
 */
export function ProductReviews({ productId, initialAvg, initialCount }: Props) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api<ListResponse>(`/storefront/products/${productId}/reviews?limit=20`)
      .then((r) => { if (!cancelled) setData(r); })
      .catch(() => { if (!cancelled) setData({ items: [], total: 0, page: 1, limit: 20 }); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const avg = initialAvg ?? null;
  const total = data?.total ?? initialCount ?? 0;

  if (!loading && total === 0) return null;

  const items = data?.items ?? [];
  const visible = showAll ? items : items.slice(0, 5);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline gap-2">
        <h3 className="text-sm font-bold" style={{ color: 'var(--tg-text-primary)' }}>
          ⭐ Отзывы
        </h3>
        {avg !== null && (
          <span className="flex items-center gap-1.5">
            <Stars value={avg} size={13} />
            <span className="text-xs font-bold" style={{ color: '#FBBF24' }}>{avg.toFixed(1)}</span>
            <span className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>· {total}</span>
          </span>
        )}
      </div>

      {loading && <div className="flex justify-center py-3"><Spinner size={18} /></div>}

      {!loading && visible.map((r) => (
        <div
          key={r.id}
          className="px-3 py-2.5 rounded-xl flex flex-col gap-1"
          style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border-soft)' }}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold" style={{ color: 'var(--tg-text-secondary)' }}>
              {r.authorName}
            </span>
            <Stars value={r.rating} size={12} />
          </div>
          {r.comment && (
            <p className="text-xs" style={{ color: 'var(--tg-text-secondary)', lineHeight: 1.4 }}>
              {r.comment}
            </p>
          )}
          <p className="text-xxs" style={{ color: 'var(--tg-text-muted)' }}>
            {new Date(r.createdAt).toLocaleDateString('ru', { day: '2-digit', month: 'short', year: 'numeric' })}
          </p>
        </div>
      ))}

      {!loading && !showAll && items.length > 5 && (
        <button
          onClick={() => setShowAll(true)}
          className="text-xs font-semibold py-2 rounded-lg"
          style={{ background: 'var(--tg-accent-bg)', color: 'var(--tg-accent)', border: '1px solid var(--tg-accent-border)' }}
        >
          Показать все {total} отзывов
        </button>
      )}
    </div>
  );
}
