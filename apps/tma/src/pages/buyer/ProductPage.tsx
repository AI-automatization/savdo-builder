import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { track } from '@/lib/analytics';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

interface Variant {
  id: string;
  titleOverride: string | null;
  priceOverride: number | null;
  stockQuantity: number;
}

interface Product {
  id: string;
  storeId: string;
  title: string;
  description: string | null;
  basePrice: number;
  mediaUrls: string[];
  variants?: Variant[];
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
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);
  const trackedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!slug || !id) return;
    api<Product>(`/stores/${slug}/products/${id}`)
      .then((p) => {
        setProduct(p);
        if (trackedRef.current !== p.id) {
          trackedRef.current = p.id;
          track.productViewed(p.storeId, p.id);
        }
        if (p.variants?.length) setSelectedVariant(p.variants[0].id);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [slug, id]);

  const unitPrice = (() => {
    if (!product) return 0;
    if (selectedVariant && product.variants) {
      const v = product.variants.find((x) => x.id === selectedVariant);
      if (v?.priceOverride != null) return Number(v.priceOverride);
    }
    return Number(product.basePrice);
  })();

  const addToCart = () => {
    if (!product) return;
    tg?.HapticFeedback.impactOccurred('light');
    let cart: Array<{ productId: string; title: string; price: number; qty: number; storeId: string; storeSlug: string; storeName: string }>;
    try {
      cart = JSON.parse(localStorage.getItem('savdo_cart') ?? '[]');
    } catch {
      cart = [];
    }
    const existing = cart.find((i) => i.productId === product.id);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        productId: product.id,
        title: product.title,
        price: unitPrice,
        qty: 1,
        storeId: product.storeId,
        storeSlug: slug!,
        storeName: product.store?.name ?? '',
      });
    }
    localStorage.setItem('savdo_cart', JSON.stringify(cart));
    tg?.HapticFeedback.notificationOccurred('success');
    track.addToCart(product.storeId, product.id, selectedVariant, 1);
    navigate('/buyer/cart');
  };

  useEffect(() => {
    if (!tg || !product) return;
    tg.MainButton.setText(`В корзину — ${unitPrice.toLocaleString('ru')} сум`);
    tg.MainButton.show();
    tg.MainButton.onClick(addToCart);
    return () => {
      tg.MainButton.offClick(addToCart);
      tg.MainButton.hide();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tg, product, selectedVariant, unitPrice]);

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
          <button onClick={() => navigate(-1)} style={{ color: '#A78BFA', fontSize: 14 }}>← Назад</button>
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
                  border: idx === activeImage ? '2px solid #A78BFA' : '1px solid rgba(255,255,255,0.10)',
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
          <p className="text-xl font-bold" style={{ color: '#A78BFA' }}>
            {unitPrice.toLocaleString('ru')} сум
          </p>
        </div>

        {/* Variants */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Вариант
            </p>
            <div className="flex flex-wrap gap-2">
              {product.variants.map((v) => {
                const active = v.id === selectedVariant;
                const disabled = v.stockQuantity <= 0;
                return (
                  <button
                    key={v.id}
                    disabled={disabled}
                    onClick={() => setSelectedVariant(v.id)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-40"
                    style={{
                      background: active ? 'rgba(167,139,250,0.25)' : 'rgba(255,255,255,0.05)',
                      border: active ? '1px solid rgba(167,139,250,0.45)' : '1px solid rgba(255,255,255,0.10)',
                      color: active ? '#A78BFA' : 'rgba(255,255,255,0.70)',
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
