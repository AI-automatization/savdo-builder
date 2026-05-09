'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { colors, inputStyle } from '@/lib/styles';

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

export function Select({
  value,
  onChange,
  options,
  placeholder = '— Выберите —',
  searchPlaceholder = 'Поиск…',
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
    return options.filter((o) => o.label.toLowerCase().includes(q) || o.hint?.toLowerCase().includes(q));
  }, [options, query]);

  // Reset highlight when opening or filtering
  useEffect(() => {
    if (!open) return;
    const i = filtered.findIndex((o) => o.value === value);
    setHighlight(i >= 0 ? i : 0);
  }, [open, filtered, value]);

  // Focus search field when opened
  useEffect(() => {
    if (open && searchable) inputRef.current?.focus();
  }, [open, searchable]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener('mousedown', onMouseDown);
    return () => window.removeEventListener('mousedown', onMouseDown);
  }, [open]);

  // Keep highlighted item in view
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
    <div ref={rootRef} className="relative" onKeyDown={onKeyDown}>
      <button
        type="button"
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50"
        style={{
          ...inputStyle,
          color: selected ? colors.textPrimary : colors.textDim,
          borderColor: open ? colors.accentBorder : colors.border,
        }}
      >
        <span className="truncate text-left flex-1">{selected?.label ?? placeholder}</span>
        <span className="flex items-center gap-1 flex-shrink-0">
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
              className="p-0.5 rounded hover:opacity-70 cursor-pointer"
              style={{ color: colors.textDim }}
            >
              <X size={14} />
            </span>
          )}
          <ChevronDown
            size={16}
            style={{
              color: colors.textDim,
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s',
            }}
          />
        </span>
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 mt-1.5 rounded-lg overflow-hidden flex flex-col"
          style={{
            zIndex: 60,
            background: colors.surface,
            border: `1px solid ${colors.borderStrong}`,
            boxShadow: '0 6px 16px rgba(0,0,0,0.35)',
            maxHeight: 320,
          }}
        >
          {searchable && (
            <div
              className="flex items-center gap-2 px-3 py-2 flex-shrink-0"
              style={{ borderBottom: `1px solid ${colors.divider}`, background: colors.surfaceMuted }}
            >
              <Search size={14} style={{ color: colors.textDim, flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="flex-1 bg-transparent outline-none text-sm"
                style={{ color: colors.textPrimary }}
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="flex-shrink-0 hover:opacity-70"
                  style={{ color: colors.textDim }}
                  aria-label="Очистить поиск"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          <div ref={listRef} role="listbox" className="overflow-y-auto py-1" style={{ maxHeight: 260 }}>
            {filtered.length === 0 && (
              <p className="px-4 py-3 text-xs text-center" style={{ color: colors.textDim }}>
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
                  className="w-full flex items-center gap-2 px-3.5 py-2 text-sm text-left transition-colors"
                  style={{
                    background: isHighlight ? colors.surfaceElevated : 'transparent',
                    color: isSelected ? colors.accent : colors.textPrimary,
                  }}
                >
                  <span className="flex-1 truncate">
                    {opt.label}
                    {opt.hint && (
                      <span className="ml-1.5 text-[11px]" style={{ color: colors.textDim }}>
                        {opt.hint}
                      </span>
                    )}
                  </span>
                  {isSelected && <Check size={14} style={{ color: colors.accent, flexShrink: 0 }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
