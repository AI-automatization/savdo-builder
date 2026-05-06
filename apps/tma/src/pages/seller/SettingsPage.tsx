import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { useAuth } from '@/providers/AuthProvider';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { showToast } from '@/components/ui/Toast';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface SellerProfile {
  id: string;
  fullName: string;
  sellerType: string;
  telegramUsername: string;
  telegramNotificationsActive: boolean;
  store?: {
    id: string;
    isPublic: boolean;
    status: string;
  };
}

function Toggle({ on, onChange, disabled }: { on: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      style={{
        width: 44,
        height: 26,
        borderRadius: 13,
        background: on ? '#A855F7' : 'rgba(255,255,255,0.15)',
        border: 'none',
        cursor: disabled ? 'wait' : 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 21 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'left 0.18s',
        }}
      />
    </button>
  );
}

export default function SellerSettingsPage() {
  const { tg } = useTelegram();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    tg?.HapticFeedback.notificationOccurred('warning');
    logout();
    navigate('/', { replace: true });
  };
  const [profile, setProfile] = useState<SellerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [sellerType, setSellerType] = useState<'individual' | 'business'>('individual');
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    api<SellerProfile>('/seller/me', { signal: ac.signal })
      .then((p) => {
        if (ac.signal.aborted) return;
        setProfile(p);
        setFullName(p.fullName ?? '');
        setSellerType(p.sellerType === 'business' ? 'business' : 'individual');
      })
      .catch((err: unknown) => {
        if (ac.signal.aborted) return;
        if (err instanceof Error && err.name === 'AbortError') return;
        showToast('Не удалось загрузить профиль', 'error');
      })
      .finally(() => { if (!ac.signal.aborted) setLoading(false); });
    return () => ac.abort();
  }, []);

  const saveProfile = async () => {
    if (!profile || saving) return;
    setSaving(true);
    try {
      await api('/seller/me', { method: 'PATCH', body: { fullName: fullName.trim(), sellerType } });
      tg?.HapticFeedback.notificationOccurred('success');
      showToast('✅ Профиль сохранён');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
      showToast('❌ Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const toggleNotifications = async () => {
    if (!profile || toggling) return;
    const next = !profile.telegramNotificationsActive;
    setToggling(true);
    setProfile((p) => p ? { ...p, telegramNotificationsActive: next } : p);
    try {
      await api('/seller/me', { method: 'PATCH', body: { telegramNotificationsActive: next } });
      tg?.HapticFeedback.selectionChanged();
      showToast(next ? '🔔 Уведомления включены' : '🔕 Уведомления выключены');
    } catch {
      setProfile((p) => p ? { ...p, telegramNotificationsActive: !next } : p);
      showToast('❌ Ошибка');
    } finally {
      setToggling(false);
    }
  };

  const toggleStoreVisibility = async () => {
    if (!profile?.store || toggling) return;
    const wasPublic = profile.store.isPublic;
    setToggling(true);
    setProfile((p) => p?.store ? { ...p, store: { ...p.store, isPublic: !wasPublic } } : p);
    try {
      await api(wasPublic ? '/seller/store/unpublish' : '/seller/store/publish', { method: 'POST', body: {} });
      tg?.HapticFeedback.selectionChanged();
      showToast(!wasPublic ? '✅ Магазин открыт' : '🔒 Магазин скрыт');
    } catch {
      setProfile((p) => p?.store ? { ...p, store: { ...p.store, isPublic: wasPublic } } : p);
      showToast('❌ Ошибка');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      
        <div className="flex justify-center py-20"><Spinner /></div>
      
    );
  }

  return (

      <div className="flex flex-col gap-4 max-w-3xl mx-auto w-full">

        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Настройки</h1>

        {/* ── Тема оформления ── */}
        <GlassCard className="p-4 flex flex-col gap-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'var(--tg-text-dim)' }}>
            Тема оформления
          </p>
          <ThemeToggle />
          <p className="text-[10px]" style={{ color: 'var(--tg-text-dim)' }}>
            Авто — синхронизация с Telegram. Можно зафиксировать вручную.
          </p>
        </GlassCard>

        {/* ── Профиль ── */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Профиль
          </p>

          <div className="flex flex-col gap-1.5">
            <label className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Имя</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ваше имя"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.10)',
                color: 'rgba(255,255,255,0.90)',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#A855F7')}
              onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.10)')}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.45)' }}>Тип продавца</p>
            <div className="flex gap-2">
              {(['individual', 'business'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setSellerType(t)}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    background: sellerType === t ? 'rgba(168,85,247,0.20)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${sellerType === t ? 'rgba(168,85,247,0.40)' : 'rgba(255,255,255,0.08)'}`,
                    color: sellerType === t ? '#A855F7' : 'rgba(255,255,255,0.45)',
                    transition: 'all 0.15s',
                  }}
                >
                  {t === 'individual' ? '👤 Физлицо' : '🏢 Юрлицо'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={saveProfile}
            disabled={saving || !fullName.trim()}
            className="w-full py-2.5 rounded-xl text-sm font-semibold"
            style={{
              background: saving || !fullName.trim()
                ? 'rgba(255,255,255,0.06)'
                : 'linear-gradient(135deg, #7C3AED, #A855F7)',
              color: saving || !fullName.trim() ? 'rgba(255,255,255,0.30)' : '#fff',
              transition: 'all 0.15s',
            }}
          >
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </GlassCard>

        {/* ── Уведомления ── */}
        <GlassCard className="p-4 flex flex-col gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Уведомления
          </p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Telegram-уведомления
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                Новые заказы и статусы через бота
              </p>
            </div>
            <Toggle
              on={profile?.telegramNotificationsActive ?? false}
              onChange={toggleNotifications}
              disabled={toggling}
            />
          </div>
        </GlassCard>

        {/* ── Магазин ── */}
        {profile?.store && profile.store.status === 'APPROVED' && (
          <GlassCard className="p-4 flex flex-col gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.30)' }}>
              Магазин
            </p>

            <div className="flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.85)' }}>
                  Виден покупателям
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                  {profile.store.isPublic ? 'Магазин открыт в каталоге' : 'Магазин скрыт'}
                </p>
              </div>
              <Toggle
                on={profile.store.isPublic}
                onChange={toggleStoreVisibility}
                disabled={toggling}
              />
            </div>

            <button
              onClick={() => navigate('/seller/store')}
              className="flex items-center gap-2 text-xs py-1"
              style={{ color: '#A855F7' }}
            >
              ⚙️ Настройки магазина →
            </button>
          </GlassCard>
        )}

        {/* ── Прочее ── */}
        <GlassCard className="p-4 flex flex-col gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.30)' }}>
            Прочее
          </p>
          <button
            onClick={() => navigate('/seller/profile')}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(255,255,255,0.65)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span>👤</span> Профиль
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 py-2.5 text-sm"
            style={{ color: 'rgba(248,113,113,0.80)' }}
          >
            <span>🚪</span> Выйти из аккаунта
          </button>
        </GlassCard>

        <p className="text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.15)' }}>
          Savdo · v1.0
        </p>

      </div>
    
  );
}
