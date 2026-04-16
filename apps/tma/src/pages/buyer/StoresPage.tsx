import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';
import { Sticker } from '@/components/ui/Sticker';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  city: string | null;
  telegramContactLink: string | null;
}

export default function StoresPage() {
  const navigate = useNavigate();
  const { user, tg } = useTelegram();

  const openTgContact = (e: React.MouseEvent, link: string) => {
    e.stopPropagation();
    const url = link.startsWith('http') ? link : `https://t.me/${link.replace(/^@/, '')}`;
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(url);
    } else {
      window.open(url, '_blank');
    }
  };
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api<{ data: Store[] }>('/storefront/stores')
      .then((res) => setStores(res.data ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return stores;
    const q = query.toLowerCase().trim();
    return stores.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.city?.toLowerCase().includes(q),
    );
  }, [stores, query]);

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 14px rgba(167,139,250,.40)' }}
          >
            <Sticker emoji="🛒" size={26} />
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#A78BFA' }}>Savdo</h1>
            {user && (
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                Привет, {user.first_name}!
              </p>
            )}
          </div>
        </div>

        <div className="relative">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(255,255,255,0.30)' }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            placeholder="Поиск магазинов..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm outline-none"
            style={{
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: 'rgba(255,255,255,0.90)',
            }}
          />
        </div>

        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Магазины
        </h2>

        {loading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Sticker emoji="⚠️" size={56} />
            <p style={{ color: 'rgba(255,255,255,0.50)', fontSize: 13 }}>Не удалось загрузить магазины</p>
            <button onClick={() => window.location.reload()} className="text-xs" style={{ color: '#A78BFA' }}>Попробовать снова</button>
          </div>
        )}

        {!loading && !error && !filtered.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <Sticker emoji="🏪" size={56} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>
              {query.trim() ? 'Ничего не найдено' : 'Магазинов пока нет'}
            </p>
          </div>
        )}

        {filtered.map((store) => (
          <GlassCard
            key={store.id}
            className="flex items-center gap-3 px-4 py-3.5"
            onClick={() => navigate(`/buyer/store/${store.slug}`)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.25)' }}
            >
              <Sticker emoji="🏪" size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
              {store.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{store.description}</p>
              )}
              {store.city && (
                <p className="text-[11px] mt-0.5" style={{ color: 'rgba(167,139,250,0.65)' }}>
                  📍 {store.city}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {store.telegramContactLink && (
                <button
                  onClick={(e) => openTgContact(e, store.telegramContactLink!)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-sm"
                  style={{ background: 'rgba(37,99,235,0.20)', border: '1px solid rgba(37,99,235,0.35)' }}
                  title="Написать продавцу"
                >
                  ✈️
                </button>
              )}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.25)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </div>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
