"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { Search, ShoppingCart, Bell, MessageSquare, User as UserIcon, Package, Heart } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useUnreadChatCount } from "@/hooks/use-chat";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/lib/auth/context";
import { colors } from "@/lib/styles";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Header() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { isAuthenticated } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const unreadChatCount = useUnreadChatCount(isAuthenticated);
  const { data: cart } = useCart();
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <header
      className="sticky top-0 z-40 px-4 py-2.5"
      style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.divider}`,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Logo */}
        <Link
          href={slug ? `/${slug}` : "/"}
          className="text-lg font-bold flex-shrink-0"
          style={{ color: colors.brand }}
        >
          Savdo
        </Link>

        {/* Search — grows */}
        <div
          className="flex-1 flex items-center gap-2 px-3 h-9 rounded-xl"
          style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
        >
          <Search size={14} style={{ color: colors.textDim }} className="flex-shrink-0" />
          <input
            type="text"
            placeholder="Поиск магазинов..."
            className="grow bg-transparent text-sm outline-none"
            style={{ color: colors.textPrimary }}
          />
        </div>

        {/* Desktop nav links — visible md+ */}
        <nav className="hidden md:flex items-center gap-1">
          <NavIconLink href="/chats" badge={unreadChatCount} ariaLabel="Чаты">
            <MessageSquare size={18} />
          </NavIconLink>
          <NavIconLink href="/orders" ariaLabel="Заказы">
            <Package size={18} />
          </NavIconLink>
          <NavIconLink href="/profile" ariaLabel="Профиль">
            <UserIcon size={18} />
          </NavIconLink>
        </nav>

        {/* Wishlist — always visible */}
        <NavIconLink href="/wishlist" ariaLabel="Избранное">
          <Heart size={18} />
        </NavIconLink>

        {/* Cart — always visible */}
        <NavIconLink href="/cart" badge={cartCount} ariaLabel="Корзина">
          <ShoppingCart size={18} />
        </NavIconLink>

        {/* Notifications — always visible */}
        <NavIconLink href="/notifications" badge={unreadCount} ariaLabel="Уведомления">
          <Bell size={18} />
        </NavIconLink>

        {/* Theme toggle — always visible */}
        <ThemeToggle bordered={false} />
      </div>
    </header>
  );
}

function NavIconLink({
  href,
  children,
  badge = 0,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  badge?: number;
  ariaLabel: string;
}) {
  return (
    <Link
      href={href}
      aria-label={ariaLabel}
      className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
      style={{ color: colors.textPrimary }}
      onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceMuted; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
      {badge > 0 && (
        <span
          className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{ background: colors.accent, color: colors.accentTextOnBg }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </Link>
  );
}
