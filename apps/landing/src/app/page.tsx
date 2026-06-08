import { t } from "@/lib/i18n";
import { getFeaturedStores } from "@/lib/api";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { How } from "@/components/How";
import { Features } from "@/components/Features";
import { FeaturedStores } from "@/components/FeaturedStores";
import { Pricing } from "@/components/Pricing";
import { FAQ } from "@/components/FAQ";
import { Footer } from "@/components/Footer";

export const revalidate = 3600;

export default async function HomePage() {
  const locale = "uz" as const;
  const dict = t(locale);
  const stores = await getFeaturedStores();

  return (
    <>
      <Header locale={locale} dict={dict} />
      <main>
        <Hero locale={locale} dict={dict} />
        <How locale={locale} dict={dict} />
        <Features locale={locale} dict={dict} />
        <FeaturedStores locale={locale} dict={dict} stores={stores} />
        <Pricing locale={locale} dict={dict} />
        <FAQ locale={locale} dict={dict} />
      </main>
      <Footer locale={locale} dict={dict} />
    </>
  );
}
