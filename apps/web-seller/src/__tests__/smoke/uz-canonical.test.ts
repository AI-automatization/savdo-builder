import { describe, it, expect } from 'vitest';
import { uz } from '@/lib/i18n/uz';

// FRONTEND-SMOKE-PLAYWRIGHT-001 part B — защита UZ-CANONICAL-WEB-2026-05-21
// (web-seller). Если кто-то случайно вернёт `Toʻq`/`Kutmoqda`/`Ishga olish` —
// тест упадёт и заставит явно решать (см. analiz/done.md 2026-05-21).

describe('UZ canonical strings (web-seller)', () => {
  it('orders.status.PENDING = "Kutilmoqda" (страдательный залог)', () => {
    expect(uz['orders.status.PENDING']).toBe('Kutilmoqda');
    expect(uz['orders.filterPending']).toBe('Kutilmoqda');
  });

  it('orders.nextProcess = "Jarayonga olish" (не HR-"нанять")', () => {
    expect(uz['orders.nextProcess']).toBe('Jarayonga olish');
    expect(uz['orders.detail.nextProcess']).toBe('Jarayonga olish');
  });

  it('theme.light = "Yorugʻ", theme.dark = "Qorongʻu" (с апострофом ʻ)', () => {
    expect(uz['theme.light']).toBe('Yorugʻ');
    expect(uz['theme.dark']).toBe('Qorongʻu');
  });

  it('апостроф в Qorongʻu — это U+02BB modifier letter turned comma', () => {
    // Защита от случайной замены на ASCII `'` (U+0027) или `'` (U+2018).
    const dark = uz['theme.dark'];
    const apostropheCharCode = dark.charCodeAt(dark.indexOf('ʻ'));
    expect(apostropheCharCode).toBe(0x02bb);
  });
});
