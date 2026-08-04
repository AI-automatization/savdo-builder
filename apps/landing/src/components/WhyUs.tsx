import { Check, X } from 'lucide-react';

export type WhyUsCell = 'yes' | 'no' | 'commission' | 'expensive';

export type WhyUsDict = {
  title: string;
  cols: string[];
  rows: Array<{ label: string; cells: WhyUsCell[] }>;
  footnote: string;
};

type WhyUsProps = {
  dict: WhyUsDict;
};

function renderCell(cell: WhyUsCell, isUs: boolean) {
  if (cell === 'yes') return <Check size={18} className="mx-auto" style={{ color: isUs ? '#E8A552' : '#34d399' }} />;
  if (cell === 'no') return <X size={18} className="mx-auto text-brand-muted" />;
  if (cell === 'commission') return <span className="text-xs" style={{ color: '#fbbf24' }}>15%</span>;
  return <span className="text-xs" style={{ color: '#fbbf24' }}>$30+</span>;
}

export default function WhyUs({ dict }: WhyUsProps) {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold tracking-tight text-brand-text sm:text-3xl">{dict.title}</h2>

        {/*
          No scroll-reveal fade here on purpose: this table is the core "why us"
          argument, not decoration — a mid-scroll blur/opacity transition made it
          genuinely hard to read on first exposure (2026-08-04 visual audit).
        */}
        <div className="relative">
          <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(232,165,82,0.18)' }}>
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                  {dict.cols.map((c, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-center font-semibold"
                      style={{ color: i === 1 ? '#E8A552' : '#A0A0A0', borderBottom: '1px solid rgba(232,165,82,0.14)' }}
                    >
                      {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dict.rows.map((row, ri) => (
                  <tr key={row.label} style={{ borderBottom: ri < dict.rows.length - 1 ? '1px solid rgba(232,165,82,0.10)' : 'none' }}>
                    <td className="px-4 py-3 text-left font-medium text-brand-text">{row.label}</td>
                    {row.cells.map((cell, ci) => (
                      <td key={ci} className="px-4 py-3 text-center" style={{ background: ci === 0 ? 'rgba(232,165,82,0.06)' : 'transparent' }}>
                        {renderCell(cell, ci === 0)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/*
            Below 640px the table is wider than the viewport and scrolls, but
            iOS/Android give no persistent scrollbar — without a cue, mobile
            visitors don't know the right-most column exists (2026-08-04 visual
            audit). A static edge fade is a cheap, reliable affordance.
          */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-8 rounded-r-2xl sm:hidden"
            style={{ background: 'linear-gradient(to right, transparent, #0F0F0F)' }}
          />
        </div>
        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-brand-muted">{dict.footnote}</p>
      </div>
    </section>
  );
}
