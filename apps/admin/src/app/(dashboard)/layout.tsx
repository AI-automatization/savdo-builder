"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Store,
  ShoppingCart,
  Package,
  Shield,
  ScrollText,
  ChevronRight,
  Bell,
  Sun,
  Moon,
  LogOut,
} from "lucide-react";
import { useState, useEffect } from "react";

const navItems = [
  { href: "/dashboard",  label: "Дашборд",   icon: LayoutDashboard },
  { href: "/sellers",    label: "Продавцы",   icon: Users },
  { href: "/stores",     label: "Магазины",   icon: Store },
  { href: "/orders",     label: "Заказы",     icon: ShoppingCart },
  { href: "/products",   label: "Товары",     icon: Package },
];

const bottomNavItems = [
  { href: "/moderation", label: "Модерация",  icon: Shield },
  { href: "/audit-logs", label: "Аудит-лог",  icon: ScrollText },
];

const pageTitles: Record<string, string> = {
  "/dashboard":  "Дашборд",
  "/sellers":    "Продавцы",
  "/stores":     "Магазины",
  "/orders":     "Заказы",
  "/products":   "Товары",
  "/moderation": "Модерация",
  "/audit-logs": "Аудит-лог",
};

function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div
        className="flex items-center gap-3 px-5 py-4 border-b"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #818CF8 0%, #6366F1 100%)",
            boxShadow: "0 4px 14px rgba(129,140,248,0.35)",
          }}
        >
          <Store size={18} />
        </div>
        <div>
          <div className="font-bold text-sm" style={{ color: "var(--color-text)" }}>
            Savdo Admin
          </div>
          <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            Панель управления
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 p-3 flex flex-col gap-0.5 overflow-y-auto">
        <div
          className="text-xs font-semibold uppercase tracking-widest px-3 py-2"
          style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
        >
          Главное
        </div>
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive(href) ? "active" : ""}`}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {isActive(href) && (
              <ChevronRight size={13} style={{ opacity: 0.5 }} />
            )}
          </Link>
        ))}

        <div
          className="my-2"
          style={{ height: "1px", background: "var(--color-border)" }}
        />

        <div
          className="text-xs font-semibold uppercase tracking-widest px-3 py-2"
          style={{ color: "var(--color-text-muted)", opacity: 0.6 }}
        >
          Система
        </div>
        {bottomNavItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`nav-item ${isActive(href) ? "active" : ""}`}
          >
            <Icon size={16} />
            <span className="flex-1">{label}</span>
            {isActive(href) && (
              <ChevronRight size={13} style={{ opacity: 0.5 }} />
            )}
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div
        className="p-3 border-t"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2 rounded-lg"
          style={{ background: "var(--color-primary-dim)" }}
        >
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ background: "var(--color-primary)" }}
          >
            A
          </div>
          <div className="flex-1 min-w-0">
            <div
              className="font-semibold truncate"
              style={{ color: "var(--color-text)", fontSize: "12.5px" }}
            >
              Admin
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>
              Superadmin
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

function Topbar({ title }: { title: string }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const theme = localStorage.getItem("admin-theme") ?? "dark";
    setIsDark(theme === "dark");
    document.documentElement.setAttribute("data-theme", theme);
  }, []);

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setIsDark(!isDark);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("admin-theme", next);
  };

  return (
    <header className="admin-topbar">
      <h1
        className="font-semibold flex-1"
        style={{ color: "var(--color-text)", fontSize: "15px" }}
      >
        {title}
      </h1>
      <div className="flex items-center gap-1.5">
        <button
          onClick={toggleTheme}
          className="btn-ghost"
          style={{ padding: "6px 8px" }}
          title={isDark ? "Светлая тема" : "Тёмная тема"}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        <button
          className="btn-ghost"
          style={{ padding: "6px 8px" }}
          title="Уведомления"
        >
          <Bell size={15} />
        </button>
        <button className="btn-ghost" style={{ padding: "6px 10px" }}>
          <LogOut size={14} />
          <span style={{ fontSize: "12px" }}>Выйти</span>
        </button>
      </div>
    </header>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const base = "/" + pathname.split("/")[1];
  const title = pageTitles[base] ?? "Savdo Admin";

  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      <Sidebar />
      <div className="admin-content">
        <Topbar title={title} />
        {children}
      </div>
    </div>
  );
}
