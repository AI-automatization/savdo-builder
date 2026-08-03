import type { Dict, Locale } from "./i18n";
import type { Guide } from "./guides";
import { HOMEPAGE_FAQ_COUNT } from "./i18n";
import { guidePath, guidesIndexPath } from "./guides";
import { SITE_URL } from "./seo";

const TELEGRAM_BOT_URL = "https://t.me/maxsavdo_bot";
const TELEGRAM_CHANNEL_URL = "https://t.me/Maxsavdo_0";
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

function abs(path: string): string {
  return path === "/" ? SITE_URL : `${SITE_URL}${path}`;
}

function homePath(locale: Locale): string {
  return locale === "uz" ? "/" : "/ru";
}

function langTag(locale: Locale): string {
  return locale === "uz" ? "uz-UZ" : "ru-RU";
}

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
    // Only verified profiles belong here. An invented sameAs is worse than a short
    // one: entity reconciliation is what GEO engines use to decide two mentions are
    // the same company, and a dead URL breaks that link. Add real social profiles
    // here as they go live.
    //
    // Both entries below were fetched before being added — t.me/Maxsavdo_0 returns
    // og:title "MaxSavdo". Instagram is deliberately absent: instagram.com blocks
    // server-side fetches and answers 200 with a generic shell for any handle, so
    // there is no way to verify the profile from here. Add it once someone confirms
    // the handle by hand.
    sameAs: [TELEGRAM_BOT_URL, TELEGRAM_CHANNEL_URL],
    // Mirrors what apps/web-buyer already publishes, so both hosts resolve to the
    // same parent entity instead of looking like two unrelated companies.
    parentOrganization: {
      "@type": "Organization",
      name: "TezCode",
      sameAs: ["https://github.com/AI-automatization"],
    },
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

function softwareApplicationNode(dict: Dict, locale: Locale) {
  const pageUrl = abs(homePath(locale));

  return {
    "@type": "SoftwareApplication",
    "@id": APP_ID,
    name: "MaxSavdo",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web, Telegram",
    url: SITE_URL,
    description: dict.meta.description,
    inLanguage: ["uz-UZ", "ru-RU"],
    // Straight from the rendered features section — the markup must not claim
    // capabilities the page does not show.
    featureList: dict.features.items.map((item) => item.title),
    publisher: { "@id": ORG_ID },
    offers: dict.pricing.plans.map((plan) => ({
      "@type": "Offer",
      name: plan.name,
      price: plan.price.replace(/\s/g, ""),
      priceCurrency: "UZS",
      description: plan.tagline,
      url: `${pageUrl}#pricing`,
      availability: "https://schema.org/InStock",
      seller: { "@id": ORG_ID },
    })),
  };
}

/**
 * HowTo from the rendered "3 steps" section.
 *
 * Note on expectations: Google retired HowTo *rich results* in search, so this buys
 * no SERP decoration. It stays because it is cheap and it states the launch sequence
 * as machine-readable steps, which is what an answer engine reproduces when asked
 * "how do I open a shop" — the AEO/GEO payoff, not a snippet payoff.
 */
function howToNode(dict: Dict, locale: Locale) {
  const pageUrl = abs(homePath(locale));

  return {
    "@type": "HowTo",
    "@id": `${pageUrl}#howto`,
    name: dict.how.title,
    description: dict.how.body,
    inLanguage: langTag(locale),
    totalTime: "PT10M",
    step: dict.how.steps.map((step, idx) => ({
      "@type": "HowToStep",
      position: idx + 1,
      name: step.title,
      text: step.body,
      url: `${pageUrl}#how`,
    })),
  };
}

function breadcrumbNode(
  pageUrl: string,
  trail: Array<{ name: string; path: string }>,
) {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: trail.map((crumb, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: crumb.name,
      item: abs(crumb.path),
    })),
  };
}

// Per-locale — render once per page (home uz / home ru), not sitewide.
export function pageJsonLd(dict: Dict, locale: Locale) {
  const path = homePath(locale);
  const pageUrl = abs(path);
  const inLanguage = langTag(locale);

  const website = {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "MaxSavdo",
    url: SITE_URL,
    inLanguage: ["uz-UZ", "ru-RU"],
    publisher: { "@id": ORG_ID },
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

  // Only the entries the homepage actually renders. Marking up the full list here
  // while the page shows five would be markup that does not match visible content.
  const faqPage = {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    inLanguage,
    isPartOf: { "@id": `${pageUrl}#webpage` },
    // HOMEPAGE_FAQ_COUNT is the same constant the FAQ section slices with, so the
    // markup and the rendered list cannot drift apart.
    mainEntity: dict.faq.items.slice(0, HOMEPAGE_FAQ_COUNT).map((item) => ({
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
    "@graph": [
      website,
      softwareApplicationNode(dict, locale),
      webPage,
      howToNode(dict, locale),
      faqPage,
    ],
  };
}

/** `/faq` · `/ru/faq` — the full question set, every answer visible on the page. */
export function faqPageJsonLd(dict: Dict, locale: Locale) {
  const path = locale === "uz" ? "/faq" : "/ru/faq";
  const pageUrl = abs(path);
  const inLanguage = langTag(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: dict.faqPage.title,
        description: dict.faqPage.description,
        inLanguage,
        isPartOf: { "@id": WEBSITE_ID },
        about: { "@id": APP_ID },
        publisher: { "@id": ORG_ID },
        mainEntity: dict.faq.items.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.a,
          },
        })),
      },
      breadcrumbNode(pageUrl, [
        { name: "MaxSavdo", path: homePath(locale) },
        { name: dict.faqPage.h1, path },
      ]),
    ],
  };
}

/** `/qollanma` · `/ru/rukovodstva` — the guides index. */
export function guidesIndexJsonLd(dict: Dict, locale: Locale, list: Guide[]) {
  const path = guidesIndexPath(locale);
  const pageUrl = abs(path);
  const inLanguage = langTag(locale);

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: dict.guidesPage.title,
        description: dict.guidesPage.description,
        inLanguage,
        isPartOf: { "@id": WEBSITE_ID },
        publisher: { "@id": ORG_ID },
        mainEntity: {
          "@type": "ItemList",
          itemListElement: list.map((guide, idx) => ({
            "@type": "ListItem",
            position: idx + 1,
            name: guide.h1,
            url: abs(guidePath(locale, guide.slug)),
          })),
        },
      },
      breadcrumbNode(pageUrl, [
        { name: "MaxSavdo", path: homePath(locale) },
        { name: dict.guidesPage.h1, path },
      ]),
    ],
  };
}

/**
 * One guide article. `abstract` carries the 40-60 word self-contained answer —
 * the same string the page renders as its first paragraph, so the machine-readable
 * answer and the human-readable one cannot diverge.
 */
export function guideJsonLd(dict: Dict, locale: Locale, guide: Guide) {
  const path = guidePath(locale, guide.slug);
  const pageUrl = abs(path);
  const inLanguage = langTag(locale);

  const article = {
    "@type": "Article",
    "@id": `${pageUrl}#article`,
    headline: guide.h1,
    name: guide.title,
    description: guide.description,
    abstract: guide.answer,
    url: pageUrl,
    inLanguage,
    datePublished: guide.updated,
    dateModified: guide.updated,
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": APP_ID },
    author: { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@id": `${pageUrl}#article` },
  };

  const nodes: object[] = [
    article,
    breadcrumbNode(pageUrl, [
      { name: "MaxSavdo", path: homePath(locale) },
      { name: dict.guidesPage.h1, path: guidesIndexPath(locale) },
      { name: guide.h1, path },
    ]),
  ];

  if (guide.howTo) {
    nodes.push({
      "@type": "HowTo",
      "@id": `${pageUrl}#howto`,
      name: guide.howTo.name,
      description: guide.answer,
      inLanguage,
      totalTime: guide.howTo.totalTime,
      step: guide.howTo.steps.map((step, idx) => ({
        "@type": "HowToStep",
        position: idx + 1,
        name: step.name,
        text: step.text,
        url: pageUrl,
      })),
    });
  }

  if (guide.faq.length > 0) {
    nodes.push({
      "@type": "FAQPage",
      "@id": `${pageUrl}#faq`,
      inLanguage,
      isPartOf: { "@id": `${pageUrl}#article` },
      mainEntity: guide.faq.map((item) => ({
        "@type": "Question",
        name: item.q,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.a,
        },
      })),
    });
  }

  return {
    "@context": "https://schema.org",
    "@graph": nodes,
  };
}
