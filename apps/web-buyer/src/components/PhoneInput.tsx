'use client';

// DESIGN-PHONE-INPUT-PACKAGE-001 — единый UZ phone input с маской `+998 XX XXX XX XX`.
// value/onChange работают в E.164 (`+998XXXXXXXXX`).
// SYNC: дубликат в apps/web-seller/src/components/PhoneInput.tsx — при правке менять оба.
// Когда packages/ui станет реально подключённым к web-*, перенести сюда.

import { forwardRef, useCallback } from 'react';

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
  value: string;
  onChange: (e164: string) => void;
  onEnter?: () => void;
  className?: string;
  style?: React.CSSProperties;
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
    (e: React.ChangeEvent<HTMLInputElement>) => onChange(stripUzPhone(e.target.value)),
    [onChange],
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
      onKeyDown={(e) => {
        if (e.key === 'Enter' && onEnter) onEnter();
      }}
      placeholder={placeholder}
      autoFocus={autoFocus}
      disabled={disabled}
      className={className}
      style={style}
      maxLength={17}
    />
  );
});
