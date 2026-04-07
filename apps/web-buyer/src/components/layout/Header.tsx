"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-notifications";
import { useCart } from "@/hooks/use-cart";

export default function Header() {
  const params = useParams();
  const slug = params?.slug as string | undefined;
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: cart } = useCart();
  const cartCount = cart?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;

  return (
    <header
      className="sticky top-0 z-50 px-4 py-2"
      style={{
        background:           "rgba(255,255,255,0.06)",
        backdropFilter:       "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom:         "1px solid rgba(255,255,255,0.10)",
      }}
    >
      <div className="max-w-md mx-auto flex items-center gap-2">

        {/* Logo */}
        <Link
          href={slug ? `/${slug}` : "/"}
          className="text-lg font-bold flex-shrink-0 mr-1"
          style={{ color: "#A78BFA" }}
        >
          Savdo
        </Link>

        {/* Search — grows to fill space */}
        <div
          className="flex-1 flex items-center gap-2 px-3 h-9 rounded-xl"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.11)" }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="white" className="h-3.5 w-3.5 opacity-40 flex-shrink-0">
            <path fillRule="evenodd" d="M9.965 11.026a5 5 0 1 1 1.06-1.06l2.755 2.754a.75.75 0 1 1-1.06 1.06l-2.755-2.754ZM10.5 7a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Z" clipRule="evenodd" />
          </svg>
          <input
            type="text"
            placeholder="Поиск магазинов..."
            className="grow bg-transparent text-sm outline-none placeholder-white/25 text-white"
          />
        </div>

        {/* Корзина */}
        <Link href="/cart" className="relative w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ color: "white" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {cartCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "#A78BFA", color: "#0d0d1f" }}
            >
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </Link>

        {/* Уведомления */}
        <Link href="/notifications" className="relative w-9 h-9 flex items-center justify-center rounded-xl flex-shrink-0" style={{ color: "white" }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 w-4 h-4 flex items-center justify-center rounded-full text-[10px] font-bold"
              style={{ background: "#A78BFA", color: "#0d0d1f" }}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Link>

      </div>
    </header>
  );
}
