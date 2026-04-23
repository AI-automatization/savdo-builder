import { useMemo, useRef, useEffect, useState } from 'react';

interface CategoryItem {
  id: string;
  nameRu: string;
  parentId?: string | null;
}

interface Props {
  title: string;
  items: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}

export function CategoryModal({ title, items, selectedId, onSelect, onClose }: Props) {
  const [search, setSearch] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const { roots, childrenMap } = useMemo(() => {
    const roots: CategoryItem[] = [];
    const childrenMap = new Map<string, CategoryItem[]>();

    for (const item of items) {
      if (!item.parentId) {
        roots.push(item);
      } else {
        const arr = childrenMap.get(item.parentId) ?? [];
        arr.push(item);
        childrenMap.set(item.parentId, arr);
      }
    }
    return { roots, childrenMap };
  }, [items]);

  const query = search.trim().toLowerCase();

  const flatFiltered = useMemo(() => {
    if (!query) return null;
    return items.filter((c) => c.nameRu.toLowerCase().includes(query));
  }, [query, items]);

  const parentNameOf = (item: CategoryItem) => {
    if (!item.parentId) return null;
    return items.find((c) => c.id === item.parentId)?.nameRu ?? null;
  };

  const Row = ({ item, indent = false }: { item: CategoryItem; indent?: boolean }) => {
    const active = item.id === selectedId;
    return (
      <button
        key={item.id}
        onClick={() => { onSelect(item.id); onClose(); }}
        className="w-full flex items-center justify-between transition-all active:opacity-70"
        style={{
          padding: indent ? '11px 20px 11px 36px' : '12px 20px',
          background: active ? 'rgba(167,139,250,0.12)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'left',
        }}
      >
        <div className="flex flex-col min-w-0">
          {flatFiltered && parentNameOf(item) && (
            <span className="text-[10px] mb-0.5 truncate" style={{ color: 'rgba(255,255,255,0.30)' }}>
              {parentNameOf(item)}
            </span>
          )}
          <span className="text-sm truncate" style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.85)' }}>
            {item.nameRu}
          </span>
        </div>
        {active && <span style={{ color: '#A855F7', fontSize: 15, flexShrink: 0, marginLeft: 8 }}>✓</span>}
      </button>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.70)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mt-auto flex flex-col rounded-t-3xl"
        style={{
          background: 'linear-gradient(160deg, #13111f 0%, #1a1635 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          maxHeight: '85vh',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{title}</span>
          <div className="flex items-center gap-2">
            {selectedId && (
              <button
                onClick={() => { onSelect(null); onClose(); }}
                className="text-xs px-3 py-1 rounded-full"
                style={{ background: 'rgba(239,68,68,0.12)', color: 'rgba(239,68,68,0.80)', border: '1px solid rgba(239,68,68,0.20)' }}
              >
                Очистить
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center text-sm"
              style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.50)' }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-3 pb-2">
          <div className="relative">
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
              style={{ color: 'rgba(255,255,255,0.30)' }}
            >
              🔍
            </span>
            <input
              ref={inputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск категории..."
              style={{
                width: '100%',
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
                color: '#fff',
                fontSize: 14,
                padding: '10px 14px 10px 34px',
                outline: 'none',
              }}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: 'rgba(255,255,255,0.30)' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* List */}
        <div className="overflow-y-auto flex flex-col pb-6">
          {/* Search results — flat */}
          {flatFiltered && (
            flatFiltered.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Ничего не найдено
              </p>
            ) : (
              flatFiltered.map((item) => <Row key={item.id} item={item} />)
            )
          )}

          {/* Normal tree view */}
          {!flatFiltered && roots.map((root) => {
            const children = childrenMap.get(root.id) ?? [];
            const hasChildren = children.length > 0;

            return (
              <div key={root.id}>
                {/* Root category header */}
                <div
                  className="px-5 py-2 flex items-center gap-2"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {root.nameRu}
                  </span>
                </div>

                {/* Children (selectable) */}
                {hasChildren ? (
                  children.map((child) => <Row key={child.id} item={child} indent />)
                ) : (
                  /* Root with no children is itself selectable */
                  <Row item={root} indent />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
