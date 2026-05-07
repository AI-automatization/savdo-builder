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

// Preset: детали товара (ProductPage)
export function ProductDetailSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton style={{ width: '100%', aspectRatio: '1 / 1', borderRadius: 18 }} />
      <Skeleton style={{ height: 22, width: '70%' }} />
      <Skeleton style={{ height: 16, width: '40%' }} />
      <div className="flex flex-col gap-2 mt-2">
        <Skeleton style={{ height: 13, width: '95%' }} />
        <Skeleton style={{ height: 13, width: '88%' }} />
        <Skeleton style={{ height: 13, width: '60%' }} />
      </div>
    </div>
  );
}

// Preset: stats-карточка дашборда (KPI блоки)
export function StatsCardSkeleton() {
  return (
    <div className="rounded-2xl p-4 flex flex-col items-center gap-2" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Skeleton style={{ width: 32, height: 32, borderRadius: 8 }} />
      <Skeleton style={{ height: 24, width: '50%' }} />
      <Skeleton style={{ height: 11, width: '60%' }} />
    </div>
  );
}

// Preset: профильный блок (ProfilePage)
export function ProfileBlockSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton style={{ width: 64, height: 64 }} rounded />
        <div className="flex flex-col gap-2 flex-1">
          <Skeleton style={{ height: 15, width: '60%' }} />
          <Skeleton style={{ height: 11, width: '40%' }} />
        </div>
      </div>
      <Skeleton style={{ height: 60 }} />
      <Skeleton style={{ height: 60 }} />
      <Skeleton style={{ height: 60 }} />
    </div>
  );
}

// Preset: карточка корзины (line item)
export function CartItemSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
      <Skeleton style={{ width: 60, height: 60, flexShrink: 0, borderRadius: 12 }} />
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton style={{ height: 13, width: '70%' }} />
        <Skeleton style={{ height: 11, width: '40%' }} />
        <Skeleton style={{ height: 24, width: 100, borderRadius: 12 }} />
      </div>
    </div>
  );
}
