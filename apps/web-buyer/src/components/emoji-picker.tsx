'use client';

import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';
import { colors } from '@/lib/styles';
import { useTranslation } from '@/lib/i18n';

type EmojiCatKey = 'smiles' | 'gestures' | 'hearts' | 'animals' | 'food' | 'money' | 'objects' | 'symbols';

const EMOJI: { key: EmojiCatKey; icon: string; items: string[] }[] = [
  {
    key: 'smiles',
    icon: '😀',
    items: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤧','🥵','🥶','😎','🥳','🤓','🧐'],
  },
  {
    key: 'gestures',
    icon: '👍',
    items: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','✋','🤚','🖐','🖖','👋','🤝','🙌','👏','🤲','🙏','💪','🦵','🦶','🦾','🦿'],
  },
  {
    key: 'hearts',
    icon: '❤️',
    items: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌'],
  },
  {
    key: 'animals',
    icon: '🐶',
    items: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋'],
  },
  {
    key: 'food',
    icon: '🍔',
    items: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥙','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪'],
  },
  {
    key: 'money',
    icon: '💰',
    items: ['💰','💵','💴','💶','💷','💸','💳','🧾','🪙','💎','⚖️','🏦','💼','📈','📉','📊','💹'],
  },
  {
    key: 'objects',
    icon: '🎁',
    items: ['🎁','🎈','🎉','🎊','🎀','🛒','📦','📱','💻','⌚','📷','📺','📻','🎮','📚','✏️','📝','📌','📎','🔑','🔒','🔓','🔔','🔕','📢','📣','💡','🔦','🕯','🛏','🛋','🚪','🪑','🚿','🛁','🧴','🧷','🧹','🧼','🪒','🧽'],
  },
  {
    key: 'symbols',
    icon: '✅',
    items: ['✅','❌','⭕','🚫','⛔','📛','🆗','🆕','🆒','🆓','🆙','💯','🔥','⭐','🌟','💫','✨','⚡','☀️','🌈','❗','❓','‼️','⁉️','💤','💢','💥','💦','💨','🕐','✔️','☑️','🔘','🔴','🟢','🔵','🟡','🟣','🟠','⚫','⚪','🟤'],
  },
];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
}

export function EmojiPicker({ onPick }: EmojiPickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const items = EMOJI[tab]?.items ?? [];

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t('emoji.ariaLabel')}
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
        style={{
          color: open ? colors.brand : colors.textMuted,
          background: open ? colors.brandMuted : 'transparent',
        }}
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 rounded-lg overflow-hidden flex flex-col"
          style={{
            zIndex: 60,
            width: 320,
            background: colors.surface,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 4px 12px rgba(31,26,18,0.08)',
          }}
        >
          {/* Tabs */}
          <div
            className="flex items-center gap-0.5 px-1.5 py-1.5 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: `1px solid ${colors.divider}` }}
          >
            {EMOJI.map((g, i) => (
              <button
                key={g.key}
                type="button"
                onClick={() => setTab(i)}
                title={t(`emoji.cat.${g.key}`)}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-base transition-colors"
                style={{
                  background: tab === i ? colors.brandMuted : 'transparent',
                  border: tab === i ? `1px solid ${colors.brandBorder}` : '1px solid transparent',
                }}
              >
                {g.icon}
              </button>
            ))}
          </div>
          {/* Grid */}
          <div className="overflow-y-auto p-2" style={{ maxHeight: 220 }}>
            <div className="grid grid-cols-8 gap-1">
              {items.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => onPick(e)}
                  className="w-9 h-9 flex items-center justify-center rounded-md text-xl hover-soft"
                  style={{ background: 'transparent' }}
                  aria-label={e}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
