"use client";

import { useEffect, useState } from "react";
import { SDKProvider, useLaunchParams, useInitData } from "@telegram-apps/sdk-react";

interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

interface TwaContextValue {
  user: TelegramUser | null;
  startParam: string | null;   // данные из deep link (?startapp=...)
  isReady: boolean;
  isTelegram: boolean;
  themeParams: { bgColor?: string; textColor?: string; buttonColor?: string } | null;
}

import { createContext, useContext } from "react";

const TwaContext = createContext<TwaContextValue>({
  user: null,
  startParam: null,
  isReady: false,
  isTelegram: false,
  themeParams: null,
});

export const useTwa = () => useContext(TwaContext);

// Внутренний компонент — читает данные после инициализации SDK
function TwaContextProvider({ children }: { children: React.ReactNode }) {
  const launchParams = useLaunchParams();
  const initData     = useInitData();

  const tgUser = initData?.user;

  const value: TwaContextValue = {
    user: tgUser
      ? {
          id:        tgUser.id,
          firstName: tgUser.firstName,
          lastName:  tgUser.lastName,
          username:  tgUser.username,
          photoUrl:  tgUser.photoUrl,
        }
      : null,
    startParam: launchParams.startParam ?? null,
    isReady:    true,
    isTelegram: true,
    themeParams: null,
  };

  return <TwaContext.Provider value={value}>{children}</TwaContext.Provider>;
}

// Fallback для браузера вне Telegram
function BrowserFallbackProvider({ children }: { children: React.ReactNode }) {
  const value: TwaContextValue = {
    user: null,
    startParam: null,
    isReady: true,
    isTelegram: false,
    themeParams: null,
  };
  return <TwaContext.Provider value={value}>{children}</TwaContext.Provider>;
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const [isTg, setIsTg] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // Проверяем что мы внутри Telegram
    const inTg = typeof window !== "undefined" && !!(window as typeof window & { Telegram?: unknown }).Telegram;
    setIsTg(inTg);
    setChecked(true);
  }, []);

  if (!checked) return null;

  if (isTg) {
    return (
      <SDKProvider acceptCustomStyles>
        <TwaContextProvider>{children}</TwaContextProvider>
      </SDKProvider>
    );
  }

  return <BrowserFallbackProvider>{children}</BrowserFallbackProvider>;
}
