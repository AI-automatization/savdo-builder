'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Search, ShoppingBag, Store as StoreIcon } from 'lucide-react';
import { useStorefrontSearch } from '@/hooks/use-search';
import { colors } from '@/lib/styles';

const MIN_LEN = 2;

export default function HeaderSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data, isFetching } = useStorefrontSearch(query);

  // Click outside / Esc to close.
  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false);
        inputRef.current?.blur();
      }
    }
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function handleNavigate(href: string) {
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
    router.push(href);
  }

  const trimmed = query.trim();
  const tooShort = trimmed.length > 0 && trimmed.length < MIN_LEN;
  const hasQuery = trimmed.length >= MIN_LEN;
  const stores = data?.stores ?? [];
  const products = data?.products ?? [];
  const empty = hasQuery && !isFetching && stores.length === 0 && products.length === 0;
  const showDropdown = open && (tooShort || hasQuery);

  return (
    <div ref={wrapRef} className="relative flex-1">
      <div
        className="flex items-center gap-2 px-3 h-9"
        style={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '6px' }}
      >
        <Search size={14} style={{ color: colors.textDim }} className="flex-shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Поиск магазинов и товаров..."
          className="grow bg-transparent text-sm outline-none placeholder:opacity-60"
          style={{ color: colors.textBody }}
          aria-label="Поиск"
        />
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+6px)] rounded-md overflow-hidden flex flex-col"
          style={{
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 12px 32px rgba(0,0,0,0.18)',
            maxHeight: '70vh',
            zIndex: 50,
          }}
        >
          {tooShort && (
            <div className="px-4 py-3 text-xs" style={{ color: colors.textMuted }}>
              Введите минимум {MIN_LEN} символа
            </div>
          )}

          {hasQuery && isFetching && (stores.length === 0 && products.length === 0) && (
            <div className="px-4 py-3 text-xs" style={{ color: colors.textMuted }}>
              Ищем…
            </div>
          )}

          {empty && (
            <div className="px-4 py-6 text-xs text-center" style={{ color: colors.textMuted }}>
              Ничего не нашли по «{trimmed}»
            </div>
          )}

          <div className="overflow-y-auto">
            {stores.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5 text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
                  — Магазины · {stores.length}
                </div>
                {stores.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleNavigate(`/${s.slug}`)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
                  >
                    <div
                      className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                      style={{ background: colors.brandMuted, color: colors.brand }}
                    >
                      {s.logoUrl ? (
                        <Image src={s.logoUrl} alt={s.name} width={36} height={36} className="object-cover w-full h-full" unoptimized />
                      ) : (
                        <StoreIcon size={16} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold truncate" style={{ color: colors.textStrong }}>{s.name}</div>
                      {s.city && <div className="text-[11px] truncate" style={{ color: colors.textMuted }}>{s.city}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}

            {products.length > 0 && (
              <div>
                <div className="px-4 pt-3 pb-1.5 text-[10px] tracking-[0.18em] uppercase" style={{ color: colors.textMuted }}>
                  — Товары · {products.length}
                </div>
                {products.map((p) => {
                  const slug = p.store?.slug;
                  if (!slug) return null;
                  const img = p.images[0]?.url;
                  return (
                    <Link
                      key={p.id}
                      href={`/${slug}/products/${p.id}`}
                      onClick={() => { setOpen(false); setQuery(''); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-black/[0.03]"
                    >
                      <div
                        className="w-9 h-9 rounded-md flex items-center justify-center flex-shrink-0 overflow-hidden"
                        style={{ background: colors.surfaceSunken, color: colors.textMuted }}
                      >
                        {img ? (
                          <Image src={img} alt={p.title} width={36} height={36} className="object-cover w-full h-full" unoptimized />
                        ) : (
                          <ShoppingBag size={14} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] truncate" style={{ color: colors.textStrong }}>{p.title}</div>
                        <div className="text-[11px] truncate" style={{ color: colors.textMuted }}>
                          {p.store?.name ?? '—'} · {Number(p.basePrice).toLocaleString('ru-RU')} сум
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
