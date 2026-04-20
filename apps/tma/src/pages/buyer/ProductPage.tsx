import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';
import {
  findVariantBySelection,
  initialSelectionFromVariants,
  isSelectionComplete,
  isValueAvailable,
  type OptionGroupMin,
  type OptionSelection,
  type VariantMin,
} from '@/lib/variants';
import { getCart, saveCart, isSameStore } from '@/lib/cart';

interface ProductAttribute {
  id: string;
  name: string;
  value: string;
}

interface Product {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  basePrice: number;
  mediaUrls: string[];
  variants?: VariantMin[];
  optionGroups?: OptionGroupMin[];
  attributes?: ProductAttribute[];
  store?: { name: string; slug: string };
}

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const { tg } = useTelegram();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selection, setSelection] = useState<OptionSelection>({});
  const trackedRef = useRef<string | null>(null);

  const activeVariants = product?.variants?.filter((v) => v.isActive !== false) ?? [];
  const optionGroups   = product?.optionGroups ?? [];
  const hasGroups      = optionGroups.length > 0;

  useEffect(() => {
    if (!slug || !id) return;
    api<Product>(`/stores/${slug}/products/${id}`)
      .then((p) => {
        setProduct(p);
        if (trackedRef.current !== p.id) {
          trackedRef.current = p.id;
          track.productViewed(p.storeId, p.id);
        }
        const groups = p.optionGroups ?? [];
        const variants = p.variants ?? [];
        if (groups.length > 0) {
          setSelection(initialSelectionFromVariants(variants, groups));
        } else if (variants.length > 0) {
          const firstInStock = variants.find((v) => v.stockQuantity > 0);
          setSelectedVariantId(firstInStock?.id ?? null);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, id]);

  const selectedVariant = hasGroups
    ? findVariantBySelection(activeVariants, selection, optionGroups)
    : activeVariants.find((v) => v.id === selectedVariantId) ?? null;

  const unitPrice = selectedVariant?.priceOverride != null
    ? Number(selectedVariant.priceOverride)
    : Number(product?.basePrice ?? 0);

  const requiresVariantSelection = hasGroups
    ? !isSelectionComplete(selection, optionGroups)
    : (activeVariants.length > 0 && !selectedVariantId);

  const isOutOfStock = selectedVariant
    ? selectedVariant.stockQuantity <= 0
    : (activeVariants.length > 0 && activeVariants.every((v) => v.stockQuantity <= 0));

  function handleOptionSelect(groupId: string, valueId: string) {
    setSelection((prev) => ({ ...prev, [groupId]: valueId }));
  }

  const canAddToCart = !!product && !requiresVariantSelection && !isOutOfStock;

  const addToCart = () => {
    if (!product || !canAddToCart) return;
    tg?.HapticFeedback.impactOccurred('light');

    let cart = getCart();

    // If cart has items from a different store — clear it first (INV-C01)
    if (!isSameStore(cart, product.storeId)) {
      cart = [];
    }

    const variantId = selectedVariant?.id;
    const existing = cart.find(
      (i) => i.productId === product.id && i.variantId === variantId,
    );

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        productId: product.id,
        variantId,
        title: product.title,
        price: unitPrice,
        qty: 1,
        storeId: product.storeId,
        storeSlug: slug!,
        storeName: product.store?.name ?? '',
      });
    }

    saveCart(cart);
    tg?.HapticFeedback.notificationOccurred('success');
    track.addToCart(product.storeId, product.id, variantId ?? null, 1);
    navigate('/buyer/cart');
  };

  useEffect(() => {
    if (!tg || !product) return;

    const label = requiresVariantSelection
      ? 'Выберите вариант'
      : isOutOfStock
      ? 'Нет в наличии'
      : `В корзину — ${unitPrice.toLocaleString('ru')} сум`;

    tg.MainButton.setText(label);
    tg.MainButton.show();

    if (canAddToCart) {
      tg.MainButton.enable?.();
      tg.MainButton.onClick(addToCart);
      return () => {
        tg.MainButton.offClick(addToCart);
        tg.MainButton.hide();
      };
    } else {
      tg.MainButton.disable?.();
      return () => {
        tg.MainButton.hide();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, product, selectedVariant?.id, unitPrice, requiresVariantSelection, isOutOfStock, canAddToCart]);

  if (loading) {
    return (
      <AppShell role="BUYER">
        <div className="flex justify-center py-10"><Spinner size={32} /></div>
      </AppShell>
    );
  }

  if (error || !product) {
    return (
      <AppShell role="BUYER">
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 40 }}>😕</span>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14 }}>Товар не найден</p>
          <button onClick={() => navigate(-1)} style={{ color: '#A855F7', fontSize: 14 }}>← Назад</button>
        </div>
      </AppShell>
    );
  }

  const images = product.mediaUrls ?? [];

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4 pb-24">
        {/* Gallery */}
        <div className="rounded-2xl overflow-hidden" style={{ ...glass, aspectRatio: '1' }}>
          {images.length ? (
            <img
              src={images[activeImage]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ fontSize: 48 }}>📦</div>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto -mx-1 px-1">
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImage(idx)}
                className="shrink-0 w-14 h-14 rounded-lg overflow-hidden"
                style={{
                  border: idx === activeImage ? '2px solid #A855F7' : '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <img src={url} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}

        {/* Info */}
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-bold" style={{ color: 'rgba(255,255,255,0.92)' }}>
            {product.title}
          </h1>
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-xl font-bold" style={{ color: '#A855F7' }}>
              {unitPrice.toLocaleString('ru')} сум
            </p>
            {selectedVariant && !isOutOfStock && selectedVariant.stockQuantity <= 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(251,191,36,0.12)', color: '#fbbf24', border: '1px solid rgba(251,191,36,0.25)' }}>
                Осталось: {selectedVariant.stockQuantity} шт
              </span>
            )}
            {selectedVariant && !isOutOfStock && selectedVariant.stockQuantity > 5 && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(34,197,94,0.10)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.20)' }}>
                В наличии: {selectedVariant.stockQuantity} шт
              </span>
            )}
            {isOutOfStock && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: 'rgba(239,68,68,0.10)', color: 'rgba(239,68,68,0.80)', border: '1px solid rgba(239,68,68,0.20)' }}>
                Нет в наличии
              </span>
            )}
          </div>
        </div>

        {/* Variant options (grouped) */}
        {hasGroups && (
          <div className="flex flex-col gap-4">
            {optionGroups.map((g) => (
              <div key={g.id} className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {g.name}
                </p>
                <div className="flex flex-wrap gap-2">
                  {g.values.map((val) => {
                    const isSel = selection[g.id] === val.id;
                    const avail = isValueAvailable(val.id, g.id, activeVariants, selection);
                    return (
                      <button
                        key={val.id}
                        disabled={!avail}
                        onClick={() => handleOptionSelect(g.id, val.id)}
                        className="px-3.5 py-1.5 rounded-lg text-sm font-semibold disabled:opacity-40"
                        style={{
                          background: isSel ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)',
                          border:     isSel ? '1px solid rgba(167,139,250,0.45)' : '1px solid rgba(255,255,255,0.10)',
                          color:      isSel ? '#A855F7' : 'rgba(255,255,255,0.75)',
                          textDecoration: avail ? undefined : 'line-through',
                          cursor:     avail ? 'pointer' : 'not-allowed',
                        }}
                      >
                        {val.value}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {selectedVariant && isOutOfStock && (
              <p className="text-xs" style={{ color: '#fbbf24' }}>
                Эта комбинация временно недоступна
              </p>
            )}
          </div>
        )}

        {/* Fallback: flat variants when product has no option groups */}
        {!hasGroups && activeVariants.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Вариант
            </p>
            <div className="flex flex-wrap gap-2">
              {activeVariants.map((v) => {
                const active = v.id === selectedVariantId;
                const disabled = v.stockQuantity <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={disabled}
                    onClick={() => setSelectedVariantId(v.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                    style={{
                      background: active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)',
                      border: active ? '1px solid rgba(167,139,250,0.45)' : '1px solid rgba(255,255,255,0.10)',
                      color: active ? '#A855F7' : 'rgba(255,255,255,0.70)',
                    }}
                  >
                    {v.titleOverride ?? `#${v.id.slice(-4)}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        {product.description && (
          <GlassCard className="p-4">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Описание
            </p>
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'rgba(255,255,255,0.70)' }}>
              {product.description}
            </p>
          </GlassCard>
        )}

        {/* Attributes / Characteristics */}
        {(product.attributes ?? []).length > 0 && (
          <GlassCard className="p-4 flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Характеристики
            </p>
            {(product.attributes ?? []).map((a) => (
              <div key={a.id} className="flex items-baseline justify-between gap-2">
                <span className="text-xs shrink-0" style={{ color: 'rgba(255,255,255,0.40)' }}>{a.name}</span>
                <span className="flex-1 border-b border-dashed" style={{ borderColor: 'rgba(255,255,255,0.10)' }} />
                <span className="text-xs font-medium shrink-0" style={{ color: 'rgba(255,255,255,0.80)' }}>{a.value}</span>
              </div>
            ))}
          </GlassCard>
        )}

        {/* Store link */}
        {product.store && (
          <button
            onClick={() => navigate(`/buyer/store/${product.store!.slug}`)}
            className="flex items-center gap-2 px-4 py-3 rounded-2xl text-left"
            style={glass}
          >
            <span style={{ fontSize: 20 }}>🏪</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>Магазин</p>
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>
                {product.store.name}
              </p>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )}
      </div>
    </AppShell>
  );
}
