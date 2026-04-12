import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { glass } from '@/lib/styles';

export default function AddProductPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    tg?.BackButton.show();
    tg?.BackButton.onClick(() => navigate('/seller/products'));
    return () => { tg?.BackButton.hide(); tg?.BackButton.offClick(() => navigate('/seller/products')); };
  }, [navigate, tg]);

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

  const handleSave = async (publish: boolean) => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      const product = await api<{ id: string }>('/seller/products', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
        },
      });

      if (publish) {
        await api(`/seller/products/${product.id}/status`, {
          method: 'PATCH',
          body: { status: 'ACTIVE' },
        });
      }

      tg?.HapticFeedback.notificationOccurred('success');
      navigate('/seller/products');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Ошибка при создании товара';
      setError(msg);
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>
          Новый товар
        </h1>

        <GlassCard className="p-4 flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Название *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Футболка белая"
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

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => handleSave(true)}
            disabled={!isValid || saving}
            className="w-full"
          >
            {saving ? 'Сохранение...' : '▶ Создать и опубликовать'}
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleSave(false)}
            disabled={!isValid || saving}
            className="w-full"
          >
            Создать как черновик
          </Button>
        </div>

        <p className="text-center text-[11px]" style={{ color: 'rgba(255,255,255,0.25)' }}>
          При публикации товар автоматически появится в привязанном Telegram-канале
        </p>
      </div>
    </AppShell>
  );
}
