/**
 * API-PII-MASKING-001 (SEC-011): маскирование PII в логах.
 *
 * Phone number в логах открытым видом — GDPR/Roskomnadzor нарушение.
 * Маскируем середину, оставляя prefix (+998) + последние 2 цифры для
 * идентификации (admin support, debug).
 */

/**
 * `+998901234567` → `+998 *** ** 67`
 * `tg_12345` → `tg_*****` (TG ghost users)
 * пустой/невалидный → `[empty]` / `[invalid]`
 */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return '[empty]';

  // TG ghost users (phone = `tg_${chatId}`): маскируем только chatId
  if (phone.startsWith('tg_')) {
    const id = phone.slice(3);
    if (id.length < 4) return 'tg_***';
    return `tg_***${id.slice(-2)}`;
  }

  // UZ format: +998 XXX XXX XX XX (12 digits с +)
  // Минимум 6 цифр чтобы маскирование имело смысл.
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 6) return '[invalid]';

  if (digits.startsWith('998') && digits.length === 12) {
    return `+998 *** ** ${digits.slice(-2)}`;
  }

  // Generic E.164 fallback: prefix первые 4 + последние 2.
  return `${phone.slice(0, 4)}***${phone.slice(-2)}`;
}
