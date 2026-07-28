import { Check, X } from 'lucide-react';

type Cell = 'yes' | 'no' | 'commission' | 'expensive';

export type WhyUsDict = {
  title: string;
  cols: { us: string; dm: string; mp: string; builder: string };
  rows: Array<{ label: string; cells: [Cell, Cell, Cell, Cell] }>;
  yes: string;
  no: string;
  commission: string;
  expensive: string;
  note: string;
};

type WhyUsProps = {
  locale: 'uz' | 'ru';
  dict: WhyUsDict;
};

export default function WhyUs({ dict }: WhyUsProps) {
  const cols = [dict.cols.us, dict.cols.dm, dict.cols.mp, dict.cols.builder];

  const renderCell = (c: Cell, isUs: boolean) => {
    if (c === 'yes')
      return (
        <Check
          size={18}
          className="mx-auto"
          style={{ color: isUs ? '#E8A552' : '#4ADE80' }}
          aria-label={dict.yes}
        />
      );
    if (c === 'no')
      return <X size={18} className="mx-auto text-brand-muted" aria-label={dict.no} />;
    if (c === 'commission')
      return <span className="text-xs" style={{ color: '#F5A524' }}>{dict.commission}</span>;
    return <span className="text-xs" style={{ color: '#F5A524' }}>{dict.expensive}</span>;
  };

  return (
    <section className="py-20 lg:py-28">
      <div className="mx-auto w-full max-w-content px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-3xl font-bold tracking-tight text-brand-text sm:text-4xl">
          {dict.title}
        </h2>

        <div
          className="mt-10 overflow-x-auto rounded-xl"
          style={{ border: '1px solid rgba(232,165,82,0.18)' }}
        >
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="bg-brand-surface">
                <th className="border-b border-brand-border px-4 py-3" />
                {cols.map((c, i) => (
                  <th
                    key={c + i}
                    className="border-b border-brand-border px-4 py-3 text-center font-semibold"
                    style={{ color: i === 0 ? '#E8A552' : undefined }}
                  >
                    <span className={i === 0 ? '' : 'text-brand-muted'}>{c}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dict.rows.map((r, ri) => (
                <tr
                  key={r.label}
                  className={ri < dict.rows.length - 1 ? 'border-b border-brand-border' : ''}
                >
                  <td className="px-4 py-3 text-left font-medium text-brand-text">{r.label}</td>
                  {r.cells.map((c, ci) => (
                    <td
                      key={ci}
                      className="px-4 py-3 text-center"
                      style={{ background: ci === 0 ? 'rgba(232,165,82,0.08)' : 'transparent' }}
                    >
                      {renderCell(c, ci === 0)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-brand-muted">
          {dict.note}
        </p>
      </div>
    </section>
  );
}
