import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';

interface GlobalCategory {
  id: string;
  slug: string;
  nameRu: string;
  nameUz: string;
  iconEmoji: string | null;
  level: number;
}

const MAX_DIRECTIONS = 10;

/**
 * Polat 06.05: «направления магазина» — продавец вводит, выходит autocomplete,
 * можно выбрать несколько. Источник — GlobalCategory level=0 (Отрасли:
 * Электроника, Одежда, Дом и сад…). Сохраняется в junction-таблицу
 * store_directions через PUT /seller/store/directions { ids: string[] }.
 */
export function StoreDirectionsPicker() {
  const [allCategories, setAllCategories] = useState<GlobalCategory[]>([]);
  const [selected, setSelected] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Initial load: tree + currently selected directions
  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<GlobalCategory[]>('/storefront/categories/tree'),
      api<GlobalCategory[]>('/seller/store/directions'),
    ])
      .then(([tree, current]) => {
        if (cancelled) return;
        // Only level=0 (отрасли) для направлений магазина
        setAllCategories((tree ?? []).filter((c) => c.level === 0));
        setSelected(current ?? []);
      })
      .catch(() => {
        if (!cancelled) showToast('Не удалось загрузить направления', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Click outside → закрыть suggestions
  useEffect(() => {
    if (!showSuggestions) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [showSuggestions]);

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected]);
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCategories
      .filter((c) => !selectedIds.has(c.id))
      .filter((c) => !q || c.nameRu.toLowerCase().includes(q) || c.nameUz.toLowerCase().includes(q))
      .slice(0, 8);
  }, [allCategories, query, selectedIds]);

  const persist = async (next: GlobalCategory[]) => {
    setSaving(true);
    try {
      await api('/seller/store/directions', {
        method: 'PUT',
        body: { ids: next.map((c) => c.id) },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Не удалось сохранить';
      showToast(`❌ ${msg}`, 'error');
      throw err;
    } finally {
      setSaving(false);
    }
  };

  const addDirection = async (cat: GlobalCategory) => {
    if (selected.length >= MAX_DIRECTIONS) {
      showToast(`Максимум ${MAX_DIRECTIONS} направлений`, 'error');
      return;
    }
    const next = [...selected, cat];
    const prev = selected;
    setSelected(next);
    setQuery('');
    setShowSuggestions(false);
    inputRef.current?.focus();
    try { await persist(next); } catch { setSelected(prev); }
  };

  const removeDirection = async (id: string) => {
    const prev = selected;
    const next = selected.filter((c) => c.id !== id);
    setSelected(next);
    try { await persist(next); } catch { setSelected(prev); }
  };

  return (
    <div ref={containerRef} className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.40)' }}>
          Направление магазина
        </p>
        <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.35)' }}>
          {selected.length}/{MAX_DIRECTIONS}
        </span>
      </div>
      <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>
        Помогает покупателям найти вас в каталоге
      </p>

      {/* Selected pills */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: 'rgba(168,85,247,0.18)',
                border: '1px solid rgba(168,85,247,0.35)',
                color: '#A855F7',
              }}
            >
              {c.iconEmoji && <span aria-hidden>{c.iconEmoji}</span>}
              <span>{c.nameRu}</span>
              <button
                type="button"
                onClick={() => removeDirection(c.id)}
                disabled={saving}
                className="ml-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(168,85,247,0.30)', color: '#fff', fontSize: 10, lineHeight: 1 }}
                aria-label={`Убрать направление ${c.nameRu}`}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input + suggestions */}
      <div style={{ position: 'relative' }}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          placeholder={loading ? 'Загрузка…' : 'Например: Одежда, Электроника…'}
          disabled={loading || selected.length >= MAX_DIRECTIONS}
          className="w-full px-3 py-2 rounded-xl text-sm outline-none"
          style={{
            background: 'rgba(255,255,255,0.07)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.90)',
            opacity: selected.length >= MAX_DIRECTIONS ? 0.5 : 1,
          }}
        />

        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute left-0 right-0 mt-1 rounded-xl flex flex-col overflow-hidden z-10"
            style={{
              background: '#1a1035',
              border: '1px solid rgba(255,255,255,0.12)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
              maxHeight: 280,
              overflowY: 'auto',
            }}
          >
            {suggestions.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => addDirection(c)}
                disabled={saving}
                className="flex items-center gap-2 px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors"
                style={{ color: 'rgba(255,255,255,0.85)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                {c.iconEmoji && <span aria-hidden style={{ fontSize: 18 }}>{c.iconEmoji}</span>}
                <span className="flex-1">{c.nameRu}</span>
                <span className="text-[10px]" style={{ color: 'rgba(255,255,255,0.40)' }}>{c.nameUz}</span>
              </button>
            ))}
          </div>
        )}

        {showSuggestions && query.trim() && suggestions.length === 0 && (
          <div
            className="absolute left-0 right-0 mt-1 rounded-xl px-3 py-3 text-xs z-10"
            style={{
              background: '#1a1035',
              border: '1px solid rgba(255,255,255,0.12)',
              color: 'rgba(255,255,255,0.50)',
              textAlign: 'center',
            }}
          >
            Ничего не найдено
          </div>
        )}
      </div>
    </div>
  );
}
