import { maskPhone } from './pii';

describe('maskPhone', () => {
  it('UZ format → `+998 *** ** XX`', () => {
    expect(maskPhone('+998901234567')).toBe('+998 *** ** 67');
  });

  it('UZ с пробелами → digits извлекаются + UZ mask', () => {
    expect(maskPhone('+998 90 123 45 67')).toBe('+998 *** ** 67');
  });

  it('TG ghost `tg_XXXX` → `tg_***XX`', () => {
    expect(maskPhone('tg_123456789')).toBe('tg_***89');
  });

  it('TG ghost короткий → `tg_***` без хвоста', () => {
    expect(maskPhone('tg_12')).toBe('tg_***');
  });

  it('пустой/null/undefined → [empty]', () => {
    expect(maskPhone(null)).toBe('[empty]');
    expect(maskPhone(undefined)).toBe('[empty]');
    expect(maskPhone('')).toBe('[empty]');
  });

  it('слишком короткий → [invalid]', () => {
    expect(maskPhone('123')).toBe('[invalid]');
  });

  it('foreign E.164 fallback', () => {
    expect(maskPhone('+12025550100')).toBe('+120***00');
  });
});
