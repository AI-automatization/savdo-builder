import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savdo — Seller Dashboard",
  description: "Управляй магазином в Telegram",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full">
      <body
        className="h-full"
        style={{ background: "linear-gradient(135deg, #1a0533 0%, #0d1f4f 40%, #0a2e1a 100%)" }}
      >
        {children}
      </body>
    </html>
  );
}
