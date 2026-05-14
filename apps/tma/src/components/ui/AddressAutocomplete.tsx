import { useEffect, useRef, useState, type CSSProperties } from 'react';

// TMA-ADDRESS-AUTOCOMPLETE-001: автоподсказка адресов через Yandex Suggest API v1.
//
// REST endpoint, без подключения полной Maps JS — лёгкий REST + JSON.
// Bbox ограничивает результаты территорией Узбекистана (lng,lat).
//
// Поведение:
//   - Если `VITE_YANDEX_MAPS_API_KEY` не задан → fallback на обычный input
//     (без suggest), компонент работает как обёртка.
//   - debounce 300ms перед fetch.
//   - AbortController на каждый запрос (предыдущий cancel'ится).
//   - Список рендерится absolute поверх инпута, клик закрывает + setValue.
//   - Esc / blur (outside click) скрывают список.
//
// Yandex Suggest API: https://yandex.com/maps-api/docs/suggest-api/index.html
// Запрос пример:
//   GET https://suggest-maps.yandex.ru/v1/suggest
//       ?apikey=KEY&text=Tashkent&lang=ru_RU&types=geo
//       &bbox=55.99,37.18~73.16,45.59&print_address=1

interface Suggestion {
  title: string;
  subtitle: string;
}

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  style?: CSSProperties;
  /** Локаль для Yandex API. По умолчанию ru_RU; для uz передавать 'uz_UZ'. */
  lang?: 'ru_RU' | 'uz_UZ';
}

// Bounding box Узбекистана (примерные min/max координаты).
const UZ_BBOX = '55.99,37.18~73.16,45.59';
const API_BASE = 'https://suggest-maps.yandex.ru/v1/suggest';

export function AddressAutocomplete({
  value,
  onChange,
  placeholder,
  className,
  style,
  lang = 'ru_RU',
}: Props) {
  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!apiKey) return;
    const q = value.trim();
    if (q.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      abortRef.current?.abort();
      const ac = new AbortController();
      abortRef.current = ac;
      setLoading(true);
      const url = new URL(API_BASE);
      url.searchParams.set('apikey', apiKey);
      url.searchParams.set('text', q);
      url.searchParams.set('lang', lang);
      url.searchParams.set('types', 'geo');
      url.searchParams.set('bbox', UZ_BBOX);
      url.searchParams.set('print_address', '1');
      url.searchParams.set('results', '7');
      fetch(url.toString(), { signal: ac.signal })
        .then((r) => r.json())
        .then((data: { results?: Array<{ title?: { text?: string }; subtitle?: { text?: string } }> }) => {
          if (ac.signal.aborted) return;
          const list: Suggestion[] = (data.results ?? []).map((r) => ({
            title: r.title?.text ?? '',
            subtitle: r.subtitle?.text ?? '',
          }));
          setItems(list);
          setOpen(list.length > 0);
        })
        .catch(() => { /* abort/error — silent, UI просто без suggest */ })
        .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    }, 300);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [value, apiKey, lang]);

  // Outside click → close
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const pick = (s: Suggestion) => {
    const fullText = s.subtitle ? `${s.title}, ${s.subtitle}` : s.title;
    onChange(fullText);
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className={className} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => items.length > 0 && setOpen(true)}
        onKeyDown={(e) => e.key === 'Escape' && setOpen(false)}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: 'var(--tg-surface)', border: '1px solid var(--tg-border)', color: 'var(--tg-text-primary)' }}
      />

      {open && (
        <ul
          role="listbox"
          style={{
            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
            background: 'var(--tg-bg)', border: '1px solid var(--tg-border)',
            borderRadius: 12, padding: 4,
            maxHeight: 260, overflowY: 'auto',
            zIndex: 50,
            boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
            margin: 0,
          }}
        >
          {loading && items.length === 0 ? (
            <li style={{ padding: '8px 12px', fontSize: 12, color: 'var(--tg-text-muted)' }}>...</li>
          ) : items.map((s, idx) => (
            <li
              key={`${s.title}-${idx}`}
              role="option"
              aria-selected={false}
              onClick={() => pick(s)}
              style={{
                padding: '10px 12px',
                borderRadius: 8,
                cursor: 'pointer',
                listStyle: 'none',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--tg-surface-hover)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '')}
            >
              <div style={{ fontSize: 13, color: 'var(--tg-text-primary)', fontWeight: 500 }}>{s.title}</div>
              {s.subtitle && (
                <div style={{ fontSize: 11, color: 'var(--tg-text-muted)', marginTop: 2 }}>{s.subtitle}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
