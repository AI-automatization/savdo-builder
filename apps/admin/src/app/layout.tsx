import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Savdo Admin",
  description: "Панель администратора Savdo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className="h-full" data-theme="dark">
      <body className="h-full">
        {children}
      </body>
    </html>
  );
}
