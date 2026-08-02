import type { Locale } from "./i18n";

export type BlogCategory = "guides" | "product" | "market";

export interface BlogPost {
  slug: string;
  category: BlogCategory;
  date: string; // ISO, для сортировки/отображения
  readTime: number;
  title: Record<Locale, string>;
  excerpt: Record<Locale, string>;
  body: Record<Locale, string[]>;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "kak-oformit-vitrinu-v-telegram",
    category: "guides",
    date: "2026-07-18",
    readTime: 6,
    title: {
      ru: "Как оформить витрину в Telegram, чтобы ей доверяли",
      uz: "Telegram vitrinasini ishonch uygʻotadigan qilib qanday bezash mumkin",
    },
    excerpt: {
      ru: "Пять простых правил оформления карточек товара, которые повышают конверсию из просмотра в заказ.",
      uz: "Koʻrishdan buyurtmaga oʻtish darajasini oshiradigan mahsulot kartalarini bezashning beshta oddiy qoidasi.",
    },
    body: {
      ru: [
        "Покупатель решает, доверять магазину или нет, за первые несколько секунд — до того, как прочитает описание.",
        "1. Первое фото товара — на чистом фоне или в реальном использовании, без коллажей с текстом поверх.",
        "2. Цена должна быть видна сразу, без «уточняйте в личных сообщениях» — скрытая цена главный сигнал недоверия.",
        "3. Название товара — конкретное: «Сумка кожаная бежевая, А5» продаёт лучше, чем «Стильная новинка».",
        "4. Если есть скидка — показывайте старую и новую цену рядом, а не только процент.",
        "5. Рейтинг и число отзывов — даже пять честных отзывов работают лучше их отсутствия.",
      ],
      uz: [
        "Xaridor doʻkonga ishonish yoki ishonmaslikni birinchi bir necha soniyada — tavsifni oʻqishdan oldin hal qiladi.",
        "1. Mahsulotning birinchi rasmi — toza fonda yoki haqiqiy foydalanishda, ustiga matn qoʻyilgan kollajsiz.",
        "2. Narx darhol koʻrinishi kerak — yashirin narx yangi xaridor uchun ishonchsizlik belgisi.",
        "3. Mahsulot nomi aniq boʻlishi kerak: «Bejrang teridan sumka, A5» «Zamonaviy yangilik»dan yaxshiroq sotiladi.",
        "4. Chegirma boʻlsa — faqat foizni emas, eski va yangi narxni yonma-yon koʻrsating.",
        "5. Reyting va sharhlar soni — hatto beshta halol sharh ham ularning yoʻqligidan yaxshiroq ishlaydi.",
      ],
    },
  },
  {
    slug: "skolko-stoit-magazin-v-telegram",
    category: "market",
    date: "2026-07-29",
    readTime: 5,
    title: {
      ru: "Сколько стоит открыть магазин в Telegram в 2026 году",
      uz: "2026-yilda Telegram'da doʻkon ochish qancha turadi",
    },
    excerpt: {
      ru: "Сравниваем реальные затраты: свой сайт, маркетплейс с комиссией и конструктор без комиссии.",
      uz: "Haqiqiy xarajatlarni solishtiramiz: oʻz sayt, komissiyali marketpleys va komissiyasiz konstruktor.",
    },
    body: {
      ru: [
        "У продавца в Telegram есть три реальных пути превратить переписку в постах в настоящую витрину.",
        "Свой сайт: разработка от нескольких сотен долларов и недель ожидания, плюс постоянные расходы. Оправдано при большом обороте.",
        "Маркетплейс (Uzum, Olcha и похожие): вход бесплатный, но комиссия ~15% с продажи, и вы работаете в чужой витрине.",
        "Конструктор без комиссии: фиксированная подписка вместо процента, витрина за 5 минут, но нужна своя аудитория — общего каталога чужих магазинов здесь нет.",
        "Выбор зависит от того, что у вас уже есть: аудитория без витрины — берите конструктор; ни того ни другого — маркетплейс поможет найти первых клиентов дороже, но быстрее.",
      ],
      uz: [
        "Telegram'dagi sotuvchida postlardagi yozishmani haqiqiy vitrinaga aylantirishning uchta haqiqiy yoʻli bor.",
        "Oʻz sayt: bir necha yuz dollardan ishlab chiqish va haftalab kutish, plyus doimiy xarajatlar. Katta aylanma uchun oqlanadi.",
        "Marketpleys (Uzum, Olcha va shunga oʻxshashlar): kirish bepul, lekin ~15% komissiya, va siz boshqa birovning vitrinasida ishlaysiz.",
        "Komissiyasiz konstruktor: foiz oʻrniga qatʼiy obuna, vitrina 5 daqiqada, lekin oʻz auditoriyangiz kerak — umumiy katalog yoʻq.",
        "Tanlov sizda nima borligiga bogʻliq: vitrinasiz auditoriya bor — konstruktorni oling; ikkalasi ham yoʻq — marketpleys tezroq yordam beradi.",
      ],
    },
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export function sortedBlogPosts(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
