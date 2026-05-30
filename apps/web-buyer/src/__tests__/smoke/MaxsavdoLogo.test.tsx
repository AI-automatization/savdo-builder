// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): MaxsavdoLogo render.
// Знак = реальное изображение из brand-book (public/brand/maxsavdo-mark.png)
// на тёмной скруглённой плашке. Тест защищает контракт компонента:
// role/aria, наличие img, wordmark-режим, size.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';

describe('MaxsavdoLogo', () => {
  it('рендерит знак с role="img" и aria-label="maxsavdo"', () => {
    const { container } = render(<MaxsavdoLogo />);
    const mark = container.querySelector('[role="img"]');
    expect(mark).not.toBeNull();
    expect(mark?.getAttribute('aria-label')).toBe('maxsavdo');
  });

  it('содержит изображение знака из brand-book (public/brand)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const img = container.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('maxsavdo');
    expect(img?.getAttribute('src')).toContain('maxsavdo-mark');
  });

  it('по умолчанию рендерит знак без видимого текста wordmark', () => {
    const { container } = render(<MaxsavdoLogo />);
    expect(container.textContent).not.toContain('maxsavdo');
  });

  it('withWordmark=true добавляет текст "maxsavdo" рядом со знаком', () => {
    const { container } = render(<MaxsavdoLogo withWordmark />);
    expect(container.textContent).toContain('maxsavdo');
    expect(container.querySelector('img')).not.toBeNull();
  });

  it('size прокидывается в размер плашки', () => {
    const { container } = render(<MaxsavdoLogo size={64} />);
    const mark = container.querySelector('[role="img"]') as HTMLElement | null;
    expect(mark).not.toBeNull();
    expect(mark?.style.width).toBe('64px');
    expect(mark?.style.height).toBe('64px');
  });
});
