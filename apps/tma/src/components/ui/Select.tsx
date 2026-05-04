import { useEffect, useMemo, useRef, useState } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  hint?: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
}

// TMA-стайл кастомный dropdown. Заменяет native <select> чтобы не показывать
// уродский системный popup в Yandex/Edge на desktop Telegram.
export function Select({
  value,
  onChange,
  options,
  placeholder = '— Выберите —',
  searchPlaceholder = 'Поиск...',
  emptyText = 'Ничего не найдено',
  searchable = true,
  clearable = false,
  disabled = false,
  ariaLabel,
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlight, setHighlight] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q),
    );
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const i = filtered.findIndex((o) => o.value === value);
    setHighlight(i >= 0 ? i : 0);
  }, [open, filtered, value]);

  useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
  }, [open, searchable]);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
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

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!open) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(filtered.length - 1, h + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = filtered[highlight];
      if (opt) commit(opt);
    }
  }

  return (
    <div
      ref={rootRef}
      style={{ position: 'relative' }}
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: '100%',
          minHeight: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          padding: '10px 12px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.06)',
          border: `1px solid ${open ? 'rgba(168,85,247,0.55)' : 'rgba(255,255,255,0.12)'}`,
          color: selected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)',
          fontSize: 14,
          textAlign: 'left',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'border-color 0.15s',
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
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onChange('');
                }
              }}
              style={{
                padding: 2,
                borderRadius: 4,
                color: 'rgba(255,255,255,0.45)',
                cursor: 'pointer',
                fontSize: 14,
                lineHeight: 1,
              }}
            >
              ✕
            </span>
          )}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{
              color: 'rgba(255,255,255,0.55)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 'calc(100% + 6px)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 12,
            overflow: 'hidden',
            background: '#1a1035',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
            maxHeight: 320,
          }}
        >
          {searchable && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                flexShrink: 0,
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.03)',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'rgba(255,255,255,0.92)',
                  fontSize: 14,
                }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Очистить поиск"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          )}

          <div
            ref={listRef}
            role="listbox"
            style={{ overflowY: 'auto', padding: '4px 0', maxHeight: 260 }}
          >
            {filtered.length === 0 && (
              <p
                style={{
                  padding: '12px 16px',
                  fontSize: 12,
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.45)',
                  margin: 0,
                }}
              >
                {emptyText}
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
                    width: '100%',
                    minHeight: 40,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 14px',
                    background: isHighlight ? 'rgba(168,85,247,0.12)' : 'transparent',
                    border: 'none',
                    color: isSelected ? '#A855F7' : 'rgba(255,255,255,0.92)',
                    fontSize: 14,
                    textAlign: 'left',
                    cursor: 'pointer',
                    transition: 'background 0.1s',
                  }}
                >
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {opt.label}
                    {opt.hint && (
                      <span
                        style={{
                          marginLeft: 6,
                          fontSize: 11,
                          color: 'rgba(255,255,255,0.45)',
                        }}
                      >
                        {opt.hint}
                      </span>
                    )}
                  </span>
                  {isSelected && (
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      style={{ color: '#A855F7', flexShrink: 0 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
