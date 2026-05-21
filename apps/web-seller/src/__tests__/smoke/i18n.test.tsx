import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { I18nProvider, useTranslation } from '@/lib/i18n';
import type { ReactNode } from 'react';

// FRONTEND-SMOKE-PLAYWRIGHT-001 part B — I18nProvider behaviour (web-seller).
// Зеркалит web-buyer i18n.test.tsx и admin i18n.test.tsx.

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nProvider>{children}</I18nProvider>
);

describe('web-seller I18nProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('по умолчанию отдаёт русский dict', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t('common.cancel')).toBe('Отмена');
  });

  it('переключает локаль на uz и обратно на ru', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    act(() => result.current.setLocale('uz'));
    expect(result.current.t('common.cancel')).toBe('Bekor qilish');
    act(() => result.current.setLocale('ru'));
    expect(result.current.t('common.cancel')).toBe('Отмена');
  });

  it('unknown ключ возвращает сам ключ как fallback', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t('does.not.exist')).toBe('does.not.exist');
  });

  it('интерполирует переменные {count} в шаблон через t(key, vars)', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper });
    expect(result.current.t('orders.totalCount', { count: 7 })).toBe(
      '7 заказов',
    );
  });
});
