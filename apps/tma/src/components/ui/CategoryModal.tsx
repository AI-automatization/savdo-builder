import { useMemo, useRef, useEffect, useState } from 'react';

export interface CategoryItem {
  id: string;
  nameRu: string;
  parentId?: string | null;
  level?: number;
  isLeaf?: boolean;
  iconEmoji?: string | null;
}

interface Props {
  title: string;
  items: CategoryItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
  /**
   * Если true — выбрать можно только лист (isLeaf=true). Не-листы работают как
   * navigational дрилдаун. Используется для добавления товара (категория должна
   * быть конечной, чтобы знать набор характеристик).
   */
  leafOnly?: boolean;
}

export function CategoryModal({ title, items, selectedId, onSelect, onClose, leafOnly = false }: Props) {
  const [search, setSearch] = useState('');
  const [drilldownId, setDrilldownId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []);

  const childrenMap = useMemo(() => {
    const map = new Map<string | null, CategoryItem[]>();
    for (const item of items) {
      const key = item.parentId ?? null;
      const arr = map.get(key) ?? [];
      arr.push(item);
      map.set(key, arr);
    }
    return map;
  }, [items]);

  // Полный путь для item (breadcrumb)
  const getBreadcrumb = (item: CategoryItem): string[] => {
    const path: string[] = [item.nameRu];
    let cur = item;
    while (cur.parentId) {
      const parent = items.find((c) => c.id === cur.parentId);
      if (!parent) break;
      path.unshift(parent.nameRu);
      cur = parent;
    }
    return path;
  };

  const query = search.trim().toLowerCase();

  // Search: при leafOnly показываем только leaf-категории; иначе все
  const flatFiltered = useMemo(() => {
    if (!query) return null;
    return items
      .filter((c) => c.nameRu.toLowerCase().includes(query))
      .filter((c) => !leafOnly || c.isLeaf);
  }, [query, items, leafOnly]);

  // Текущий уровень в дереве (по drilldown)
  const currentNode = drilldownId ? items.find((c) => c.id === drilldownId) ?? null : null;
  const currentChildren = childrenMap.get(drilldownId) ?? [];

  const Row = ({ item, indent = 0 }: { item: CategoryItem; indent?: number }) => {
    const active = item.id === selectedId;
    const children = childrenMap.get(item.id) ?? [];
    const hasChildren = children.length > 0;
    const canSelect = !leafOnly || item.isLeaf || !hasChildren;
    const isDrilldown = leafOnly && hasChildren;

    return (
      <button
        onClick={() => {
          if (isDrilldown) {
            setDrilldownId(item.id);
            setSearch('');
            return;
          }
          if (canSelect) {
            onSelect(item.id);
            onClose();
          }
        }}
        className="w-full flex items-center justify-between transition-all active:opacity-70"
        style={{
          padding: `12px ${20 + indent * 14}px 12px ${20 + indent * 14}px`,
          background: active ? 'rgba(167,139,250,0.12)' : 'transparent',
          borderBottom: '1px solid rgba(255,255,255,0.04)',
          textAlign: 'left',
        }}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          {item.iconEmoji && (
            <span style={{ fontSize: 20, flexShrink: 0 }}>{item.iconEmoji}</span>
          )}
          <div className="flex flex-col min-w-0">
            {flatFiltered && (
              <span className="text-[10px] mb-0.5 truncate" style={{ color: 'rgba(255,255,255,0.30)' }}>
                {getBreadcrumb(item).slice(0, -1).join(' › ') || ' '}
              </span>
            )}
            <span className="text-sm truncate" style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.85)' }}>
              {item.nameRu}
            </span>
          </div>
        </div>
        {active && <span style={{ color: '#A855F7', fontSize: 15, flexShrink: 0, marginLeft: 8 }}>✓</span>}
        {isDrilldown && !active && <span style={{ color: 'rgba(255,255,255,0.30)', fontSize: 16, flexShrink: 0, marginLeft: 8 }}>›</span>}
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
          <div className="flex items-center gap-2 min-w-0">
            {currentNode && (
              <button
                onClick={() => setDrilldownId(currentNode.parentId ?? null)}
                className="text-base"
                style={{ color: 'rgba(255,255,255,0.70)' }}
                aria-label="Назад"
              >
                ‹
              </button>
            )}
            <span className="text-sm font-bold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>
              {currentNode ? currentNode.nameRu : title}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
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

        {/* Breadcrumb для drilldown */}
        {currentNode && !flatFiltered && (
          <div className="px-5 py-2 text-[11px] truncate" style={{ background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.40)' }}>
            {getBreadcrumb(currentNode).join(' › ')}
          </div>
        )}

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
              placeholder={leafOnly ? 'Найти конкретный тип товара...' : 'Поиск категории...'}
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
          {/* Search results — flat with breadcrumb */}
          {flatFiltered && (
            flatFiltered.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Ничего не найдено
              </p>
            ) : (
              flatFiltered.map((item) => <Row key={item.id} item={item} />)
            )
          )}

          {/* Drilldown view (current level children) */}
          {!flatFiltered && currentNode && (
            currentChildren.length === 0 ? (
              <p className="text-center py-10 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
                Нет подкатегорий
              </p>
            ) : (
              currentChildren.map((item) => <Row key={item.id} item={item} />)
            )
          )}

          {/* Root view (level 0) */}
          {!flatFiltered && !currentNode && (
            (childrenMap.get(null) ?? []).map((item) => <Row key={item.id} item={item} />)
          )}
        </div>
      </div>
    </div>
  );
}
