import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { showToast } from '@/components/ui/Toast';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { ProductImage } from '@/components/ui/ProductImage';
import { WishlistButton } from '@/components/ui/WishlistButton';
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

type ProductDisplayType = 'SLIDER' | 'SINGLE' | 'COLLAGE_2X2';

interface Product {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  basePrice: number;
  mediaUrls: string[];
  displayType?: ProductDisplayType;
  variants?: VariantMin[];
  optionGroups?: OptionGroupMin[];
  attributes?: ProductAttribute[];
  store?: { name: string; slug: string };
  globalCategory?: { id: string; nameRu: string } | null;
}

export default function ProductPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>();
  const navigate = useNavigate();
  const { tg, viewportWidth } = useTelegram();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [selection, setSelection] = useState<OptionSelection>({});
  const [contacting, setContacting] = useState(false);
  const trackedRef = useRef<string | null>(null);
  const touchStartX = useRef<number | null>(null);

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

  const handleContactSeller = useCallback(async () => {
    if (!product || contacting) return;
    setContacting(true);
    try {
      await api('/chat/threads', {
        method: 'POST',
        body: {
          contextType: 'PRODUCT',
          contextId: product.id,
          firstMessage: `Хочу уточнить по товару «${product.title}»`,
        },
      });
      navigate('/buyer/chat');
    } catch {
      showToast('❌ Не удалось открыть чат', 'error');
    } finally {
      setContacting(false);
    }
  }, [product, contacting, navigate]);

  const canAddToCart = !!product && !requiresVariantSelection && !isOutOfStock;

  const addToCart = useCallback(() => {
    if (!product || !canAddToCart) return;
    tg?.HapticFeedback.impactOccurred('light');

    let cart = getCart();

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
    showToast('✅ Добавлено в корзину');
    track.addToCart(product.storeId, product.id, variantId ?? null, 1);
    navigate('/buyer/cart');
  }, [product, canAddToCart, selectedVariant?.id, unitPrice, slug, tg, navigate]);

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
  }, [tg, product, addToCart, selectedVariant?.id, unitPrice, requiresVariantSelection, isOutOfStock, canAddToCart]);

  if (loading) {
    return (
      
        <div className="flex justify-center py-10"><Spinner size={32} /></div>
      
    );
  }

  if (error || !product) {
    return (
      
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 40 }}>😕</span>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14 }}>Товар не найден</p>
          <button onClick={() => navigate(-1)} style={{ color: '#A855F7', fontSize: 14 }}>← Назад</button>
        </div>
      
    );
  }

  const images = product.mediaUrls ?? [];
  const displayType = product.displayType ?? 'SLIDER';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || images.length <= 1) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) {
      setActiveImage((prev) =>
        dx < 0
          ? Math.min(prev + 1, images.length - 1)
          : Math.max(prev - 1, 0),
      );
    }
    touchStartX.current = null;
  };

  const isWide = (viewportWidth ?? 0) >= 1024;
  const galleryAspect = isWide ? '1' : (viewportWidth >= 560 ? '4/3' : '1');

  const galleryNode = (
    displayType === 'COLLAGE_2X2' && images.length >= 2 ? (
      <div
        className="grid grid-cols-2 gap-1 rounded-2xl overflow-hidden"
        style={{ aspectRatio: '1' }}
        onClick={() => setActiveImage(0)}
      >
        {images.slice(0, 4).map((url, idx) => (
          <div key={idx} className="relative overflow-hidden bg-white/5">
            <img src={url} alt="" className="w-full h-full object-cover" style={{ aspectRatio: '1' }} />
          </div>
        ))}
      </div>
    ) : (
      <div
        className="rounded-2xl overflow-hidden relative"
        style={{ ...glass, aspectRatio: galleryAspect }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <ProductImage
          src={images[activeImage]}
          alt={product.title}
          emptyVariant="no-photo"
          imgStyle={{ userSelect: 'none' }}
        />

        {/* Dot indicators */}
        {displayType !== 'SINGLE' && images.length > 1 && (
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5 pointer-events-none">
            {images.map((_, idx) => (
              <span
                key={idx}
                style={{
                  width: idx === activeImage ? 16 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: idx === activeImage ? '#A855F7' : 'rgba(255,255,255,0.40)',
                  transition: 'width 0.2s ease, background 0.2s ease',
                }}
              />
            ))}
          </div>
        )}

        {/* Desktop thumbnail strip — click to switch image */}
        {isWide && images.length > 1 && displayType !== 'SINGLE' && (
          <div
            className="absolute left-2 bottom-2 right-2 flex gap-2 overflow-x-auto pointer-events-auto"
            style={{ scrollbarWidth: 'none' }}
          >
            {images.map((url, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); setActiveImage(idx); }}
                style={{
                  flexShrink: 0,
                  width: 56, height: 56, borderRadius: 10, overflow: 'hidden',
                  border: idx === activeImage ? '2px solid #A855F7' : '2px solid rgba(255,255,255,0.20)',
                  background: 'rgba(0,0,0,0.45)',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s ease, transform 0.12s ease',
                }}
              >
                <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    )
  );

  return (

      <div
        className={isWide ? 'grid gap-8 pb-24' : 'flex flex-col gap-4 pb-24'}
        style={isWide ? { gridTemplateColumns: '5fr 4fr', alignItems: 'start' } : undefined}
      >
        {/* Gallery — sticky on desktop */}
        <div style={isWide ? { position: 'sticky', top: 16 } : undefined}>
          {galleryNode}
        </div>

        {/* Info column */}
        <div className="flex flex-col gap-4">
        {/* Info */}
        <div className="flex flex-col gap-2">
          <div className="flex items-start gap-3">
            <h1 className="text-lg font-bold flex-1 min-w-0" style={{ color: 'rgba(255,255,255,0.92)' }}>
              {product.title}
            </h1>
            <WishlistButton productId={product.id} variant="page" />
          </div>
          {product.globalCategory && (
            <span className="self-start text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: 'rgba(167,139,250,0.12)', color: '#A855F7', border: '1px solid rgba(167,139,250,0.25)' }}>
              {product.globalCategory.nameRu}
            </span>
          )}
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

        {/* Contact seller */}
        <button
          onClick={handleContactSeller}
          disabled={contacting}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm font-semibold disabled:opacity-50"
          style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.70)' }}
        >
          💬 {contacting ? 'Открываем чат...' : 'Задать вопрос продавцу'}
        </button>
        </div>
      </div>

  );
}
