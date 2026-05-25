"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ShoppingCart, Bell, MessageSquare, User as UserIcon, Package, Heart } from "lucide-react";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useUnreadChatCount } from "@/hooks/use-chat";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/lib/auth/context";
import { colors } from "@/lib/styles";
import { ThemeToggle } from "@/components/theme-toggle";
import { Tooltip } from "@/components/tooltip";
import HeaderSearch from "@/components/layout/HeaderSearch";
import { useTranslation } from "@/lib/i18n";
import { MaxsavdoLogo } from "@/components/brand/MaxsavdoLogo";

export default function Header() {
  const { t } = useTranslation();
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { isAuthenticated } = useAuth();
  const { data: unreadCount = 0 } = useUnreadCount();
  const unreadChatCount = useUnreadChatCount(isAuthenticated);
  const { data: cart } = useCart({ enabled: isAuthenticated });
  const cartCount = cart?.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <header
      className="sticky top-0 z-40 px-4 py-3.5"
      style={{
        background: colors.surface,
        borderBottom: `1px solid ${colors.divider}`,
      }}
    >
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        {/* Logo */}
        <Link
          href={slug ? `/${slug}` : "/"}
          className="flex-shrink-0"
          aria-label="maxsavdo"
        >
          <MaxsavdoLogo size={28} withWordmark />
        </Link>

        {/* Catalog nav — desktop only */}
        <nav className="hidden md:flex items-center gap-4 ml-2 flex-shrink-0">
          <Link
            href="/stores"
            className="text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.textBody }}
          >
            {t('header.stores')}
          </Link>
          <Link
            href="/products"
            className="text-sm font-semibold transition-opacity hover:opacity-80"
            style={{ color: colors.textBody }}
          >
            {t('header.products')}
          </Link>
        </nav>

        {/* Search — grows */}
        <HeaderSearch />

        {/* Desktop nav links — visible md+ */}
        <nav className="hidden md:flex items-center gap-1">
          <NavIconLink href="/chats" badge={unreadChatCount} ariaLabel={t('header.chats')}>
            <MessageSquare size={18} />
          </NavIconLink>
          <NavIconLink href="/orders" ariaLabel={t('header.orders')}>
            <Package size={18} />
          </NavIconLink>
        </nav>

        {/* Wishlist — always visible */}
        <NavIconLink href="/wishlist" ariaLabel={t('header.wishlist')}>
          <Heart size={18} />
        </NavIconLink>

        {/* Cart — always visible */}
        <NavIconLink href="/cart" badge={cartCount} ariaLabel={t('header.cart')}>
          <ShoppingCart size={18} />
        </NavIconLink>

        {/* Notifications — always visible */}
        <NavIconLink href="/notifications" badge={unreadCount} ariaLabel={t('header.notifications')}>
          <Bell size={18} />
        </NavIconLink>

        {/* Theme toggle — always visible */}
        <ThemeToggle bordered={false} />

        {/* Profile — rightmost, desktop only (mobile uses BottomNavBar) */}
        <div className="hidden md:flex">
          <NavIconLink href="/profile" ariaLabel={t('header.profile')}>
            <UserIcon size={18} />
          </NavIconLink>
        </div>
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
    <Tooltip label={ariaLabel}>
      <Link
        href={href}
        aria-label={ariaLabel}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl transition-colors"
        style={{ color: colors.textBody }}
        onMouseEnter={(e) => { e.currentTarget.style.background = colors.surfaceMuted; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
      >
        {children}
        {badge > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full text-[10px] font-bold"
            style={{ background: colors.brand, color: colors.brandTextOnBg }}
          >
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </Link>
    </Tooltip>
  );
}
