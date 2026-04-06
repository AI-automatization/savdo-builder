import type { Metadata } from "next";
import { TelegramProvider } from "../../components/twa/TelegramProvider";

export const metadata: Metadata = {
  title: "Savdo Mini App",
};

export default function TwaLayout({ children }: { children: React.ReactNode }) {
  return (
    <TelegramProvider>
      {children}
    </TelegramProvider>
  );
}
