import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  const [visible, setVisible] = useState(false);
  const [query, setQuery] = useState('');
  const [creating, setCreating] = useState(false);
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

  // Trigger entrance animation after portal mounts
  useEffect(() => {
    if (!open) return;
    const id = setTimeout(() => {
      setVisible(true);
      inputRef.current?.focus();
    }, 10);
    return () => clearTimeout(id);
  }, [open]);

  // Escape key closes the sheet
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeSheet();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // iOS / TMA: body position:fixed while sheet is open prevents the
  // "position:fixed child doesn't cover viewport" bug in scrollable WebViews
  useEffect(() => {
    if (!open) return;
    const scrollY = window.scrollY;
    const prev = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    return () => {
      document.body.style.overflow = prev.overflow;
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  function openSheet() {
    if (disabled || creating) return;
    setOpen(true);
  }

  function closeSheet() {
    setVisible(false);
    setTimeout(() => {
      setOpen(false);
      setQuery('');
    }, 280);
  }

  function commit(opt: SelectOption) {
    onChange(opt.value);
    closeSheet();
  }

  async function handleCreate() {
    if (!trimmedQuery || creating) return;
    setCreating(true);
    try {
      await onCreateOption(trimmedQuery);
      onChange(trimmedQuery);
      closeSheet();
    } finally {
      setCreating(false);
    }
  }

  const sheet = open
    ? createPortal(
        /* Overlay — tapping outside closes the sheet */
        <div
          onClick={closeSheet}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.65)',
            opacity: visible ? 1 : 0,
            transition: 'opacity 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          {/* Bottom-sheet panel */}
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: 'var(--tg-surface)',
              borderRadius: '20px 20px 0 0',
              maxHeight: '80vh',
              display: 'flex',
              flexDirection: 'column',
              transform: visible ? 'translateY(0)' : 'translateY(100%)',
              transition: 'transform 0.25s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px 16px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--tg-border-soft)',
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  color: 'var(--tg-text-primary)',
                  fontWeight: 600,
                  fontSize: 16,
                }}
              >
                {ariaLabel ?? placeholder}
              </span>
              <button
                type="button"
                onClick={closeSheet}
                aria-label="Закрыть"
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--tg-text-muted)',
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: 8,
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Search input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderBottom: '1px solid var(--tg-border-soft)',
                flexShrink: 0,
              }}
            >
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ color: 'var(--tg-text-dim)', flexShrink: 0 }}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="M21 21l-4.35-4.35" />
              </svg>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Поиск..."
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--tg-text-primary)',
                  fontSize: 15,
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
                    color: 'var(--tg-text-dim)',
                    cursor: 'pointer',
                    fontSize: 14,
                    padding: 0,
                    flexShrink: 0,
                    lineHeight: 1,
                  }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Options list */}
            <div ref={listRef} role="listbox" style={{ overflowY: 'auto', flex: 1 }}>
              {filtered.length === 0 && !showCreate && (
                <p
                  style={{
                    padding: '20px 16px',
                    fontSize: 14,
                    textAlign: 'center',
                    color: 'var(--tg-text-dim)',
                    margin: 0,
                  }}
                >
                  Ничего не найдено
                </p>
              )}

              {filtered.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => commit(opt)}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background =
                        'var(--tg-accent-bg)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                    }}
                    style={{
                      width: '100%',
                      minHeight: 48,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 16px',
                      background: 'transparent',
                      border: 'none',
                      color: isSelected ? 'var(--tg-accent)' : 'var(--tg-text-primary)',
                      fontSize: 15,
                      fontWeight: isSelected ? 600 : 400,
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'background 0.1s',
                    }}
                  >
                    <span
                      style={{
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {opt.label}
                    </span>
                    {isSelected && (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{ color: 'var(--tg-accent)', flexShrink: 0 }}
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                );
              })}

              {/* Create new option row */}
              {showCreate && (
                <button
                  type="button"
                  onClick={() => void handleCreate()}
                  disabled={creating}
                  style={{
                    width: '100%',
                    minHeight: 48,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '12px 16px',
                    background: 'transparent',
                    border: 'none',
                    borderTop:
                      filtered.length > 0 ? '1px solid var(--tg-border-soft)' : 'none',
                    cursor: creating ? 'wait' : 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 28,
                      height: 28,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: creating
                        ? 'var(--tg-border-soft)'
                        : 'var(--tg-accent-dim)',
                      border: `1px solid ${creating ? 'transparent' : 'var(--tg-accent-border)'}`,
                      color: creating ? 'var(--tg-text-dim)' : 'var(--tg-accent)',
                      fontSize: 18,
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    {creating ? '…' : '+'}
                  </span>
                  <span
                    style={{
                      fontSize: 14,
                      color: creating ? 'var(--tg-text-muted)' : 'var(--tg-text-primary)',
                    }}
                  >
                    {creating ? (
                      'Добавляем...'
                    ) : (
                      <>
                        Добавить{' '}
                        <span style={{ color: 'var(--tg-accent)', fontWeight: 600 }}>
                          «{trimmedQuery}»
                        </span>
                      </>
                    )}
                  </span>
                </button>
              )}

              {/* Safe-area spacer for iOS home indicator */}
              <div style={{ height: 'env(safe-area-inset-bottom, 16px)' }} />
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <div style={{ position: 'relative' }}>
      {/* Trigger button */}
      <button
        type="button"
        disabled={disabled || creating}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={openSheet}
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
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxShadow: open ? '0 0 0 3px var(--tg-accent-dim)' : 'none',
        }}
      >
        <span
          style={{
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
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
                color: 'var(--tg-text-muted)',
                cursor: 'pointer',
                fontSize: 14,
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
              color: open ? 'var(--tg-accent)' : 'var(--tg-text-muted)',
              transform: open ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.15s, color 0.15s',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {sheet}
    </div>
  );
}
