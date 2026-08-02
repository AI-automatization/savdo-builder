import type { Dict, Locale } from "./i18n";
import { SITE_URL } from "./seo";

const TELEGRAM_BOT_URL = "https://t.me/maxsavdo_bot";
const CONTACT_EMAIL = "hello@maxsavdo.uz";

/**
 * Stable `@id`s. Every node points at these instead of repeating itself, which
 * is what turns four unrelated JSON-LD blobs into one entity graph: search
 * engines and LLMs can then see "this app is published by this organization,
 * on this site" rather than three facts that happen to share a name.
 */
const ORG_ID = `${SITE_URL}/#organization`;
const WEBSITE_ID = `${SITE_URL}/#website`;
const APP_ID = `${SITE_URL}/#software`;

/** Legal details: apps/web-buyer/src/app/offer/page.tsx §9 (public offer). */
const LEGAL_NAME = 'MCHJ "TEZ KOD"';

// Site-wide — render once, in the root shell.
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: "MaxSavdo",
    legalName: LEGAL_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo-maxsavdo.svg`,
    email: CONTACT_EMAIL,
    sameAs: [TELEGRAM_BOT_URL],
    address: {
      "@type": "PostalAddress",
      addressCountry: "UZ",
      addressLocality: "Toshkent",
    },
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: CONTACT_EMAIL,
      availableLanguage: ["uz", "ru"],
    },
    areaServed: {
      "@type": "Country",
      name: "Uzbekistan",
    },
  };
}

// Per-locale — render once per page (home uz / home ru), not sitewide.
export function pageJsonLd(dict: Dict, locale: Locale) {
  const pageUrl = locale === "uz" ? SITE_URL : `${SITE_URL}/ru`;
  const inLanguage = locale === "uz" ? "uz-UZ" : "ru-RU";

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "MaxSavdo",
    url: SITE_URL,
    inLanguage: ["uz-UZ", "ru-RU"],
    publisher: { "@id": ORG_ID },
  };

  const softwareApplication = {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: "MaxSavdo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Telegram",
    url: SITE_URL,
    publisher: { "@id": ORG_ID },
    offers: dict.pricing.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/\s/g, ""),
      priceCurrency: "UZS",
      description: plan.tagline,
      url: `${pageUrl}#pricing`,
      seller: { "@id": ORG_ID },
    })),
  };

  const webPage = {
    "@type": "WebPage",
    "@id": `${pageUrl}#webpage`,
    url: pageUrl,
    name: dict.meta.title,
    description: dict.meta.description,
    inLanguage,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": APP_ID },
    publisher: { "@id": ORG_ID },
  };

  const faqPage = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage,
    isPartOf: { "@id": `${pageUrl}#webpage` },
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
    "@graph": [website, softwareApplication, webPage, faqPage],
  };
}
