import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { glass } from '@/lib/styles';

interface SizeRow {
  label: string; // S, M, L, XL …
  stock: number;
}

function slugify(text: string) {
  return text.trim().toUpperCase().replace(/[^A-ZА-ЯЁ0-9]/gi, '-').slice(0, 20);
}

export default function AddProductPage() {
  const navigate = useNavigate();
  const { tg } = useTelegram();

  const [title, setTitle]           = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice]           = useState('');
  const [stock, setStock]           = useState('0');

  // Размеры
  const [hasSizes, setHasSizes]     = useState(false);
  const [sizes, setSizes]           = useState<SizeRow[]>([
    { label: 'S', stock: 0 },
    { label: 'M', stock: 0 },
    { label: 'L', stock: 0 },
  ]);
  const [sizeInput, setSizeInput]   = useState('');

  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

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

  const isValid = title.trim().length >= 2 && Number(price) > 0 &&
    (!hasSizes || sizes.length > 0);

  const addSize = () => {
    const label = sizeInput.trim().toUpperCase();
    if (!label) return;
    if (sizes.find((s) => s.label === label)) return;
    setSizes((prev) => [...prev, { label, stock: 0 }]);
    setSizeInput('');
  };

  const removeSize = (label: string) => {
    setSizes((prev) => prev.filter((s) => s.label !== label));
  };

  const updateSizeStock = (label: string, val: string) => {
    setSizes((prev) =>
      prev.map((s) => s.label === label ? { ...s, stock: Math.max(0, Number(val) || 0) } : s),
    );
  };

  const handleSave = async (publish: boolean) => {
    if (!isValid) return;
    setSaving(true);
    setError('');
    try {
      // 1. Создать товар
      const product = await api<{ id: string }>('/seller/products', {
        method: 'POST',
        body: {
          title: title.trim(),
          description: description.trim() || null,
          basePrice: Number(price),
        },
      });
      const pid = product.id;
      const sku = slugify(title);

      if (hasSizes && sizes.length > 0) {
        // 2а. Создать группу "Размер"
        const group = await api<{ id: string }>(`/seller/products/${pid}/option-groups`, {
          method: 'POST',
          body: { name: 'Размер', code: 'size', sortOrder: 0 },
        });
        const gid = group.id;

        // 2б. Создать значения и варианты
        for (let i = 0; i < sizes.length; i++) {
          const sz = sizes[i];
          const val = await api<{ id: string }>(`/seller/products/${pid}/option-groups/${gid}/values`, {
            method: 'POST',
            body: { value: sz.label, code: sz.label, sortOrder: i },
          });
          await api(`/seller/products/${pid}/variants`, {
            method: 'POST',
            body: {
              sku: `${sku}-${sz.label}`,
              stockQuantity: sz.stock,
              optionValueIds: [val.id],
            },
          });
        }
      } else {
        // 2б. Простой вариант без размеров
        await api(`/seller/products/${pid}/variants`, {
          method: 'POST',
          body: { sku, stockQuantity: Math.max(0, Number(stock) || 0) },
        });
      }

      // 3. Публикация
      if (publish) {
        await api(`/seller/products/${pid}/status`, {
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

        {/* Основная информация */}
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
        </GlassCard>

        {/* Остаток / размеры */}
        <GlassCard className="p-4 flex flex-col gap-4">
          {/* Переключатель размеров */}
          <button
            onClick={() => setHasSizes((v) => !v)}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-semibold text-left" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Товар с размерами
              </p>
              <p className="text-[11px] text-left" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {hasSizes ? 'Задать остаток по каждому размеру' : 'S / M / L / XL и т.д.'}
              </p>
            </div>
            <div
              style={{
                width: 42,
                height: 24,
                borderRadius: 12,
                background: hasSizes ? '#7C3AED' : 'rgba(255,255,255,0.12)',
                position: 'relative',
                transition: 'background 0.2s',
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 3,
                  left: hasSizes ? 21 : 3,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#fff',
                  transition: 'left 0.2s',
                }}
              />
            </div>
          </button>

          {hasSizes ? (
            <div className="flex flex-col gap-3">
              {/* Существующие размеры */}
              {sizes.map((sz) => (
                <div key={sz.label} className="flex items-center gap-2">
                  <div
                    className="flex items-center justify-center text-xs font-bold shrink-0"
                    style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: 'rgba(167,139,250,0.15)',
                      border: '1px solid rgba(167,139,250,0.25)',
                      color: '#A78BFA',
                    }}
                  >
                    {sz.label}
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    value={sz.stock}
                    onChange={(e) => updateSizeStock(sz.label, e.target.value)}
                    placeholder="0"
                    style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                  />
                  <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.30)' }}>шт</span>
                  <button
                    onClick={() => removeSize(sz.label)}
                    style={{ color: 'rgba(248,113,113,0.60)', fontSize: 16, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Добавить размер */}
              <div className="flex gap-2">
                <input
                  value={sizeInput}
                  onChange={(e) => setSizeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSize()}
                  placeholder="XL / 42 / One size"
                  style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: 13 }}
                />
                <button
                  onClick={addSize}
                  disabled={!sizeInput.trim()}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    border: '1px solid rgba(167,139,250,0.30)',
                    background: 'rgba(167,139,250,0.12)',
                    color: '#A78BFA',
                    fontSize: 13,
                    cursor: sizeInput.trim() ? 'pointer' : 'not-allowed',
                    opacity: sizeInput.trim() ? 1 : 0.5,
                    flexShrink: 0,
                  }}
                >
                  + Добавить
                </button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Количество в наличии
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="0"
                  style={{ ...inputStyle, flex: 1 }}
                />
                <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }}>шт</span>
              </div>
            </div>
          )}
        </GlassCard>

        {error && (
          <p style={{ color: 'rgba(248,113,113,0.85)', fontSize: 13, textAlign: 'center' }}>{error}</p>
        )}

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
