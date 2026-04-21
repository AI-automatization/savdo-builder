import { useState } from 'react';

interface CategoryItem {
  id: string;
  nameRu: string;
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

  const filtered = items.filter((c) =>
    c.nameRu.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="mt-auto flex flex-col rounded-t-3xl"
        style={{
          background: 'linear-gradient(160deg, #13111f 0%, #1a1635 100%)',
          border: '1px solid rgba(255,255,255,0.10)',
          maxHeight: '80vh',
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
        <div className="px-4 py-3">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск..."
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              color: '#fff',
              fontSize: 14,
              padding: '10px 14px',
              outline: 'none',
            }}
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex flex-col pb-6" style={{ maxHeight: '55vh' }}>
          {filtered.length === 0 && (
            <p className="text-center py-8 text-sm" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Ничего не найдено
            </p>
          )}
          {filtered.map((item) => {
            const active = item.id === selectedId;
            return (
              <button
                key={item.id}
                onClick={() => { onSelect(item.id); onClose(); }}
                className="flex items-center justify-between px-5 py-3.5 transition-all active:opacity-70"
                style={{
                  background: active ? 'rgba(167,139,250,0.10)' : 'transparent',
                  borderBottom: '1px solid rgba(255,255,255,0.04)',
                  textAlign: 'left',
                }}
              >
                <span className="text-sm" style={{ color: active ? '#A855F7' : 'rgba(255,255,255,0.80)' }}>
                  {item.nameRu}
                </span>
                {active && (
                  <span style={{ color: '#A855F7', fontSize: 16 }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
