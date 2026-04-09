import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { getTgWebApp, isTelegramEnv, type TgUser, type TgWebApp } from '@/lib/telegram';

interface TelegramCtx {
  tg: TgWebApp | null;
  user: TgUser | null;
  startParam: string | null;
  ready: boolean;
  isTelegram: boolean;
}

const Ctx = createContext<TelegramCtx>({
  tg: null,
  user: null,
  startParam: null,
  ready: false,
  isTelegram: false,
});

export const useTelegram = () => useContext(Ctx);

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<TelegramCtx>({
    tg: null, user: null, startParam: null, ready: false, isTelegram: false,
  });

  useEffect(() => {
    const tg = getTgWebApp();
    if (!tg || !isTelegramEnv()) {
      setValue({ tg: null, user: null, startParam: null, ready: true, isTelegram: false });
      return;
    }
    tg.ready();
    tg.expand();

    setValue({
      tg,
      user: tg.initDataUnsafe.user ?? null,
      startParam: tg.initDataUnsafe.start_param ?? null,
      ready: true,
      isTelegram: true,
    });
  }, []);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
