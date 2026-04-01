"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  Shield,
  ScrollText,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Дашборд", icon: LayoutDashboard },
  { href: "/sellers", label: "Продавцы", icon: Users },
  { href: "/stores", label: "Магазины", icon: Store },
  { href: "/orders", label: "Заказы", icon: ShoppingCart },
  { href: "/products", label: "Товары", icon: Package },
];

const bottomNavItems = [
  { href: "/moderation", label: "Модерация", icon: Shield, badge: true },
  { href: "/audit-logs", label: "Аудит-лог", icon: ScrollText },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
          style={{ background: "var(--color-primary)" }}>
          S
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>Savdo</div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>Admin Panel</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? "active" : ""}`}>
            <Icon size={16} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </Link>
        ))}

        <div className="my-2" style={{ height: "1px", background: "var(--color-border)" }} />

        {bottomNavItems.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={`nav-item ${isActive(href) ? "active" : ""}`}>
            <Icon size={16} />
            <span>{label}</span>
            {isActive(href) && <ChevronRight size={14} className="ml-auto opacity-50" />}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t" style={{ borderColor: "var(--color-border)" }}>
        <div className="nav-item text-xs" style={{ color: "var(--color-text-muted)" }}>
          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
            style={{ background: "var(--color-primary)" }}>
            A
          </div>
          <div>
            <div className="font-medium" style={{ color: "var(--color-text)", fontSize: "13px" }}>Admin</div>
            <div style={{ fontSize: "11px" }}>Superadmin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
