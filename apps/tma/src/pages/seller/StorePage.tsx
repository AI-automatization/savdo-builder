import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTelegram } from '@/providers/TelegramProvider';
import { AppShell } from '@/components/layout/AppShell';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { glass } from '@/lib/styles';

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  telegramChannelId: string | null;
  telegramChannelTitle: string | null;
}

export default function SellerStorePage() {
  const { tg } = useTelegram();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ data: Store }>('/seller/store')
      .then((r) => {
        const s = r.data;
        setStore(s);
        setName(s.name);
        setDescription(s.description ?? '');
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!store) return;
    setSaving(true);
    try {
      const updated = await api<{ data: Store }>('/seller/store', {
        method: 'PATCH',
        body: { name: name.trim(), description: description.trim() || null },
      });
      setStore(updated.data);
      setEditing(false);
      tg?.HapticFeedback.notificationOccurred('success');
    } catch {
      tg?.HapticFeedback.notificationOccurred('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <AppShell role="SELLER"><div className="flex justify-center py-10"><Spinner size={32} /></div></AppShell>;
  }

  if (!store) {
    return (
      <AppShell role="SELLER">
        <div className="flex flex-col items-center gap-3 py-16">
          <span style={{ fontSize: 40 }}>⚠️</span>
          <p style={{ color: 'rgba(255,255,255,0.60)', fontSize: 14 }}>Магазин не найден</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell role="SELLER">
      <div className="flex flex-col gap-4">
        <h1 className="text-base font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>Мой магазин</h1>

        <GlassCard className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
              style={{ background: 'rgba(167,139,250,0.20)', border: '1px solid rgba(167,139,250,0.25)' }}>
              🏪
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.90)' }}>{store.name}</p>
              <p className="text-[11px]" style={{ color: 'rgba(167,139,250,0.80)' }}>savdo.uz/{store.slug}</p>
            </div>
            <Badge status={store.status} />
          </div>

          {store.description && !editing && (
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.50)' }}>{store.description}</p>
          )}

          {store.telegramChannelId && (
            <div className="flex items-center gap-2 text-xs" style={{ color: 'rgba(255,255,255,0.40)' }}>
              <span>📢</span>
              <span>{store.telegramChannelTitle ?? store.telegramChannelId}</span>
            </div>
          )}
        </GlassCard>

        {editing ? (
          <div className="flex flex-col gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Название магазина"
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none"
              style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
            />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание"
              rows={3}
              className="w-full px-4 py-3 rounded-xl text-sm text-white placeholder-white/30 outline-none resize-none"
              style={{ ...glass, background: 'rgba(255,255,255,0.05)' }}
            />
            <div className="flex gap-3">
              <Button className="flex-1" onClick={save} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)}>Отмена</Button>
            </div>
          </div>
        ) : (
          <Button variant="ghost" className="w-full" onClick={() => setEditing(true)}>
            Редактировать
          </Button>
        )}
      </div>
    </AppShell>
  );
}
