// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): MaxsavdoLogo render.
// Знак = реальное изображение из brand-book, без подложки, две версии под тему
// (public/brand/maxsavdo-mark.png + maxsavdo-mark-light.png), переключение CSS.
// Тест защищает контракт: role/aria на wrapper, обе картинки знака, wordmark, size.
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

  it('содержит обе тема-версии знака из brand-book (light + dark)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const imgs = Array.from(container.querySelectorAll('img'));
    expect(imgs.length).toBe(2);
    const srcs = imgs.map((i) => i.getAttribute('src') ?? '');
    expect(srcs.some((s) => s.includes('maxsavdo-mark.png'))).toBe(true); // dark theme
    expect(srcs.some((s) => s.includes('maxsavdo-mark-light.png'))).toBe(true); // light theme
    // обе картинки декоративны — wrapper несёт aria-label
    imgs.forEach((i) => expect(i.getAttribute('alt')).toBe(''));
  });

  it('по умолчанию рендерит знак без видимого текста wordmark', () => {
    const { container } = render(<MaxsavdoLogo />);
    expect(container.textContent).not.toContain('maxsavdo');
  });

  it('withWordmark=true добавляет текст "maxsavdo" рядом со знаком', () => {
    const { container } = render(<MaxsavdoLogo withWordmark />);
    expect(container.textContent).toContain('maxsavdo');
    expect(container.querySelectorAll('img').length).toBe(2);
  });

  it('size задаёт высоту знака', () => {
    const { container } = render(<MaxsavdoLogo size={64} />);
    const mark = container.querySelector('[role="img"]') as HTMLElement | null;
    expect(mark).not.toBeNull();
    expect(mark?.style.height).toBe('64px');
  });
});
