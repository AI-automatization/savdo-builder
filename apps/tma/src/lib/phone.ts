/**
 * TMA-PHONE-MASK-001: единая маска UZ-номера `+998 XX XXX XX XX`.
 *
 * Logic:
 *   - Любой input → удаляем нецифры → берём первые 12 (998 + 9 digits)
 *   - Гарантируем prefix 998 (если юзер начал с 9 — добавляем)
 *   - Форматируем как `+998 XX XXX XX XX`
 *
 * Backend ждёт `+998XXXXXXXXX` (12 chars без пробелов) — используйте
 * `stripPhone()` перед отправкой.
 */

const COUNTRY_CODE = '998';

export function formatUzPhone(raw: string): string {
  // Extract digits, drop leading + and country code if user pasted full number.
  let digits = raw.replace(/\D/g, '');

  // Если начинается с 998 — оставляем; если 8 (legacy) или с 9 — добавим 998.
  if (digits.startsWith(COUNTRY_CODE)) {
    digits = digits.slice(0, 12); // 998 + 9 цифр
  } else if (digits.length > 0) {
    // Юзер ввёл сразу с 9 (без 998) или начал с 8 — нормализуем.
    if (digits.startsWith('8')) digits = digits.slice(1);
    digits = (COUNTRY_CODE + digits).slice(0, 12);
  }

  if (digits.length === 0) return '';

  // Формат: +998 XX XXX XX XX
  const cc = digits.slice(0, 3); // 998
  const op = digits.slice(3, 5); // XX (operator code)
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

/**
 * Снимает маску — возвращает `+998XXXXXXXXX` для отправки на backend.
 * Если номер неполный — возвращает то что есть.
 */
export function stripPhone(masked: string): string {
  const digits = masked.replace(/\D/g, '');
  return digits ? `+${digits}` : '';
}

/** True если номер полный: +998 + 9 цифр = 12 цифр. */
export function isValidUzPhone(masked: string): boolean {
  const digits = masked.replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith(COUNTRY_CODE);
}
