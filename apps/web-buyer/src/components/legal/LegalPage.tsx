import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { colors } from '@/lib/styles';

interface LegalPageProps {
  title: string;
  effectiveDate: string;
  children: React.ReactNode;
}

export function LegalPage({ title, effectiveDate, children }: LegalPageProps) {
  return (
    <div className="min-h-screen" style={{ background: colors.bg }}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 md:py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm mb-6 transition-opacity hover:opacity-80"
          style={{ color: colors.textMuted }}
        >
          <ArrowLeft size={14} /> На главную
        </Link>
        <article className="prose-content">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1" style={{ color: colors.textStrong }}>
            {title}
          </h1>
          <p className="text-xs mb-8" style={{ color: colors.textMuted }}>
            Вступает в силу: {effectiveDate}
          </p>
          <div
            className="flex flex-col gap-4 text-[15px] leading-relaxed"
            style={{ color: colors.textBody }}
          >
            {children}
          </div>
        </article>
      </div>
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-lg md:text-xl font-semibold mt-6 mb-1 tracking-tight"
      style={{ color: colors.textStrong }}
    >
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc pl-5 flex flex-col gap-1.5">{children}</ul>;
}
