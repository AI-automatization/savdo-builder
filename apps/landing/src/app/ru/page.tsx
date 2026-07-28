import { t } from "@/lib/i18n";
import { getFeaturedStores } from "@/lib/api";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import SocialProof from "@/components/SocialProof";
import ProblemSection from "@/components/ProblemSection";
import How from "@/components/How";
import Features from "@/components/Features";
import FeaturedStores from "@/components/FeaturedStores";
import WhyUs from "@/components/WhyUs";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";

export const revalidate = 3600;

export default async function HomePageRu() {
  const locale = "ru" as const;
  const dict = t(locale);
  const stores = await getFeaturedStores();

  return (
    <>
      <Header locale={locale} dict={{ nav: dict.nav }} />
      <main>
        <Hero locale={locale} dict={dict.hero} mock={dict.mock} />
        <SocialProof locale={locale} dict={dict.socialProof} />
        <ProblemSection locale={locale} dict={dict.problem} />
        <How locale={locale} dict={dict.how} />
        <Features locale={locale} dict={dict.features} />
        <FeaturedStores locale={locale} dict={dict.stores} stores={stores} />
        <WhyUs locale={locale} dict={dict.whyUs} />
        <Pricing locale={locale} dict={dict.pricing} />
        <FAQ locale={locale} dict={dict.faq} />
        <FinalCta locale={locale} dict={dict.finalCta} />
      </main>
      <Footer locale={locale} dict={dict.footer} />
    </>
  );
}
