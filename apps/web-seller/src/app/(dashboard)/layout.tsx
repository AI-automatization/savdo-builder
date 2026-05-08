"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { track } from "../../lib/analytics";
import { useStore } from "../../hooks/use-seller";
import { useSellerSocket } from "../../hooks/use-seller-socket";
import { useAuth } from "../../lib/auth/context";
import { useLogout } from "../../hooks/use-auth";
import { useUnreadCount } from "../../hooks/use-notifications";
import { useUnreadChatCount } from "../../hooks/use-chat";
import { useSellerOrders } from "../../hooks/use-orders";
import { OrderStatus } from "types";
import { ShoppingCart } from "lucide-react";
import { colors, shell, shellTop } from "@/lib/styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { buyerStoreDisplay, buyerStoreUrl } from "@/lib/buyer-url";

// ── Nav items ─────────────────────────────────────────────────────────────────

const NAV = [
  {
    href:  "/dashboard",
    label: "Дашборд",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg>,
  },
  {
    href:  "/products",
    label: "Товары",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" /></svg>,
  },
  {
    href:  "/orders",
    label: "Заказы",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>,
  },
  {
    href:  "/chat",
    label: "Чаты",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
  },
  {
    href:  "/analytics",
    label: "Аналитика",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" /></svg>,
  },
  {
    href:  "/settings",
    label: "Настройки",
    icon:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  },
];

// ── Sidebar content ───────────────────────────────────────────────────────────

interface SidebarProps {
  pathname: string;
  pendingCount: number;
  unreadChatCount: number;
  store: { slug: string; id: string } | undefined;
  userPhone: string | undefined;
  logoutPending: boolean;
  onLogout: () => void;
  onCopyLink: () => void;
}

function SidebarContent({ pathname, pendingCount, unreadChatCount, store, userPhone, logoutPending, onLogout, onCopyLink }: SidebarProps) {
  return (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5" style={{ borderBottom: `1px solid ${colors.divider}` }}>
        <Link href="/dashboard" className="flex items-center gap-2.5 transition-opacity hover:opacity-80">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: colors.accent }}
          >
            <ShoppingCart size={16} color={colors.accentTextOnBg} />
          </div>
          <span className="text-base font-bold" style={{ color: colors.brand }}>Savdo</span>
        </Link>
        <span className="ml-auto text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ background: colors.accentMuted, color: colors.accent }}>Beta</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {NAV.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isOrders = href === "/orders";
          const isChat = href === "/chat";
          const badge = isOrders ? pendingCount : isChat ? unreadChatCount : 0;
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={
                active
                  ? { background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }
                  : { color: colors.textMuted, border: "1px solid transparent" }
              }
            >
              <span style={{ opacity: active ? 1 : 0.75 }}>{icon}</span>
              <span className="flex-1">{label}</span>
              {badge > 0 && (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={
                    isChat
                      ? { background: colors.accentMuted, color: colors.accent, minWidth: 18, textAlign: "center" }
                      : { background: "rgba(251,191,36,.18)", color: colors.warning, minWidth: 18, textAlign: "center" }
                  }
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Store link shortcut */}
      <div className="px-3 py-4" style={{ borderTop: `1px solid ${colors.divider}` }}>
        <div className="px-3 py-2.5 rounded-lg" style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}>
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: colors.textDim }}>Ваш магазин</p>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs truncate" style={{ color: colors.textMuted }}>
              {store ? buyerStoreDisplay(store.slug) : 'savdo.uz/...'}
            </span>
            <button
              className="text-[11px] px-2 py-0.5 rounded-md flex-shrink-0 transition-opacity hover:opacity-80"
              style={{ background: colors.accentMuted, color: colors.accent }}
              onClick={onCopyLink}
            >
              Копировать
            </button>
          </div>
        </div>
      </div>

      {/* User — clickable opens /profile */}
      <div
        className="flex items-center gap-2 px-2 py-2"
        style={{ borderTop: `1px solid ${colors.divider}` }}
      >
        <Link
          href="/profile"
          className="flex-1 flex items-center gap-3 px-2 py-1.5 rounded-lg transition-colors min-w-0"
          style={
            pathname === '/profile' || pathname.startsWith('/profile')
              ? { background: colors.accentMuted, border: `1px solid ${colors.accentBorder}` }
              : { border: '1px solid transparent' }
          }
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
            style={{ background: colors.accentMuted, color: colors.accent }}
          >
            А
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: colors.textPrimary }}>{userPhone ?? '—'}</p>
            <p className="text-[10px] truncate" style={{ color: colors.textDim }}>Личный кабинет</p>
          </div>
        </Link>
        <button
          onClick={onLogout}
          disabled={logoutPending}
          title="Выйти"
          style={{ color: colors.textDim }}
          className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg disabled:opacity-40 hover:opacity-80 row-hoverable transition-opacity"
          aria-label="Выйти"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
          </svg>
        </button>
      </div>
    </>
  );
}

// ── Layout ────────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { data: store, isLoading: storeLoading, error: storeError } = useStore({ enabled: user?.role === 'SELLER' });
  const { toasts } = useSellerSocket();
  const { data: unreadCount = 0 } = useUnreadCount();
  const unreadChatCount = useUnreadChatCount();
  const { data: pendingOrders } = useSellerOrders({ status: OrderStatus.PENDING });
  const pendingCount = pendingOrders?.meta.total ?? 0;
  const logoutMutation = useLogout();
  const [mounted, setMounted] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!isAuthenticated) { router.replace('/login'); return; }
    // BUYER в дашборде продавца → редирект на онбординг
    if (user && user.role !== 'SELLER') router.replace('/onboarding');
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (!storeLoading && storeError) {
      const status = (storeError as { response?: { status?: number } }).response?.status;
      // 404 = магазин не создан → онбординг
      // 403 = STORE_NOT_APPROVED / STORE_SUSPENDED → НЕ редиректим на онбординг,
      //       иначе будет бесконечный цикл dashboard ↔ onboarding
      if (status === 404) router.replace('/onboarding');
    }
  }, [storeLoading, storeError, router]);

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.push('/login');
  }

  if (!mounted || !isAuthenticated) return null;

  const sidebarProps: SidebarProps = {
    pathname,
    pendingCount,
    unreadChatCount,
    store: store ? { slug: store.slug, id: store.id } : undefined,
    userPhone: user?.phone,
    logoutPending: logoutMutation.isPending,
    onLogout: handleLogout,
    onCopyLink: () => {
      if (!store) return;
      navigator.clipboard.writeText(buyerStoreUrl(store.slug));
      track.storeLinkCopied(store.id);
    },
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: colors.bg }}>

      {/* ── Sidebar — desktop ── */}
      <aside
        className="hidden md:flex relative w-60 flex-shrink-0 flex-col h-full"
        style={{ ...shell, zIndex: 10 }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0"
          style={{ background: "rgba(0,0,0,0.65)", zIndex: 40 }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar — mobile drawer ── */}
      <aside
        className="md:hidden fixed top-0 left-0 h-full w-64 flex flex-col transition-transform duration-300"
        style={{
          ...shell,
          zIndex: 50,
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
        }}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Main area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative" style={{ zIndex: 1 }}>

        {/* Top header */}
        <header
          className="flex items-center justify-between px-4 md:px-6 h-14 flex-shrink-0"
          style={shellTop}
        >
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:opacity-80"
              style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
              onClick={() => setMobileOpen(true)}
              aria-label="Открыть меню"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
            <h2 className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
              {NAV.find(n => pathname === n.href || (n.href !== "/dashboard" && pathname.startsWith(n.href)))?.label
                ?? (pathname.startsWith("/profile") ? "Личный кабинет" : "Дашборд")}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notifications bell */}
            <button
              onClick={() => router.push('/notifications')}
              className="relative transition-opacity hover:opacity-80"
              style={{ color: colors.textMuted }}
              aria-label="Уведомления"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              {unreadCount > 0 && (
                <span
                  className="absolute -top-1 -right-1.5 flex items-center justify-center rounded-full font-bold"
                  style={{ minWidth: 14, height: 14, padding: '0 3px', fontSize: 9, background: colors.accent, color: colors.accentTextOnBg, borderRadius: 7 }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6" style={{ background: colors.bg }}>
          {children}
        </main>
      </div>

      {/* Socket.IO toasts */}
      {toasts.length > 0 && (
        <div className="fixed bottom-6 right-6 flex flex-col gap-2.5" style={{ zIndex: 100 }}>
          {toasts.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium shadow-xl"
              style={{
                background: colors.surfaceElevated,
                color: colors.textPrimary,
                border: `1px solid ${colors.accentBorder}`,
                boxShadow: '0 12px 28px rgba(0,0,0,0.45)',
                animation: 'fadeSlideIn 0.25s ease',
              }}
            >
              <ShoppingCart size={16} style={{ color: colors.accent }} />
              {t.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
