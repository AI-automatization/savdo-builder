// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): pure-functions для UZ-маски телефона.
// Зеркалит admin/TMA-паттерн: tiny tests на helpers без рендера.
import { describe, it, expect } from 'vitest';
import {
  formatUzPhone,
  stripUzPhone,
  isValidUzPhone,
} from '@/components/PhoneInput';

describe('formatUzPhone', () => {
  it('форматирует 9 цифр после префикса (901234567) → +998 90 123 45 67', () => {
    expect(formatUzPhone('901234567')).toBe('+998 90 123 45 67');
  });

  it('срезает ведущую 8 как «городскую» цифру', () => {
    expect(formatUzPhone('8901234567')).toBe('+998 90 123 45 67');
  });

  it('уже-E.164 (+998901234567) форматирует корректно', () => {
    expect(formatUzPhone('+998901234567')).toBe('+998 90 123 45 67');
  });

  it('пустой input → пустой output', () => {
    expect(formatUzPhone('')).toBe('');
  });

  it('обрезает лишние цифры до 12', () => {
    expect(formatUzPhone('+998901234567999')).toBe('+998 90 123 45 67');
  });
});

describe('stripUzPhone', () => {
  it('возвращает +<digits> без пробелов', () => {
    expect(stripUzPhone('+998 90 123 45 67')).toBe('+998901234567');
  });

  it('пустая строка → пустая', () => {
    expect(stripUzPhone('')).toBe('');
  });
});

describe('isValidUzPhone', () => {
  it('true для 12 цифр начинающихся на 998', () => {
    expect(isValidUzPhone('+998901234567')).toBe(true);
  });

  it('false для короткого номера', () => {
    expect(isValidUzPhone('+998901')).toBe(false);
  });

  it('false для не-998 префикса', () => {
    expect(isValidUzPhone('+7901234567')).toBe(false);
  });
});
