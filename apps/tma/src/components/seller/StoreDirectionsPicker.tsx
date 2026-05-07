import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';
import { showToast } from '@/components/ui/Toast';
import { BottomSheet } from '@/components/ui/BottomSheet';

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
 * «Направление магазина» (Polat 06.05 → 07.05 редизайн).
 *
 * UX как Wildberries/Ozon: продавец видит ВСЕ направления сразу — большая
 * сетка квадратных кнопок с эмодзи. Тапнул → добавилось pill'ом сверху.
 * Раньше был input + autocomplete → продавец не понимал что вводить.
 *
 * Источник: GlobalCategory level=0 (Электроника, Одежда, Дом и сад…).
 * Сохраняется в junction `store_directions` через PUT /seller/store/directions.
 */
export function StoreDirectionsPicker() {
  const [allCategories, setAllCategories] = useState<GlobalCategory[]>([]);
  const [selected, setSelected] = useState<GlobalCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api<GlobalCategory[]>('/storefront/categories/tree'),
      api<GlobalCategory[]>('/seller/store/directions'),
    ])
      .then(([tree, current]) => {
        if (cancelled) return;
        setAllCategories((tree ?? []).filter((c) => c.level === 0));
        setSelected(current ?? []);
      })
      .catch(() => {
        if (!cancelled) showToast('Не удалось загрузить направления', 'error');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const selectedIds = useMemo(() => new Set(selected.map((c) => c.id)), [selected]);

  const filteredAvailable = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allCategories.filter((c) => {
      if (!q) return true;
      return c.nameRu.toLowerCase().includes(q) || c.nameUz.toLowerCase().includes(q);
    });
  }, [allCategories, search]);

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

  const toggleDirection = async (cat: GlobalCategory) => {
    const isSelected = selectedIds.has(cat.id);
    if (!isSelected && selected.length >= MAX_DIRECTIONS) {
      showToast(`Максимум ${MAX_DIRECTIONS} направлений`, 'error');
      return;
    }
    const prev = selected;
    const next = isSelected
      ? selected.filter((c) => c.id !== cat.id)
      : [...selected, cat];
    setSelected(next);
    try { await persist(next); } catch { setSelected(prev); }
  };

  return (
    <div className="flex flex-col gap-2.5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.40)' }}>
            Направление магазина
          </p>
          <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
            Помогает покупателям найти вас в каталоге
          </p>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0"
          style={{
            background: selected.length === MAX_DIRECTIONS ? 'rgba(239,68,68,0.15)' : 'rgba(168,85,247,0.15)',
            color: selected.length === MAX_DIRECTIONS ? '#f87171' : '#A855F7',
          }}
        >
          {selected.length}/{MAX_DIRECTIONS}
        </span>
      </div>

      {/* Selected pills (large, с эмодзи) */}
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((c) => (
            <span
              key={c.id}
              className="inline-flex items-center gap-1.5 pl-2.5 pr-1 py-1.5 rounded-xl text-xs font-semibold"
              style={{
                background: 'rgba(168,85,247,0.20)',
                border: '1px solid rgba(168,85,247,0.40)',
                color: '#E9D5FF',
              }}
            >
              {c.iconEmoji && <span style={{ fontSize: 14 }} aria-hidden>{c.iconEmoji}</span>}
              <span>{c.nameRu}</span>
              <button
                type="button"
                onClick={() => toggleDirection(c)}
                disabled={saving}
                aria-label={`Убрать ${c.nameRu}`}
                className="w-5 h-5 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(168,85,247,0.35)',
                  color: '#fff',
                  fontSize: 10,
                  lineHeight: 1,
                  cursor: saving ? 'wait' : 'pointer',
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Открыть picker */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        disabled={loading || selected.length >= MAX_DIRECTIONS}
        className="w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity"
        style={{
          background: 'rgba(168,85,247,0.12)',
          border: '1px dashed rgba(168,85,247,0.40)',
          color: '#A855F7',
          opacity: loading || selected.length >= MAX_DIRECTIONS ? 0.4 : 1,
          cursor: loading || selected.length >= MAX_DIRECTIONS ? 'not-allowed' : 'pointer',
        }}
      >
        {loading
          ? 'Загрузка…'
          : selected.length === 0
            ? '+ Выбрать направление'
            : selected.length >= MAX_DIRECTIONS
              ? `Максимум ${MAX_DIRECTIONS} направлений`
              : '+ Добавить ещё'}
      </button>

      {/* Picker modal: grid отраслей */}
      {pickerOpen && (
        <BottomSheet
          title="Направление магазина"
          onClose={() => { setPickerOpen(false); setSearch(''); }}
        >
          <div className="px-4 py-3 flex flex-col gap-3 pb-6">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>
              Тапни чтобы добавить или убрать. Можно выбрать до {MAX_DIRECTIONS}.
            </p>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 Поиск направления…"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.90)',
              }}
            />

            {filteredAvailable.length === 0 && (
              <p className="text-xs text-center py-6" style={{ color: 'rgba(255,255,255,0.40)' }}>
                Ничего не найдено
              </p>
            )}

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {filteredAvailable.map((c) => {
                const isOn = selectedIds.has(c.id);
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => toggleDirection(c)}
                    disabled={saving || (!isOn && selected.length >= MAX_DIRECTIONS)}
                    className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl transition-all"
                    style={{
                      background: isOn ? 'rgba(168,85,247,0.20)' : 'rgba(255,255,255,0.04)',
                      border: `1.5px solid ${isOn ? 'rgba(168,85,247,0.55)' : 'rgba(255,255,255,0.08)'}`,
                      color: isOn ? '#E9D5FF' : 'rgba(255,255,255,0.85)',
                      minHeight: 84,
                      cursor: saving ? 'wait' : 'pointer',
                      opacity: !isOn && selected.length >= MAX_DIRECTIONS ? 0.4 : 1,
                    }}
                  >
                    <span style={{ fontSize: 28 }} aria-hidden>{c.iconEmoji ?? '📦'}</span>
                    <span className="text-xs font-semibold text-center leading-tight">
                      {c.nameRu}
                    </span>
                    {isOn && (
                      <span className="text-[10px] font-bold" style={{ color: '#A855F7' }}>✓ выбрано</span>
                    )}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => { setPickerOpen(false); setSearch(''); }}
              className="w-full py-3 rounded-xl text-sm font-semibold mt-2"
              style={{
                background: 'rgba(168,85,247,0.25)',
                border: '1px solid rgba(168,85,247,0.45)',
                color: '#fff',
              }}
            >
              Готово
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
}
