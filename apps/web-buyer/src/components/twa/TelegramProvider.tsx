"use client";

import { createContext, useContext, useEffect, useState } from "react";

export interface TwaUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface TwaContextValue {
  user: TwaUser | null;
  startParam: string | null;
  isReady: boolean;
  isTelegram: boolean;
}

const TwaContext = createContext<TwaContextValue>({
  user: null,
  startParam: null,
  isReady: false,
  isTelegram: false,
});

export const useTwa = () => useContext(TwaContext);

// Типы из window.Telegram.WebApp (без SDK — чтобы не было версионных конфликтов)
interface TgWebApp {
  ready: () => void;
  expand: () => void;
  initDataUnsafe?: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      photo_url?: string;
    };
    start_param?: string;
  };
  colorScheme?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp: TgWebApp };
  }
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = useState<TwaContextValue>({
    user: null,
    startParam: null,
    isReady: false,
    isTelegram: false,
  });

  useEffect(() => {
    const tg = window.Telegram?.WebApp;

    if (!tg) {
      // Запущен в браузере — не в Telegram
      setValue({ user: null, startParam: null, isReady: true, isTelegram: false });
      return;
    }

    tg.ready();
    tg.expand();

    const tgUser = tg.initDataUnsafe?.user;

    setValue({
      user: tgUser
        ? {
            id:        tgUser.id,
            firstName: tgUser.first_name,
            lastName:  tgUser.last_name,
            username:  tgUser.username,
            photoUrl:  tgUser.photo_url,
          }
        : null,
      startParam: tg.initDataUnsafe?.start_param ?? null,
      isReady:    true,
      isTelegram: true,
    });
  }, []);

  return <TwaContext.Provider value={value}>{children}</TwaContext.Provider>;
}
