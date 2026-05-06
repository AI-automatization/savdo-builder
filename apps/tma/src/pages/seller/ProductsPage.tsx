import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, prefetch } from '@/lib/api';
import { getImageUrl } from '@/lib/imageUrl';
import { useTelegram } from '@/providers/TelegramProvider';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { ProductImage } from '@/components/ui/ProductImage';

interface ProductImage {
  id: string;
  isPrimary: boolean;
  media: { objectKey: string };
}

interface Product {
  id: string;
  title: string;
  basePrice: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';
  description: string | null;
  storeCategoryId?: string | null;
  images?: ProductImage[];
  totalStock?: number;
}

interface StoreCategory {
  id: string;
  name: string;
}

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const { tg, viewportWidth } = useTelegram();
  const gridCols =
    viewportWidth >= 1536 ? 'grid-cols-5' :
    viewportWidth >= 1280 ? 'grid-cols-4' :
    viewportWidth >= 1024 ? 'grid-cols-3' :
    viewportWidth >= 768  ? 'grid-cols-2' : '';
  const { authVersion } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [activeCat, setActiveCat] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const abortRef = useRef<AbortController | null>(null);
  const load = useCallback((signal?: AbortSignal) => {
    setLoading(true);
    Promise.all([
      api<{ products: Product[]; total: number }>('/seller/products?limit=50', { signal }),
      api<StoreCategory[]>('/seller/categories', { signal }),
    ])
      .then(([res, cats]) => {
        if (signal?.aborted) return;
        setProducts(res?.products ?? []);
        setCategories(cats ?? []);
      })
      .catch(() => { if (!signal?.aborted) setError('Не удалось загрузить товары'); })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    load(ac.signal);
    tg?.BackButton.show();
    const goBack = () => navigate('/seller');
    tg?.BackButton.onClick(goBack);
    return () => { ac.abort(); tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [load, navigate, tg, authVersion]);

  const toggleStatus = async (product: Product) => {
    if (product.status === 'HIDDEN_BY_ADMIN') return;
    const next = product.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE';
    setTogglingId(product.id);
    try {
      await api(`/seller/products/${product.id}/status`, {
        method: 'PATCH',
        body: { status: next },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: next } : p)),
      );
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setTogglingId(null);
    }
  };

  const archiveProduct = async (product: Product) => {
    if (!window.confirm(`Архивировать «${product.title}»?\n\nТовар исчезнет из магазина, но сохранится в истории заказов.`)) return;
    setTogglingId(product.id);
    try {
      await api(`/seller/products/${product.id}/status`, {
        method: 'PATCH',
        body: { status: 'ARCHIVED' },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, status: 'ARCHIVED' } : p)),
      );
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
      window.alert('Не удалось архивировать товар');
    } finally {
      setTogglingId(null);
    }
  };

  const deleteProduct = async (product: Product) => {
    if (!window.confirm(`Удалить «${product.title}» навсегда?\n\nЭто действие нельзя отменить.`)) return;
    setTogglingId(product.id);
    try {
      await api(`/seller/products/${product.id}`, { method: 'DELETE' });
      tg?.HapticFeedback.notificationOccurred('success');
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    } catch (err) {
      tg?.HapticFeedback.notificationOccurred('error');
      const msg = err instanceof Error ? err.message : 'Не удалось удалить товар';
      window.alert(msg);
    } finally {
      setTogglingId(null);
    }
  };

  const price = (p: Product) => `${Number(p.basePrice).toLocaleString('ru')} сум`;

  const filtered = activeCat
    ? products.filter((p) => p.storeCategoryId === activeCat)
    : products;

  return (
    
      <div className="flex flex-col gap-4">
        {/* На мобиле paddingRight=56px чтобы кнопка «+» не попала под Telegram MainBar (крестик ✕) */}
        <div
          className="flex items-center justify-between"
          style={{ paddingRight: viewportWidth < 768 ? 56 : 0 }}
        >
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Товары{' '}
            {products.length > 0 && (
              <span style={{ color: 'rgba(255,255,255,0.40)', fontWeight: 400 }}>
                ({filtered.length}{activeCat ? `/${products.length}` : ''})
              </span>
            )}
          </h1>
          <Button onClick={() => navigate('/seller/products/add')} style={{ fontSize: 13, padding: '6px 14px' }}>
            + Добавить
          </Button>
        </div>

        {/* Category filter — WB/Uzum style horizontal chips */}
        {!loading && categories.length > 0 && (
          <div className="scroll-fade-x">
            <div
              className="flex gap-2 overflow-x-auto scroll-snap-x pb-0.5"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {/* "Все" chip */}
              <button
                onClick={() => setActiveCat('')}
                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${!activeCat ? 'chip-active' : ''}`}
                style={activeCat ? {
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: 'rgba(255,255,255,0.50)',
                } : undefined}
              >
                Все
              </button>
              {categories.map((cat) => {
                const active = activeCat === cat.id;
                const count = products.filter((p) => p.storeCategoryId === cat.id).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCat(active ? '' : cat.id)}
                    className={`shrink-0 flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${active ? 'chip-active' : ''}`}
                    style={!active ? {
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.10)',
                      color: 'rgba(255,255,255,0.50)',
                    } : undefined}
                  >
                    {cat.name}
                    {count > 0 && (
                      <span
                        className="text-[10px] font-bold px-1 rounded-full"
                        style={{
                          background: active ? 'rgba(168,85,247,0.32)' : 'rgba(255,255,255,0.08)',
                          color: active ? '#F3E8FF' : 'rgba(255,255,255,0.35)',
                        }}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-10"><Spinner size={32} /></div>
        )}

        {!loading && error && (
          <GlassCard className="p-4 text-center">
            <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 14 }}>{error}</p>
            <Button variant="ghost" className="mt-3" onClick={() => load(abortRef.current?.signal)}>Повторить</Button>
          </GlassCard>
        )}

        {!loading && !error && products.length === 0 && (
          <GlassCard className="p-8 flex flex-col items-center gap-3">
            <span style={{ fontSize: 40 }}>📦</span>
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 14, textAlign: 'center' }}>
              Товаров пока нет.<br />Добавьте первый!
            </p>
            <Button onClick={() => navigate('/seller/products/add')}>+ Добавить товар</Button>
          </GlassCard>
        )}

        {!loading && !error && products.length > 0 && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <span style={{ fontSize: 36 }}>🏷️</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              В этой категории нет товаров
            </p>
          </div>
        )}

        {!loading && filtered.length > 0 && gridCols && (
          <div className={`grid ${gridCols} gap-3`}>
            {filtered.map((product) => {
              const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
              const thumbUrl = primaryImage ? getImageUrl(primaryImage.media.objectKey) : '';
              return (
                <GlassCard
                  key={product.id}
                  className="p-3 flex flex-col gap-2 cursor-pointer active:opacity-70"
                  onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                  onPointerEnter={() => {
                    prefetch(`/seller/products/${product.id}`);
                    prefetch(`/seller/products/${product.id}/attributes`);
                  }}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden relative"
                    style={{ background: 'rgba(167,139,250,0.10)', border: '1px solid rgba(167,139,250,0.18)' }}>
                    <ProductImage src={thumbUrl} alt={product.title} emptyVariant="no-photo" />
                    {typeof product.totalStock === 'number' && product.totalStock <= 0 && (
                      <div style={{ position: 'absolute', left: 6, top: 6, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(239,68,68,0.92)', color: '#fff', letterSpacing: 0.3 }}>
                        НЕТ В НАЛИЧИИ
                      </div>
                    )}
                    {typeof product.totalStock === 'number' && product.totalStock > 0 && product.totalStock <= 5 && (
                      <div style={{ position: 'absolute', left: 6, top: 6, fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 6, background: 'rgba(251,191,36,0.92)', color: '#1a1208', letterSpacing: 0.3 }}>
                        ОСТАЛОСЬ {product.totalStock}
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold" style={{
                    color: 'rgba(255,255,255,0.92)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {product.title}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold" style={{ color: '#A855F7' }}>{price(product)}</p>
                    <Badge status={product.status} />
                  </div>
                  {typeof product.totalStock === 'number' && (
                    <p className="text-[10px]" style={{ color: product.totalStock <= 0 ? 'rgba(239,68,68,0.85)' : product.totalStock <= 5 ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.40)' }}>
                      {product.totalStock <= 0 ? '⛔ Нет в наличии' : `📦 Остаток: ${product.totalStock} шт`}
                    </p>
                  )}
                  <div className="flex items-center gap-1.5 mt-auto pt-1">
                    {product.status !== 'HIDDEN_BY_ADMIN' && product.status !== 'ARCHIVED' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(product); }}
                        disabled={togglingId === product.id}
                        title={product.status === 'ACTIVE' ? 'Снять с публикации' : 'Опубликовать'}
                        style={{
                          flex: 1, height: 32, borderRadius: 10, border: 'none',
                          background: product.status === 'ACTIVE' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                          color: product.status === 'ACTIVE' ? '#f87171' : '#34d399',
                          fontSize: 13, fontWeight: 600,
                          cursor: togglingId === product.id ? 'wait' : 'pointer',
                        }}
                      >
                        {togglingId === product.id ? '…' : product.status === 'ACTIVE' ? '⏸ Скрыть' : '▶ Опубл.'}
                      </button>
                    )}
                    {(product.status === 'ACTIVE' || product.status === 'DRAFT') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); archiveProduct(product); }}
                        disabled={togglingId === product.id}
                        title="Архивировать"
                        style={{
                          width: 32, height: 32, borderRadius: 10, border: 'none',
                          background: 'rgba(251,191,36,0.15)',
                          color: '#fbbf24', fontSize: 13,
                          cursor: togglingId === product.id ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >📥</button>
                    )}
                    {product.status !== 'ACTIVE' && product.status !== 'HIDDEN_BY_ADMIN' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); deleteProduct(product); }}
                        disabled={togglingId === product.id}
                        title="Удалить навсегда"
                        style={{
                          width: 32, height: 32, borderRadius: 10, border: 'none',
                          background: 'rgba(248,113,113,0.15)',
                          color: '#f87171', fontSize: 13,
                          cursor: togglingId === product.id ? 'wait' : 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >🗑</button>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}

        {!loading && filtered.length > 0 && !gridCols && filtered.map((product) => {
          const primaryImage = product.images?.find((img) => img.isPrimary) ?? product.images?.[0];
          const thumbUrl = primaryImage ? getImageUrl(primaryImage.media.objectKey) : '';
          return (
            <GlassCard
              key={product.id}
              className="p-4 flex items-center gap-3 cursor-pointer active:opacity-70"
              onClick={() => navigate(`/seller/products/${product.id}/edit`)}
              onPointerEnter={() => {
                prefetch(`/seller/products/${product.id}`);
                prefetch(`/seller/products/${product.id}/attributes`);
              }}
            >
              <div
                className="w-10 h-10 rounded-xl shrink-0 overflow-hidden"
                style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.20)' }}
              >
                <ProductImage src={thumbUrl} emptyVariant="thumbnail" hideLabel />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>
                  {product.title}
                </p>
                <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.80)' }}>
                  {price(product)}
                </p>
                {typeof product.totalStock === 'number' && (
                  <p className="text-[10px]" style={{ color: product.totalStock <= 0 ? 'rgba(239,68,68,0.85)' : product.totalStock <= 5 ? 'rgba(251,191,36,0.85)' : 'rgba(255,255,255,0.40)' }}>
                    {product.totalStock <= 0 ? '⛔ Нет в наличии' : `📦 Остаток: ${product.totalStock} шт`}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <Badge status={product.status} />
                {product.status !== 'HIDDEN_BY_ADMIN' && product.status !== 'ARCHIVED' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleStatus(product); }}
                    disabled={togglingId === product.id}
                    title={product.status === 'ACTIVE' ? 'Снять с публикации' : 'Опубликовать'}
                    style={{
                      width: 32, height: 32, borderRadius: 10, border: 'none',
                      background: product.status === 'ACTIVE' ? 'rgba(248,113,113,0.15)' : 'rgba(52,211,153,0.15)',
                      color: product.status === 'ACTIVE' ? '#f87171' : '#34d399',
                      fontSize: 14,
                      cursor: togglingId === product.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {togglingId === product.id ? '…' : product.status === 'ACTIVE' ? '⏸' : '▶'}
                  </button>
                )}
                {(product.status === 'ACTIVE' || product.status === 'DRAFT') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); archiveProduct(product); }}
                    disabled={togglingId === product.id}
                    title="Архивировать"
                    style={{
                      width: 32, height: 32, borderRadius: 10, border: 'none',
                      background: 'rgba(251,191,36,0.15)',
                      color: '#fbbf24', fontSize: 14,
                      cursor: togglingId === product.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    📥
                  </button>
                )}
                {product.status !== 'ACTIVE' && product.status !== 'HIDDEN_BY_ADMIN' && (
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteProduct(product); }}
                    disabled={togglingId === product.id}
                    title="Удалить навсегда"
                    style={{
                      width: 32, height: 32, borderRadius: 10, border: 'none',
                      background: 'rgba(248,113,113,0.15)',
                      color: '#f87171', fontSize: 14,
                      cursor: togglingId === product.id ? 'wait' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    🗑
                  </button>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>
    
  );
}
