import Header from "@/components/layout/Header";
import { colors } from "@/lib/styles";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: colors.bg, color: colors.textPrimary }}
    >
      <Header />
      {children}
    </div>
  );
}
