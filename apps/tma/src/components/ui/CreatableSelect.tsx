import { useEffect, useMemo, useRef, useState } from 'react';
import type { SelectOption } from './Select';

interface CreatableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  onCreateOption: (value: string) => Promise<void>;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

export function CreatableSelect({
  value,
  onChange,
  options,
  onCreateOption,
  placeholder = '— выберите —',
  clearable = false,
  disabled = false,
  ariaLabel,
}: CreatableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const trimmedQuery = query.trim();
  const exactMatch = options.some((o) => o.label.toLowerCase() === trimmedQuery.toLowerCase());
  const showCreate = trimmedQuery.length > 0 && !exactMatch;

  useEffect(() => {
    if (!open) return;
    setHighlight(0);
    setTimeout(() => inputRef.current?.focus(), 30);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.querySelector<HTMLElement>(`[data-idx="${highlight}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlight, open]);

  function commit(opt: SelectOption) {
    onChange(opt.value);
    setQuery('');
    setOpen(false);
  }

  async function handleCreate() {
    if (!trimmedQuery || creating) return;
    setCreating(true);
    try {
      await onCreateOption(trimmedQuery);
      onChange(trimmedQuery);
      setQuery('');
      setOpen(false);
    } finally {
      setCreating(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') { setOpen(false); setQuery(''); return; }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    const total = filtered.length + (showCreate ? 1 : 0);
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight((h) => Math.min(total - 1, h + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight((h) => Math.max(0, h - 1)); }
    else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight < filtered.length) {
        const opt = filtered[highlight];
        if (opt) commit(opt);
      } else if (showCreate) {
        void handleCreate();
      }
    }
  }

  return (
    <div ref={rootRef} style={{ position: 'relative' }} onKeyDown={onKeyDown}>
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled || creating}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && !creating && setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'var(--tg-surface-hover)',
          border: `1px solid ${open ? 'var(--tg-accent)' : 'var(--tg-border)'}`,
          color: selected ? 'var(--tg-text-primary)' : 'var(--tg-text-muted)',
          fontSize: 14,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.15s',
          boxShadow: open ? '0 0 0 3px var(--tg-accent-dim)' : 'none',
        }}
      >
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selected?.label ?? placeholder}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {clearable && selected && !disabled && (
            <span
              role="button"
              tabIndex={0}
              aria-label="Сбросить"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onChange(''); } }}
              style={{ padding: 2, borderRadius: 4, color: 'var(--tg-text-muted)', cursor: 'pointer', fontSize: 14 }}
            >
              ✕
            </span>
          )}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{
              color: open ? 'var(--tg-accent)' : 'var(--tg-text-secondary)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s, color 0.15s',
            }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          left: 0, right: 0,
          top: 'calc(100% + 6px)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 14,
          overflow: 'hidden',
          background: 'var(--tg-surface)',
          border: '1px solid var(--tg-accent-border)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.60), 0 0 0 1px rgba(201,168,118,0.08)',
          maxHeight: 300,
        }}>
          {/* Search */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', flexShrink: 0,
            borderBottom: '1px solid var(--tg-border-soft)',
          }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              style={{ color: 'var(--tg-text-dim)', flexShrink: 0 }}>
              <circle cx="11" cy="11" r="7" /><path strokeLinecap="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlight(0); }}
              placeholder="Поиск..."
              style={{
                flex: 1, background: 'transparent', border: 'none', outline: 'none',
                color: 'var(--tg-text-primary)', fontSize: 13,
              }}
            />
            {query && (
              <button type="button" onClick={() => setQuery('')}
                style={{ background: 'none', border: 'none', color: 'var(--tg-text-dim)', cursor: 'pointer', fontSize: 13, padding: 0, flexShrink: 0 }}>
                ✕
              </button>
            )}
          </div>

          {/* Options */}
          <div ref={listRef} role="listbox" style={{ overflowY: 'auto', padding: '4px 0' }}>
            {filtered.length === 0 && !showCreate && (
              <p style={{ padding: '12px 16px', fontSize: 12, textAlign: 'center', color: 'var(--tg-text-dim)', margin: 0 }}>
                Ничего не найдено
              </p>
            )}

            {filtered.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlight = idx === highlight;
              return (
                <button
                  key={opt.value}
                  type="button"
                  data-idx={idx}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlight(idx)}
                  onClick={() => commit(opt)}
                  style={{
                    width: '100%', minHeight: 40,
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '8px 14px',
                    background: isHighlight ? 'var(--tg-accent-bg)' : 'transparent',
                    border: 'none',
                    color: isSelected ? 'var(--tg-accent)' : 'var(--tg-text-primary)',
                    fontSize: 14, fontWeight: isSelected ? 600 : 400,
                    textAlign: 'left', cursor: 'pointer', transition: 'background 0.1s',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                  </span>
                  {isSelected && (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                      style={{ color: 'var(--tg-accent)', flexShrink: 0 }}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}

            {/* Создать новый вариант */}
            {showCreate && (
              <button
                type="button"
                data-idx={filtered.length}
                onMouseEnter={() => setHighlight(filtered.length)}
                onClick={() => void handleCreate()}
                disabled={creating}
                style={{
                  width: '100%', minHeight: 42,
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px',
                  background: highlight === filtered.length ? 'var(--tg-accent-bg)' : 'transparent',
                  border: 'none',
                  borderTop: filtered.length > 0 ? '1px solid var(--tg-border-soft)' : 'none',
                  cursor: creating ? 'wait' : 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 24, height: 24, borderRadius: 7, flexShrink: 0,
                  background: creating ? 'var(--tg-border-soft)' : 'var(--tg-accent-dim)',
                  border: `1px solid ${creating ? 'transparent' : 'var(--tg-accent-border)'}`,
                  color: creating ? 'var(--tg-text-dim)' : 'var(--tg-accent)',
                  fontSize: 15, fontWeight: 700, lineHeight: 1,
                }}>
                  {creating ? '…' : '+'}
                </span>
                <span style={{ fontSize: 13, color: creating ? 'var(--tg-text-muted)' : 'var(--tg-text-secondary)' }}>
                  {creating ? 'Добавляем...' : (
                    <>Добавить{' '}
                      <span style={{ color: 'var(--tg-accent)', fontWeight: 600 }}>«{trimmedQuery}»</span>
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
