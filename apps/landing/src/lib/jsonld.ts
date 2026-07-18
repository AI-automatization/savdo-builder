import type { Dict, Locale } from "./i18n";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maxsavdo.uz";

const TELEGRAM_BOT_URL = "https://t.me/savdo_builderBOT";
const TELEGRAM_CHANNEL_URL = "https://t.me/savdobuilder";
const CONTACT_EMAIL = "hello@maxsavdo.uz";

// Site-wide — render once, in the root layout.
export function organizationJsonLd() {
  return {
    "@type": "Organization",
    name: "MaxSavdo",
    url: SITE_URL,
    logo: `${SITE_URL}/logo-maxsavdo.svg`,
    email: CONTACT_EMAIL,
    sameAs: [TELEGRAM_CHANNEL_URL, TELEGRAM_BOT_URL],
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
  };
}

// Per-locale — render once per page (home uz / home ru), not sitewide.
export function pageJsonLd(dict: Dict, locale: Locale) {
  const pageUrl = locale === "uz" ? SITE_URL : `${SITE_URL}/ru`;

  const website = {
    "@type": "WebSite",
    name: "MaxSavdo",
    url: pageUrl,
    inLanguage: locale,
  };

  const softwareApplication = {
    "@type": "SoftwareApplication",
    name: "MaxSavdo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Telegram",
    url: pageUrl,
    offers: dict.pricing.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/\s/g, ""),
      priceCurrency: "UZS",
      description: plan.tagline,
    })),
  };

  const faqPage = {
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return {
    "@context": "https://schema.org",
    "@graph": [website, softwareApplication, faqPage],
  };
}
