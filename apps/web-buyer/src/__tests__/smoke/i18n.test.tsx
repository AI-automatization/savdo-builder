// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): i18n-инфра web-buyer.
// useTranslation() поведение: default ru, переключение, unknown key fallback, interpolation.
import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nProvider, useTranslation } from '@/lib/i18n';

function Probe() {
  const { t, locale, setLocale } = useTranslation();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="known">{t('legal.backToHome')}</span>
      <span data-testid="unknown">{t('completely.nonexistent.key')}</span>
      <span data-testid="interp">{t('store.inStock', { count: 7 })}</span>
      <button onClick={() => setLocale('uz')}>switch-uz</button>
      <button onClick={() => setLocale('ru')}>switch-ru</button>
    </div>
  );
}

describe('I18nProvider / useTranslation', () => {
  it('initial locale = ru (SSR default)', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('locale')).toHaveTextContent('ru');
    expect(screen.getByTestId('known')).toHaveTextContent('На главную');
  });

  it('переключается на uz и обратно', async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    await user.click(screen.getByText('switch-uz'));
    expect(screen.getByTestId('locale')).toHaveTextContent('uz');
    // 'legal.backToHome' в uz = 'Bosh sahifaga'
    expect(screen.getByTestId('known')).toHaveTextContent(/Bosh sahifaga/);

    await user.click(screen.getByText('switch-ru'));
    expect(screen.getByTestId('locale')).toHaveTextContent('ru');
  });

  it('unknown key → возвращает сам ключ как fallback', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId('unknown')).toHaveTextContent(
      'completely.nonexistent.key',
    );
  });

  it('интерполирует {count} → значение из vars', () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    // 'store.inStock' = 'В наличии · {count} шт' → должно стать «… · 7 шт»
    expect(screen.getByTestId('interp')).toHaveTextContent(/7/);
  });
});
