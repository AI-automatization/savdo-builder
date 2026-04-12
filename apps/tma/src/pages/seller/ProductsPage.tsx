import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';

interface Product {
  id: string;
  title: string;
  basePrice: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';
  description: string | null;
}

interface ProductsResponse {
  data: Product[];
  meta: { total: number; page: number; limit: number };
}

export default function SellerProductsPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    api<ProductsResponse>('/seller/products?limit=50')
      .then((r) => setProducts(r.data))
      .catch(() => setError('Не удалось загрузить товары'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate('/seller'));
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(() => navigate('/seller')); };
  }, [load, navigate, tg]);

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

  const price = (p: Product) =>
    `${Number(p.basePrice).toLocaleString('ru')} сум`;

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
            Товары {products.length > 0 && <span style={{ color: 'rgba(255,255,255,0.40)', fontWeight: 400 }}>({products.length})</span>}
          </h1>
          <Button onClick={() => navigate('/seller/products/add')} style={{ fontSize: 13, padding: '6px 14px' }}>
            + Добавить
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center py-10"><Spinner size={32} /></div>
        )}

        {!loading && error && (
          <GlassCard className="p-4 text-center">
            <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 14 }}>{error}</p>
            <Button variant="ghost" className="mt-3" onClick={load}>Повторить</Button>
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

        {!loading && products.map((product) => (
          <GlassCard key={product.id} className="p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'rgba(167,139,250,0.15)', border: '1px solid rgba(167,139,250,0.20)' }}
            >
              🛍
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>
                {product.title}
              </p>
              <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.80)' }}>
                {price(product)}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Badge status={product.status} />
              {/* Edit button */}
              <button
                onClick={() => navigate(`/seller/products/${product.id}/edit`)}
                title="Редактировать"
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  border: 'none',
                  background: 'rgba(167,139,250,0.12)',
                  color: '#A78BFA',
                  fontSize: 15,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✏️
              </button>
              {product.status !== 'HIDDEN_BY_ADMIN' && product.status !== 'ARCHIVED' && (
                <button
                  onClick={() => toggleStatus(product)}
                  disabled={togglingId === product.id}
                  title={product.status === 'ACTIVE' ? 'Снять с публикации' : 'Опубликовать'}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: 'none',
                    background: product.status === 'ACTIVE'
                      ? 'rgba(248,113,113,0.15)'
                      : 'rgba(52,211,153,0.15)',
                    color: product.status === 'ACTIVE' ? '#f87171' : '#34d399',
                    fontSize: 16,
                    cursor: togglingId === product.id ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {togglingId === product.id ? '…' : product.status === 'ACTIVE' ? '⏸' : '▶'}
                </button>
              )}
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
