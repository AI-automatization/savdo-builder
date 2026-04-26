'use client';

import type { ProductDisplayType } from 'types';
import { colors } from '@/lib/styles';

interface Option {
  value: ProductDisplayType;
  label: string;
  hint: string;
  preview: React.ReactNode;
}

const OPTIONS: Option[] = [
  {
    value: 'SINGLE',
    label: 'Одно фото',
    hint: 'Главное фото товара. Подходит когда фотография одна или достаточно одной.',
    preview: <SinglePreview />,
  },
  {
    value: 'SLIDER',
    label: 'Слайдер',
    hint: 'Несколько фото — покупатель листает свайпом. Точки-индикаторы внизу карточки.',
    preview: <SliderPreview />,
  },
  {
    value: 'COLLAGE_2X2',
    label: 'Сетка 2×2',
    hint: 'Сразу 4 фото в карточке — для одежды, аксессуаров, наборов. Загрузите минимум 2 фото.',
    preview: <CollagePreview />,
  },
];

interface Props {
  value: ProductDisplayType;
  onChange: (v: ProductDisplayType) => void;
}

export function DisplayTypeSelector({ value, onChange }: Props) {
  const active = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div>
      <div className="grid grid-cols-3 gap-2">
        {OPTIONS.map((opt) => {
          const isActive = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              aria-pressed={isActive}
              className="rounded-md p-2 flex flex-col items-center gap-1.5 transition-all"
              style={{
                background: isActive ? colors.accentMuted : colors.surfaceMuted,
                border: `1px solid ${isActive ? colors.accentBorder : colors.border}`,
              }}
            >
              <div className="w-12 h-12 rounded-md overflow-hidden flex items-center justify-center"
                style={{ background: colors.surfaceSunken, border: `1px solid ${colors.border}` }}>
                {opt.preview}
              </div>
              <span className="text-[11px] font-semibold leading-tight"
                style={{ color: isActive ? colors.accent : colors.textPrimary }}>
                {opt.label}
              </span>
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-[11px] leading-relaxed" style={{ color: colors.textDim }}>
        {active.hint}
      </p>
    </div>
  );
}

// ── Mini previews ────────────────────────────────────────────────────────────

function SinglePreview() {
  return (
    <div className="w-8 h-8 rounded-sm" style={{ background: colors.surfaceElevated, border: `1px solid ${colors.borderStrong}` }} />
  );
}

function SliderPreview() {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-7 rounded-sm" style={{ background: colors.surfaceElevated, border: `1px solid ${colors.borderStrong}` }} />
      <div className="flex gap-0.5">
        <span className="w-2 h-1 rounded-full" style={{ background: colors.accent }} />
        <span className="w-1 h-1 rounded-full" style={{ background: colors.textDim }} />
        <span className="w-1 h-1 rounded-full" style={{ background: colors.textDim }} />
      </div>
    </div>
  );
}

function CollagePreview() {
  return (
    <div className="grid grid-cols-2 gap-0.5 w-8 h-8">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="rounded-[1px]" style={{ background: colors.surfaceElevated, border: `1px solid ${colors.borderStrong}` }} />
      ))}
    </div>
  );
}
