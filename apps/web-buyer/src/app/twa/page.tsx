"use client";

import { useTwa } from "../../components/twa/TelegramProvider";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL ?? "https://savdo-api-production.up.railway.app";

interface Store {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
}

// ── Стили (glassmorphism, единый токен) ───────────────────────────────────────
const glass = {
  background: "rgba(255,255,255,0.07)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 16,
} as const;

export default function TwaHomePage() {
  const { user, startParam, isTelegram, isReady } = useTwa();
  const router = useRouter();
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  // Если пришли с deep link ?startapp=store_slug → редирект в магазин
  useEffect(() => {
    if (startParam?.startsWith("store_")) {
      const slug = startParam.replace("store_", "");
      router.replace(`/twa/store/${slug}`);
    }
  }, [startParam, router]);

  // Загружаем популярные/последние магазины
  useEffect(() => {
    fetch(`${API}/api/v1/storefront/stores`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.data) setStores(data.data.slice(0, 10));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!isReady) return <LoadingScreen />;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: "linear-gradient(135deg, #0f0a1e 0%, #1a0f2e 50%, #0a1628 100%)" }}
    >
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ width: 400, height: 400, top: -150, right: -100, background: "radial-gradient(circle, rgba(167,139,250,.18) 0%, transparent 70%)", filter: "blur(60px)" }} />
        <div className="absolute rounded-full" style={{ width: 300, height: 300, bottom: -80, left: -80, background: "radial-gradient(circle, rgba(34,197,94,.10) 0%, transparent 70%)", filter: "blur(48px)" }} />
      </div>

      <div className="relative z-10 flex flex-col flex-1 px-4 pt-6 pb-8 gap-5">

        {/* Шапка */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #7C3AED, #A78BFA)", boxShadow: "0 4px 14px rgba(167,139,250,.40)" }}
          >
            🛒
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: "#A78BFA" }}>Savdo</h1>
            {user && (
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
                Привет, {user.firstName}!
              </p>
            )}
            {!isTelegram && (
              <p className="text-xs" style={{ color: "rgba(251,191,36,0.70)" }}>
                Откройте через Telegram для полного доступа
              </p>
            )}
          </div>
        </div>

        {/* Поиск */}
        <div
          className="flex items-center gap-2 px-3 py-2.5"
          style={{ ...glass }}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.35)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <span className="text-sm" style={{ color: "rgba(255,255,255,0.30)" }}>Найти магазин...</span>
        </div>

        {/* Магазины */}
        <div className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.35)" }}>
            Магазины
          </h2>

          {loading && <LoadingSpinner />}

          {!loading && !stores.length && (
            <div className="flex flex-col items-center gap-2 py-10">
              <span style={{ fontSize: 36 }}>🏪</span>
              <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13 }}>Магазины загружаются...</p>
            </div>
          )}

          {stores.map((store) => (
            <StoreCard key={store.id} store={store} onPress={() => router.push(`/twa/store/${store.slug}`)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StoreCard({ store, onPress }: { store: Store; onPress: () => void }) {
  return (
    <button
      onClick={onPress}
      className="w-full text-left flex items-center gap-3 px-4 py-3.5 transition-opacity active:opacity-70"
      style={{ ...glass }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
        style={{ background: "rgba(167,139,250,0.20)", border: "1px solid rgba(167,139,250,0.25)" }}
      >
        🏪
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{store.name}</p>
        {store.description && (
          <p className="text-xs truncate mt-0.5" style={{ color: "rgba(255,255,255,0.40)" }}>{store.description}</p>
        )}
        <p className="text-[10px] mt-0.5" style={{ color: "rgba(167,139,250,0.70)" }}>savdo.uz/{store.slug}</p>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 flex-shrink-0" style={{ color: "rgba(255,255,255,0.25)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
      </svg>
    </button>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #0f0a1e, #1a0f2e)" }}>
      <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(167,139,250,0.30)", borderTopColor: "#A78BFA" }} />
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex justify-center py-6">
      <div className="w-6 h-6 rounded-full border-2 animate-spin" style={{ borderColor: "rgba(167,139,250,0.30)", borderTopColor: "#A78BFA" }} />
    </div>
  );
}
