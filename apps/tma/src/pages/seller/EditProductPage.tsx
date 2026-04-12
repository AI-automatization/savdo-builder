import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, getToken } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

interface Product {
  id: string;
  title: string;
  description: string | null;
  basePrice: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED' | 'HIDDEN_BY_ADMIN';
}

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [product, setProduct] = useState<Product | null>(null);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');

  const [saving, setSaving] = useState(false);
  const [statusChanging, setStatusChanging] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setLoadError('');
    try {
      const p = await api<Product>(`/seller/products/${id}`);
      setProduct(p);
      setTitle(p.title);
      setDescription(p.description ?? '');
      setPrice(String(p.basePrice));
    } catch {
      setLoadError('Не удалось загрузить товар');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
    tg?.BackButton.show();
    const goBack = () => navigate('/seller/products');
    tg?.BackButton.onClick(goBack);
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(goBack); };
  }, [load, navigate, tg]);

  const inputStyle = {
    ...glass,
    background: 'rgba(255,255,255,0.05)',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    width: '100%',
    padding: '12px 16px',
    borderRadius: 12,
  } as const;

  const isValid = title.trim().length >= 2 && Number(price) > 0;

  const handleSave = async () => {
    if (!isValid || !id) return;
    setSaving(true);
    setError('');
    try {
      await api(`/seller/products/${id}`, {
        method: 'PATCH',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
        },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Сохранено');
      setProduct((prev) => prev ? { ...prev, title: title.trim(), description: description.trim() || null, basePrice: Number(price) } : prev);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка сохранения';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: 'DRAFT' | 'ACTIVE' | 'ARCHIVED') => {
    if (!id) return;
    setStatusChanging(true);
    setError('');
    try {
      await api(`/seller/products/${id}/status`, {
        method: 'PATCH',
        body: { status: newStatus },
      });
      tg?.HapticFeedback.notificationOccurred('success');
      setProduct((prev) => prev ? { ...prev, status: newStatus } : prev);
      showToast(
        newStatus === 'ARCHIVED' ? '📦 Товар архивирован'
        : newStatus === 'ACTIVE' ? '✅ Товар опубликован'
        : '📝 Товар переведён в черновик',
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка смены статуса';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setStatusChanging(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    setDeleting(true);
    setError('');
    try {
      const token = getToken();
      const BASE = (import.meta.env.VITE_API_URL as string) ?? '';
      const res = await fetch(`${BASE}/api/v1/seller/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Ошибка удаления' }));
        throw new Error(err.message ?? 'Ошибка удаления');
      }
      tg?.HapticFeedback.notificationOccurred('success');
      navigate('/seller/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка удаления';
      setError(msg);
      setShowDeleteConfirm(false);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell role="SELLER">
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(52,211,153,0.15)',
            border: '1px solid rgba(52,211,153,0.30)',
            color: '#34d399',
            padding: '10px 20px',
            borderRadius: 12,
            fontSize: 14,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.70)',
            zIndex: 99,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '0 24px',
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              ...glass,
              background: 'rgba(20,10,40,0.95)',
              padding: 24,
              borderRadius: 20,
              width: '100%',
              maxWidth: 340,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-base font-bold mb-2" style={{ color: 'rgba(255,255,255,0.90)' }}>
              Удалить товар?
            </p>
            <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.50)' }}>
              «{product?.title}» будет удалён без возможности восстановления.
            </p>
            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Отмена
              </Button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: '1px solid rgba(248,113,113,0.30)',
                  background: 'rgba(248,113,113,0.12)',
                  color: '#f87171',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: deleting ? 'wait' : 'pointer',
                }}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Редактировать товар
        </h1>

        {loading && (
          <div className="flex justify-center py-10"><Spinner size={32} /></div>
        )}

        {!loading && loadError && (
          <GlassCard className="p-4 text-center">
            <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 14 }}>{loadError}</p>
            <Button variant="ghost" className="mt-3" onClick={load}>Повторить</Button>
          </GlassCard>
        )}

        {!loading && !loadError && product && (
          <>
            <GlassCard className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Название *
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название товара"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Цена (сум) *
                </label>
                <input
                  type="number"
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="50000"
                  style={inputStyle}
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  Описание
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Краткое описание товара"
                  rows={3}
                  style={{ ...inputStyle, resize: 'none' }}
                />
              </div>

              {error && (
                <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 13 }}>{error}</p>
              )}
            </GlassCard>

            <Button
              onClick={handleSave}
              disabled={!isValid || saving}
              className="w-full"
            >
              {saving ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>

            {/* Divider */}
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '4px 0' }} />

            {/* Status actions */}
            {product.status !== 'HIDDEN_BY_ADMIN' && (
              <div className="flex flex-col gap-2">
                {product.status === 'ACTIVE' && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={statusChanging}
                    onClick={() => handleStatusChange('ARCHIVED')}
                  >
                    {statusChanging ? '...' : '📦 Архивировать'}
                  </Button>
                )}
                {product.status === 'DRAFT' && (
                  <>
                    <Button
                      className="w-full"
                      disabled={statusChanging}
                      onClick={() => handleStatusChange('ACTIVE')}
                    >
                      {statusChanging ? '...' : '▶ Опубликовать'}
                    </Button>
                  </>
                )}
                {product.status === 'ARCHIVED' && (
                  <Button
                    variant="ghost"
                    className="w-full"
                    disabled={statusChanging}
                    onClick={() => handleStatusChange('DRAFT')}
                  >
                    {statusChanging ? '...' : '📝 Восстановить в черновик'}
                  </Button>
                )}
              </div>
            )}

            {/* Delete — only for DRAFT or ARCHIVED */}
            {(product.status === 'DRAFT' || product.status === 'ARCHIVED') && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(248,113,113,0.25)',
                  color: 'rgba(248,113,113,0.70)',
                  fontSize: 14,
                  fontWeight: 500,
                  padding: '12px 0',
                  borderRadius: 12,
                  cursor: 'pointer',
                  width: '100%',
                }}
              >
                Удалить товар
              </button>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}
