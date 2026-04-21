interface Props {
  className?: string;
  style?: React.CSSProperties;
  rounded?: boolean;
}

export function Skeleton({ className = '', style, rounded = false }: Props) {
  return (
    <div
      className={`animate-pulse ${className}`}
      style={{
        background: 'linear-gradient(90deg, rgba(255,255,255,0.06) 25%, rgba(255,255,255,0.10) 50%, rgba(255,255,255,0.06) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        borderRadius: rounded ? 9999 : 12,
        ...style,
      }}
    />
  );
}

// Preset: карточка товара в StorePage
export function ProductCardSkeleton() {
  return (
    <div className="rounded-2xl p-3 flex flex-col gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Skeleton style={{ height: 140, borderRadius: 14 }} />
      <Skeleton style={{ height: 14, width: '70%' }} />
      <Skeleton style={{ height: 14, width: '45%' }} />
    </div>
  );
}

// Preset: строка заказа
export function OrderRowSkeleton() {
  return (
    <div className="rounded-2xl p-4 flex items-center gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Skeleton style={{ width: 48, height: 48, flexShrink: 0 }} />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton style={{ height: 13, width: '65%' }} />
        <Skeleton style={{ height: 11, width: '40%' }} />
      </div>
      <Skeleton style={{ height: 20, width: 60, borderRadius: 20 }} />
    </div>
  );
}

// Preset: строка треда в чате
export function ThreadRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Skeleton style={{ width: 40, height: 40, flexShrink: 0 }} />
      <div className="flex flex-col gap-2 flex-1">
        <Skeleton style={{ height: 13, width: '55%' }} />
        <Skeleton style={{ height: 11, width: '35%' }} />
      </div>
    </div>
  );
}
