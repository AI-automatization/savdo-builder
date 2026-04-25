'use client';

import { useEffect, useRef, useState } from 'react';
import { Smile } from 'lucide-react';

const EMOJI: { name: string; icon: string; items: string[] }[] = [
  {
    name: 'Смайлы',
    icon: '😀',
    items: ['😀','😃','😄','😁','😆','😅','🤣','😂','🙂','🙃','😉','😊','😇','🥰','😍','😘','😗','😚','😙','😋','😛','😜','🤪','😝','🤑','🤗','🤭','🤫','🤔','🫡','🤐','🤨','😐','😑','😶','😏','😒','🙄','😬','🤥','😌','😔','😪','🤤','😴','😷','🤒','🤕','🤧','🥵','🥶','😎','🥳','🤓','🧐'],
  },
  {
    name: 'Жесты',
    icon: '👍',
    items: ['👍','👎','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','✋','🤚','🖐','🖖','👋','🤝','🙌','👏','🤲','🙏','💪','🦵','🦶','🦾','🦿'],
  },
  {
    name: 'Сердца',
    icon: '❤️',
    items: ['❤️','🧡','💛','💚','💙','💜','🖤','🤍','🤎','💔','❣️','💕','💞','💓','💗','💖','💘','💝','💟','💌'],
  },
  {
    name: 'Животные',
    icon: '🐶',
    items: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🐛','🦋','🐌','🐞','🐢','🐍','🦎','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋'],
  },
  {
    name: 'Еда',
    icon: '🍔',
    items: ['🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🫐','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🥬','🥒','🌶','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🥞','🧇','🥓','🥩','🍗','🍖','🌭','🍔','🍟','🍕','🥪','🌮','🌯','🥙','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🍤','🍙','🍚','🍘','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪'],
  },
  {
    name: 'Деньги',
    icon: '💰',
    items: ['💰','💵','💴','💶','💷','💸','💳','🧾','🪙','💎','⚖️','🏦','💼','📈','📉','📊','💹'],
  },
  {
    name: 'Объекты',
    icon: '🎁',
    items: ['🎁','🎈','🎉','🎊','🎀','🛒','📦','📱','💻','⌚','📷','📺','📻','🎮','📚','✏️','📝','📌','📎','🔑','🔒','🔓','🔔','🔕','📢','📣','💡','🔦','🕯','🛏','🛋','🚪','🪑','🚿','🛁','🧴','🧷','🧹','🧼','🪒','🧽'],
  },
  {
    name: 'Символы',
    icon: '✅',
    items: ['✅','❌','⭕','🚫','⛔','📛','🆗','🆕','🆒','🆓','🆙','💯','🔥','⭐','🌟','💫','✨','⚡','☀️','🌈','❗','❓','‼️','⁉️','💤','💢','💥','💦','💨','🕐','✔️','☑️','🔘','🔴','🟢','🔵','🟡','🟣','🟠','⚫','⚪','🟤'],
  },
];

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
}

export function EmojiPicker({ onPick }: EmojiPickerProps) {
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
        aria-label="Эмодзи"
        className="w-9 h-9 flex items-center justify-center rounded-lg transition-colors hover:opacity-80"
        style={{
          color: open ? '#A78BFA' : 'rgba(255,255,255,0.55)',
          background: open ? 'rgba(167,139,250,.18)' : 'transparent',
        }}
      >
        <Smile size={18} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 rounded-xl overflow-hidden flex flex-col"
          style={{
            zIndex: 60,
            width: 320,
            background: 'rgba(15,23,42,0.96)',
            backdropFilter: 'blur(18px)',
            border: '1px solid rgba(167,139,250,0.30)',
            boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
          }}
        >
          {/* Tabs */}
          <div
            className="flex items-center gap-0.5 px-1.5 py-1.5 overflow-x-auto flex-shrink-0"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
          >
            {EMOJI.map((g, i) => (
              <button
                key={g.name}
                type="button"
                onClick={() => setTab(i)}
                title={g.name}
                className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-md text-base transition-colors"
                style={{
                  background: tab === i ? 'rgba(167,139,250,0.22)' : 'transparent',
                  border: tab === i ? '1px solid rgba(167,139,250,0.40)' : '1px solid transparent',
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
                  className="w-9 h-9 flex items-center justify-center rounded-md text-xl transition-colors hover:bg-white/5"
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
