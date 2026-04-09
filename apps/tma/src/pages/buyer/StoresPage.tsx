import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Spinner } from '@/components/ui/Spinner';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

export default function StoresPage() {
  const navigate = useNavigate();
  const { user } = useTelegram();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ data: Store[] }>('/storefront/stores')
      .then((res) => setStores(res.data?.slice(0, 20) ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell role="BUYER">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #A78BFA)', boxShadow: '0 4px 14px rgba(167,139,250,.40)' }}
          >
            🛒
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

        <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Магазины
        </h2>

        {loading && (
          <div className="flex justify-center py-8"><Spinner /></div>
        )}

        {!loading && !stores.length && (
          <div className="flex flex-col items-center gap-2 py-10">
            <span style={{ fontSize: 36 }}>🏪</span>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13 }}>Магазинов пока нет</p>
          </div>
        )}

        {stores.map((store) => (
          <GlassCard
            key={store.id}
            className="flex items-center gap-3 px-4 py-3.5"
            onClick={() => navigate(`/buyer/store/${store.slug}`)}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
              style={{ background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.25)' }}
            >
              🏪
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
              {store.description && (
                <p className="text-xs truncate mt-0.5" style={{ color: 'rgba(255,255,255,0.40)' }}>{store.description}</p>
              )}
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 shrink-0" style={{ color: 'rgba(255,255,255,0.25)' }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </GlassCard>
        ))}
      </div>
    </AppShell>
  );
}
