import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelegram } from '@/providers/TelegramProvider';
import { subscribeToChatUnread } from '@/lib/chatUnread';

interface NavItem {
  path: string;
  label: string;
  icon: string;
  exact?: boolean;
}

const sellerItems: NavItem[] = [
  { path: '/seller',          label: 'Дашборд', icon: '📊', exact: true },
  { path: '/seller/store',    label: 'Магазин', icon: '🏪' },
  { path: '/seller/products', label: 'Товары',  icon: '📦' },
  { path: '/seller/orders',   label: 'Заказы',  icon: '📋' },
  { path: '/seller/chat',     label: 'Чат',     icon: '💬' },
];

const buyerItems: NavItem[] = [
  { path: '/buyer',          label: 'Магазины',  icon: '🏪', exact: true },
  { path: '/buyer/wishlist', label: 'Избранное', icon: '❤️' },
  { path: '/buyer/cart',     label: 'Корзина',   icon: '🛒' },
  { path: '/buyer/orders',   label: 'Заказы',    icon: '📦' },
  { path: '/buyer/chat',     label: 'Чат',       icon: '💬' },
];

function isActive(path: string, pathname: string, exact?: boolean): boolean {
  if (exact) return pathname === path;
  return pathname === path || pathname.startsWith(path + '/');
}

export const SIDEBAR_WIDTH = 220;

export function Sidebar({ role }: { role: 'BUYER' | 'SELLER' }) {
  const items = role === 'SELLER' ? sellerItems : buyerItems;
  const location = useLocation();
  const navigate = useNavigate();
  const { user: tgUser, tg } = useTelegram();
  const settingsPath = role === 'SELLER' ? '/seller/settings' : '/buyer/settings';
  const settingsActive = isActive(settingsPath, location.pathname);

  // UX-002: badge unread chat
  const [chatUnread, setChatUnread] = useState(0);
  useEffect(() => subscribeToChatUnread(setChatUnread), []);

  return (
    <aside
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: SIDEBAR_WIDTH,
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px 10px 12px',
        background: 'rgba(9,7,18,0.96)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderRight: '1px solid var(--tg-border-soft)',
        boxShadow: '4px 0 24px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── Brand ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 6px 18px' }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: 'var(--tg-accent)',
          boxShadow: '0 4px 12px var(--tg-accent-glow)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 18,
        }}>
          {role === 'SELLER' ? '🏪' : '🛍'}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--tg-accent)', lineHeight: 1.2, letterSpacing: '-0.3px' }}>
            Savdo
          </p>
          <p style={{ fontSize: 10, color: 'var(--tg-text-dim)', marginTop: 1 }}>
            {role === 'SELLER' ? 'Панель продавца' : 'Каталог'}
          </p>
        </div>
      </div>

      {/* ── Nav ───────────────────────────────────────────────────────────── */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, overflow: 'hidden' }}>
        {items.map((item) => {
          const active = isActive(item.path, location.pathname, item.exact);
          return (
            <button
              key={item.path}
              onClick={() => {
                if (!active) {
                  try { tg?.HapticFeedback?.selectionChanged(); } catch { /* noop */ }
                  navigate(item.path);
                }
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 10px',
                borderRadius: 11,
                border: active
                  ? '1px solid var(--tg-accent-border)'
                  : '1px solid transparent',
                background: active
                  ? 'var(--tg-accent-bg)'
                  : 'transparent',
                color: active ? 'var(--tg-accent-text)' : 'var(--tg-text-secondary)',
                fontSize: 13,
                fontWeight: active ? 600 : 400,
                cursor: active ? 'default' : 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--tg-surface)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--tg-text-secondary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--tg-text-secondary)';
                }
              }}
            >
              <span style={{ fontSize: 17, flexShrink: 0, filter: active ? 'none' : 'grayscale(40%)' }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {/* UX-002: chat unread badge */}
              {item.path.endsWith('/chat') && chatUnread > 0 && (
                <span style={{
                  minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9,
                  background: 'var(--tg-accent)',
                  color: '#fff', fontSize: 10, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0, boxShadow: '0 0 8px var(--tg-accent-glow)',
                  lineHeight: 1,
                }}>
                  {chatUnread > 99 ? '99+' : chatUnread}
                </span>
              )}
              {active && !item.path.endsWith('/chat') && (
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: 'var(--tg-accent)',
                  flexShrink: 0,
                  boxShadow: '0 0 6px var(--tg-accent-glow)',
                }} />
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Divider ───────────────────────────────────────────────────────── */}
      <div style={{ height: 1, background: 'var(--tg-surface-hover)', margin: '6px 4px' }} />

      {/* ── Settings ──────────────────────────────────────────────────────── */}
      <button
        onClick={() => navigate(settingsPath)}
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '9px 10px', borderRadius: 11, width: '100%', textAlign: 'left',
          border: settingsActive ? '1px solid var(--tg-accent-border)' : '1px solid transparent',
          background: settingsActive ? 'var(--tg-accent-bg)' : 'transparent',
          color: settingsActive ? 'var(--tg-accent-text)' : 'var(--tg-text-muted)',
          fontSize: 13, cursor: 'pointer', marginBottom: 4,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => {
          if (!settingsActive) {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--tg-surface)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--tg-text-secondary)';
          }
        }}
        onMouseLeave={(e) => {
          if (!settingsActive) {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--tg-text-muted)';
          }
        }}
      >
        <span style={{ fontSize: 17, filter: settingsActive ? 'none' : 'grayscale(40%)' }}>⚙️</span>
        <span>Настройки</span>
      </button>

      {/* ── User card ─────────────────────────────────────────────────────── */}
      {tgUser && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '10px 10px',
          borderRadius: 11,
          background: 'var(--tg-surface)',
          border: '1px solid var(--tg-border-soft)',
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 9, flexShrink: 0,
            background: role === 'SELLER'
              ? 'var(--tg-accent)'
              : 'linear-gradient(135deg, #059669, #34d399)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {tgUser.first_name?.[0]?.toUpperCase() ?? '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <p style={{
              fontSize: 12, fontWeight: 600, color: 'var(--tg-text-primary)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {tgUser.first_name}{tgUser.last_name ? ` ${tgUser.last_name}` : ''}
            </p>
            {tgUser.username && (
              <p style={{ fontSize: 10, color: 'var(--tg-text-dim)', marginTop: 1 }}>
                @{tgUser.username}
              </p>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
