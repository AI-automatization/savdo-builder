// TMA-A11Y-ROLE-TABINDEX-001: helper для clickable <div>'ов которые
// функционально являются кнопками (карточки, строки списка). Делает их
// доступными с клавиатуры на Telegram Desktop.
//
// Использование:
//   <div {...clickableA11y(() => navigate(...))}>...</div>
//
// Не применять к:
//   - backdrop overlay в модалках (там focus-trap, клик-outside — не keyboard event)
//   - чисто декоративным div'ам с onClick для analytics

import type { KeyboardEvent } from 'react';

interface ClickableA11yProps {
  role: 'button';
  tabIndex: number;
  onClick: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLElement>) => void;
}

export function clickableA11y(
  handler: () => void,
  opts: { disabled?: boolean } = {},
): ClickableA11yProps {
  return {
    role: 'button',
    tabIndex: opts.disabled ? -1 : 0,
    onClick: opts.disabled ? () => {} : handler,
    onKeyDown: (e) => {
      if (opts.disabled) return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handler();
      }
    },
  };
}
