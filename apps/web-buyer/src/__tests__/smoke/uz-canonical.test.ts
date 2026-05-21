// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): защита канона UZ-строк
// (см. UZ-CANONICAL-WEB-2026-05-21 в analiz/done.md).
//
// Любая случайная замена этих 2 ключей в web-buyer на старые формы
// (`Yorqin`, `Qorongʻi`, etc.) ломает тест и заметна на CI.
import { describe, it, expect } from 'vitest';
import { uz } from '@/lib/i18n/uz';

describe('UZ canonical strings (web-buyer)', () => {
  it('theme.light = «Yorugʻ» (освещённость, не Yorqin = насыщенность)', () => {
    expect(uz['theme.light']).toBe('Yorugʻ');
    expect(uz['theme.enableLight']).toBe('Yorugʻ mavzuni yoqish');
  });

  it('theme.dark = «Qorongʻu» (тёмный)', () => {
    expect(uz['theme.dark']).toBe('Qorongʻu');
    expect(uz['theme.enableDark']).toBe('Qorongʻu mavzuni yoqish');
  });

  it('использует апостроф ʻ U+02BB (не ʼ U+02BC и не одинарную кавычку \')', () => {
    // U+02BB = «Modifier Letter Turned Comma», стандарт для латинского узбекского.
    const APOSTROPHE = 'ʻ';
    expect(uz['theme.light']).toContain(APOSTROPHE);
    expect(uz['theme.dark']).toContain(APOSTROPHE);
  });
});
