'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, Copy, ExternalLink, LogOut, MessageCircle, Settings, Store as StoreIcon } from 'lucide-react';
import { useAuth } from '@/lib/auth/context';
import { useStore, useSellerProfile } from '@/hooks/use-seller';
import { useLogout } from '@/hooks/use-auth';
import { card, cardMuted, colors } from '@/lib/styles';

const STATUS_LABEL: Record<string, { text: string; color: string }> = {
  DRAFT:     { text: 'Черновик',     color: colors.textDim },
  SUBMITTED: { text: 'На проверке',  color: colors.warning },
  APPROVED:  { text: 'Одобрен',      color: colors.success },
  REJECTED:  { text: 'Отклонён',     color: colors.danger },
  SUSPENDED: { text: 'Заблокирован', color: colors.danger },
  PUBLISHED: { text: 'Опубликован',  color: colors.success },
};

function avatarLetter(input?: string | null): string {
  if (!input) return '?';
  const trimmed = input.trim();
  if (!trimmed) return '?';
  // For full name "Иван Иванов" → "И". For phone "+998..." → first digit-after-prefix.
  const firstWord = trimmed.split(/\s+/)[0];
  const ch = firstWord.replace(/^\+\d{0,3}/, '').charAt(0) || trimmed.charAt(0);
  return ch.toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: store } = useStore({ enabled: user?.role === 'SELLER' });
  const { data: profile } = useSellerProfile();
  const logoutMutation = useLogout();

  const displayName = profile?.fullName?.trim() || user?.phone || 'Продавец';
  const letter = avatarLetter(profile?.fullName || user?.phone);
  const statusInfo = store?.status ? STATUS_LABEL[store.status] ?? { text: store.status, color: colors.textDim } : null;
  const storeUrl = store ? `https://savdo.uz/${store.slug}` : null;

  async function handleCopy() {
    if (!storeUrl) return;
    try {
      await navigator.clipboard.writeText(storeUrl);
    } catch {
      /* ignore */
    }
  }

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    router.push('/login');
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-5">

      {/* ── Profile header ──────────────────────────────────────────── */}
      <section className="rounded-xl p-6" style={card}>
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold"
              style={{ background: colors.accentMuted, color: colors.accent, border: `1px solid ${colors.accentBorder}` }}
            >
              {letter}
            </div>
            <button
              type="button"
              disabled
              title="Скоро: загрузка аватара"
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-60"
              style={{ background: colors.surfaceElevated, color: colors.textMuted, border: `1px solid ${colors.border}` }}
              aria-label="Изменить фото"
            >
              <Camera size={13} />
            </button>
          </div>

          {/* Identity */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: colors.textPrimary }}>{displayName}</h1>
            <p className="text-sm mt-0.5" style={{ color: colors.textMuted }}>{user?.phone ?? '—'}</p>

            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span
                className="text-[11px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wide"
                style={{ background: colors.accentMuted, color: colors.accent }}
              >
                Продавец
              </span>
              {profile?.sellerType && (
                <span
                  className="text-[11px] px-2 py-0.5 rounded-md"
                  style={{ background: colors.surfaceMuted, color: colors.textMuted, border: `1px solid ${colors.border}` }}
                >
                  {profile.sellerType === 'business' ? 'Бизнес' : 'Физ. лицо'}
                </span>
              )}
              {profile?.telegramUsername && (
                <a
                  href={`https://t.me/${profile.telegramUsername.replace(/^@/, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md transition-opacity hover:opacity-80"
                  style={{ background: 'rgba(56,189,248,0.13)', color: '#7dd3fc', border: '1px solid rgba(125,211,252,0.30)' }}
                >
                  <MessageCircle size={11} /> @{profile.telegramUsername.replace(/^@/, '')}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Store card ──────────────────────────────────────────────── */}
      {store && (
        <section className="rounded-xl overflow-hidden" style={card}>
          <div className="px-6 py-4" style={{ borderBottom: `1px solid ${colors.divider}` }}>
            <p className="text-[11px] uppercase tracking-widest" style={{ color: colors.textDim }}>Ваш магазин</p>
          </div>
          <div className="p-6 flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
              style={{ background: colors.surfaceMuted, border: `1px solid ${colors.border}` }}
            >
              {store.logoUrl ? (
                <Image src={store.logoUrl} alt={store.name} width={56} height={56} unoptimized className="object-cover w-full h-full" />
              ) : (
                <StoreIcon size={22} style={{ color: colors.textDim }} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold truncate" style={{ color: colors.textPrimary }}>{store.name}</h2>
              <p className="text-xs mt-0.5 truncate" style={{ color: colors.textMuted }}>{store.city}</p>
              {statusInfo && (
                <span
                  className="inline-block mt-2 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                  style={{ background: colors.surfaceMuted, color: statusInfo.color, border: `1px solid ${colors.border}` }}
                >
                  {statusInfo.text}
                </span>
              )}
            </div>
          </div>
          {storeUrl && (
            <div
              className="px-6 py-4 flex items-center justify-between gap-3"
              style={{ background: colors.surfaceMuted, borderTop: `1px solid ${colors.divider}` }}
            >
              <span className="text-xs truncate flex-1" style={{ color: colors.textMuted }}>{storeUrl}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
                  style={{ background: colors.accentMuted, color: colors.accent }}
                >
                  <Copy size={12} /> Копировать
                </button>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-opacity hover:opacity-80"
                  style={{ background: colors.surfaceElevated, color: colors.textPrimary, border: `1px solid ${colors.border}` }}
                >
                  <ExternalLink size={12} /> Открыть
                </a>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Actions ─────────────────────────────────────────────────── */}
      <section className="rounded-xl overflow-hidden" style={cardMuted}>
        <Link
          href="/settings"
          className="flex items-center gap-3 px-5 py-4 transition-colors hover:bg-white/[0.03]"
          style={{ borderBottom: `1px solid ${colors.divider}` }}
        >
          <Settings size={16} style={{ color: colors.textMuted }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: colors.textPrimary }}>Настройки</p>
            <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>Магазин, доставка, профиль, уведомления</p>
          </div>
          <span className="text-xs" style={{ color: colors.textDim }}>→</span>
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={logoutMutation.isPending}
          className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-white/[0.03] disabled:opacity-60"
        >
          <LogOut size={16} style={{ color: colors.danger }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium" style={{ color: colors.danger }}>
              {logoutMutation.isPending ? 'Выход…' : 'Выйти из аккаунта'}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: colors.textDim }}>Завершить сессию на этом устройстве</p>
          </div>
        </button>
      </section>
    </div>
  );
}
