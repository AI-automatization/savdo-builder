import { forwardRef, useCallback, type ChangeEvent, type CSSProperties, type KeyboardEvent } from 'react';

// DESIGN-PHONE-INPUT-PACKAGE-001 — единый UZ phone input с маской
// `+998 XX XXX XX XX`. value/onChange работают в E.164 (`+998XXXXXXXXX`).
//
// Перенесён в packages/ui для устранения дубля в web-buyer/web-seller
// (раньше каждое приложение хранило свою копию, sync вручную).
//
// **Next.js consumers**: добавить `'use client'` в файл-обёртке, например:
//   ```tsx
//   'use client';
//   export { PhoneInput, formatUzPhone, stripUzPhone, isValidUzPhone } from '@savdo/ui';
//   ```
// **Vite consumers (TMA, admin)**: использовать напрямую.

const COUNTRY_CODE = '998';

export function formatUzPhone(raw: string): string {
  let digits = raw.replace(/\D/g, '');
  if (digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(0, 12);
  } else if (digits.length > 0) {
    if (digits.startsWith('8')) digits = digits.slice(1);
    digits = (COUNTRY_CODE + digits).slice(0, 12);
  }
  if (digits.length === 0) return '';
  const cc = digits.slice(0, 3);
  const op = digits.slice(3, 5);
  const a = digits.slice(5, 8);
  const b = digits.slice(8, 10);
  const c = digits.slice(10, 12);
  let out = `+${cc}`;
  if (op) out += ` ${op}`;
  if (a) out += ` ${a}`;
  if (b) out += ` ${b}`;
  if (c) out += ` ${c}`;
  return out;
}

export function stripUzPhone(masked: string): string {
  const digits = masked.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

export function isValidUzPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith(COUNTRY_CODE);
}

interface PhoneInputProps {
  /** E.164 формат (`+998XXXXXXXXX`) */
  value: string;
  /** Возвращает E.164 — без пробелов */
  onChange: (e164: string) => void;
  onEnter?: () => void;
  className?: string;
  style?: CSSProperties;
  placeholder?: string;
  autoFocus?: boolean;
  disabled?: boolean;
  ariaLabel?: string;
  id?: string;
  name?: string;
}

export const PhoneInput = forwardRef<HTMLInputElement, PhoneInputProps>(function PhoneInput(
  {
    value,
    onChange,
    onEnter,
    className,
    style,
    placeholder = '+998 90 000 00 00',
    autoFocus,
    disabled,
    ariaLabel = 'Телефон',
    id,
    name,
  },
  ref,
) {
  const display = formatUzPhone(value);
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => onChange(stripUzPhone(e.target.value)),
    [onChange],
  );
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onEnter) onEnter();
    },
    [onEnter],
  );
  return (
    <input
      ref={ref}
      id={id}
      name={name}
      type="tel"
      inputMode="tel"
      autoComplete="tel"
      aria-label={ariaLabel}
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={className}
      style={style}
      maxLength={17}
    />
  );
});
