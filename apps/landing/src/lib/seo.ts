import type { Locale } from "./i18n";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://maxsavdo.uz";

/**
 * Search-console ownership. Values come from env so the codes can be added on
 * Railway without a code change; when unset the meta tags are simply omitted.
 */
export const verification = {
  google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION,
  other: process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION
    ? { "msvalidate.01": process.env.NEXT_PUBLIC_BING_SITE_VERIFICATION }
    : undefined,
};

/**
 * Keywords are a weak ranking signal for Google but Yandex still reads them, and
 * they double as the vocabulary we target with page copy. Grouped by intent:
 * brand · category · intent/transactional · problem/jobs-to-be-done.
 */
const KEYWORDS_UZ = [
  // brand
  "MaxSavdo",
  "maxsavdo.uz",
  // category
  "Telegram doʻkon",
  "Telegram doʻkon konstruktori",
  "Telegram bot doʻkon",
  "Telegram magazin",
  "onlayn doʻkon konstruktori",
  "savdo platformasi",
  // intent / transactional
  "Telegramda doʻkon ochish",
  "Telegram bot orqali sotish",
  "onlayn doʻkon ochish Oʻzbekiston",
  "komissiyasiz onlayn savdo",
  "doʻkon uchun bot yaratish",
  "Telegram doʻkon narxi",
  // problem / JTBD
  "Instagram doʻkonni Telegramga koʻchirish",
  "buyurtmalarni boshqarish Telegram",
  "sayt-vitrina Telegram",
  "avtomatik kanal postlar",
  // geo
  "Oʻzbekiston",
  "Toshkent",
];

const KEYWORDS_RU = [
  // brand
  "MaxSavdo",
  "максавдо",
  // category
  "конструктор магазина в Telegram",
  "магазин в Телеграм",
  "Telegram бот магазин",
  "интернет магазин конструктор",
  "платформа для продаж",
  // intent / transactional
  "создать магазин в Telegram",
  "как открыть магазин в Телеграм",
  "продавать через Telegram бота",
  "интернет магазин Узбекистан",
  "продажи без комиссии",
  "стоимость магазина в Telegram",
  // problem / JTBD
  "перенести магазин из Instagram в Telegram",
  "управление заказами Telegram",
  "витрина сайт Telegram",
  "автопостинг в канал",
  // geo
  "Узбекистан",
  "Ташкент",
];

export function keywords(locale: Locale): string[] {
  // Both lists on both locales: UZ sellers search in a mix of uz/ru, and the two
  // pages are hreflang-linked anyway, so there is no cannibalisation risk here.
  return locale === "uz"
    ? [...KEYWORDS_UZ, ...KEYWORDS_RU]
    : [...KEYWORDS_RU, ...KEYWORDS_UZ];
}
