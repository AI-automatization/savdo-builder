// apps/web-buyer/src/components/home/HomeQuickLinks.tsx
'use client';

import Link from 'next/link';
import { Package, MessageSquare, ChevronRight } from 'lucide-react';
import { colors } from '@/lib/styles';

export function HomeQuickLinks() {
  return (
    <section className="px-4 sm:px-6 mt-10 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <QuickLink
          href="/orders"
          icon={<Package size={18} style={{ color: colors.brand }} />}
          title="Мои заказы"
          subtitle="Статус доставки и история"
        />
        <QuickLink
          href="/chats"
          icon={<MessageSquare size={18} style={{ color: colors.brand }} />}
          title="Чаты с продавцами"
          subtitle="Вопросы по заказу или товару"
        />
      </div>
    </section>
  );
}

function QuickLink({
  href,
  icon,
  title,
  subtitle,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3.5 rounded-md transition-all hover:-translate-y-0.5"
      style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
    >
      <div
        className="w-10 h-10 rounded-md flex items-center justify-center flex-shrink-0"
        style={{ background: colors.brandMuted }}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate" style={{ color: colors.textStrong }}>
          {title}
        </p>
        <p className="text-[11px] mt-0.5" style={{ color: colors.textMuted }}>
          {subtitle}
        </p>
      </div>
      <ChevronRight size={14} className="ml-auto flex-shrink-0" style={{ color: colors.textDim }} />
    </Link>
  );
}
