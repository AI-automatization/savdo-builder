// FRONTEND-SMOKE-PLAYWRIGHT-001 (vitest): MaxsavdoLogo render.
// Защищает brand mark от случайного повреждения SVG-геометрии (handle,
// clipPath, gold color). Когда Полат заменит inline-приближение на
// финальный path из BRAND-LOGO-SVG-CREATE-001 — обновить ожидаемые d-атрибуты.
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MaxsavdoLogo } from '@/components/brand/MaxsavdoLogo';

describe('MaxsavdoLogo', () => {
  it('рендерит SVG с role="img" и aria-label="maxsavdo"', () => {
    const { container } = render(<MaxsavdoLogo />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('role')).toBe('img');
    expect(svg?.getAttribute('aria-label')).toBe('maxsavdo');
  });

  it('по умолчанию рендерит mark без wordmark', () => {
    const { container } = render(<MaxsavdoLogo />);
    expect(container.textContent).not.toContain('maxsavdo');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('withWordmark=true добавляет текст "maxsavdo" рядом с mark', () => {
    const { container } = render(<MaxsavdoLogo withWordmark />);
    expect(container.textContent).toContain('maxsavdo');
    expect(container.querySelector('svg')).not.toBeNull();
  });

  it('size прокидывается в width/height SVG', () => {
    const { container } = render(<MaxsavdoLogo size={64} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('64');
    expect(svg?.getAttribute('height')).toBe('64');
  });

  it('знак состоит ровно из двух filled-path слоёв (трассировка brand-book)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const paths = container.querySelectorAll('svg path');
    expect(paths.length).toBe(2); // WHITE_D (N-форма) + GOLD_D (правая M + ручка)
    paths.forEach((p) => {
      expect(p.getAttribute('fill-rule')).toBe('evenodd');
      expect(p.getAttribute('stroke')).toBeNull(); // заливка, не обводка
    });
  });

  it('правая часть + ручка залиты Champagne Gold #C9A876', () => {
    const { container } = render(<MaxsavdoLogo />);
    const gold = Array.from(container.querySelectorAll('svg path')).find(
      (p) => p.getAttribute('fill') === '#C9A876',
    );
    expect(gold).not.toBeUndefined();
  });

  it('левая «N»-форма использует CSS-переменную text-primary (theme-aware)', () => {
    const { container } = render(<MaxsavdoLogo />);
    const themed = Array.from(container.querySelectorAll('svg path')).find(
      (p) => p.getAttribute('fill') === 'var(--color-text-primary)',
    );
    expect(themed).not.toBeUndefined();
  });
});
