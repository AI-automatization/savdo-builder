import type { Metadata } from "next";
import Script from "next/script";
import { TelegramProvider } from "../../components/twa/TelegramProvider";

export const metadata: Metadata = {
  title: "Savdo Mini App",
};

export default function TwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Script src="https://telegram.org/js/telegram-web-app.js" strategy="beforeInteractive" />
      <TelegramProvider>
        {children}
      </TelegramProvider>
    </>
  );
}
