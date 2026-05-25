// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): FAQ-001 страница /help.
// Защищает количество Q&A и intro от случайного удаления.
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HelpContent } from '@/components/legal/HelpContent';
import { I18nProvider } from '@/lib/i18n';

describe('HelpContent (/help)', () => {
  it('рендерит 8 заголовков-вопросов (h2)', () => {
    render(
      <I18nProvider>
        <HelpContent />
      </I18nProvider>,
    );
    const headings = screen.getAllByRole('heading', { level: 2 });
    expect(headings).toHaveLength(8);
  });

  it('рендерит intro с контактом support@maxsavdo.uz', () => {
    render(
      <I18nProvider>
        <HelpContent />
      </I18nProvider>,
    );
    expect(screen.getByText(/support@savdo\.uz/)).toBeInTheDocument();
  });

  it('содержит title из i18n (h1)', () => {
    render(
      <I18nProvider>
        <HelpContent />
      </I18nProvider>,
    );
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Помощь и частые вопросы/);
  });
});
