import type { Locale } from "./i18n";

export interface CaseStudy {
  slug: string;
  storeName: string;
  cover: string;
  initial: string;
  niche: Record<Locale, string>;
  quote: Record<Locale, string>;
  title: Record<Locale, string>;
  body: Record<Locale, string[]>;
  ordersPerMonth: string;
  launchTime: string;
  repeatRate: string;
}

// Иллюстративные сценарии — построены на реальных нишах и типичных для них
// показателях, НЕ на подтверждённых цитатах конкретных клиентов (см. casesPage.note
// в i18n.ts, обязательно рендерится на странице). Имена витрин совпадают с
// куратор-примерами, которые уже использовались на web-seller лендинге —
// не выдаём себя за конкретный существующий бизнес.
export const CASES: CaseStudy[] = [
  {
    slug: "atelier-nur",
    storeName: "Atelier Nur",
    cover: "/landing/s-fashion.jpg",
    initial: "A",
    niche: { ru: "Женская одежда и аксессуары", uz: "Ayollar kiyimi va aksessuarlari" },
    quote: {
      ru: "Каталог с поиском вместо ленты сторис — покупатель сам находит то, что раньше приходилось искать перепиской.",
      uz: "Stories lentasi oʻrniga qidiruvli katalog — xaridor avval yozishmada qidirilgan narsani oʻzi topadi.",
    },
    title: { ru: "Из директа — в витрину с поиском по каталогу", uz: "Direktdan — katalog boʻyicha qidiruvli vitrinaga" },
    body: {
      ru: [
        "Типичный сценарий для ниши одежды: продавец год ведёт каталог через сторис и директ — фото новинок, ручной учёт заказов в заметках телефона.",
        "После перехода на конструктор витрины каталог на 100+ товаров становится доступен по одной ссылке — с поиском, категориями и корзиной.",
        "Ключевое изменение для такой ниши — покупатель сам видит цену и остаток, не уточняя это перепиской в десятый раз.",
      ],
      uz: [
        "Kiyim nishasi uchun odatiy stsenariy: sotuvchi bir yil davomida storis va direkt orqali katalog yuritadi — yangiliklar rasmlari, telefon eslatmalarida qoʻlda hisob.",
        "Vitrina konstruktoriga oʻtgandan keyin 100+ mahsulotli katalog bitta havola orqali ochiladi — qidiruv, kategoriyalar va savat bilan.",
        "Bunday nisha uchun asosiy oʻzgarish — xaridor narx va qoldiqni oʻzi koʻradi, oʻninchi marta yozishmada soʻramaydi.",
      ],
    },
    ordersPerMonth: "90–120",
    launchTime: "~15 мин",
    repeatRate: "38%",
  },
  {
    slug: "lume-beauty",
    storeName: "Lumé Beauty",
    cover: "/landing/s-beauty.jpg",
    initial: "L",
    niche: { ru: "Косметика и уход", uz: "Kosmetika va parvarish" },
    quote: {
      ru: "Повторный заказ клиент оформляет сам за минуту — не нужно каждый раз писать продавцу заново.",
      uz: "Takroriy buyurtmani mijoz bir daqiqada oʻzi beradi — har safar sotuvchiga qayta yozish shart emas.",
    },
    title: { ru: "Повторные покупки без ежедневной переписки", uz: "Har kungi yozishmasiz takroriy xaridlar" },
    body: {
      ru: [
        "В нише ухода за собой типичен небольшой, но лояльный круг клиентов с повторными покупками каждые 3–4 недели.",
        "Витрина даёт клиенту оформить повторный заказ за минуту, без нового сообщения продавцу — товар, вариант объёма, корзина.",
        "Это снимает с продавца ежедневную рутину подтверждения одинаковых заказов вручную.",
      ],
      uz: [
        "Oʻz-oʻziga gʻamxoʻrlik nishasida kichik, lekin sodiq mijozlar doirasi va har 3–4 haftada takroriy xarid odatiy holat.",
        "Vitrina mijozga sotuvchiga yangi xabar yozmasdan, bir daqiqada takroriy buyurtma berish imkonini beradi.",
        "Bu sotuvchidan bir xil buyurtmalarni har kuni qoʻlda tasdiqlash yukini olib tashlaydi.",
      ],
    },
    ordersPerMonth: "140–180",
    launchTime: "~10 мин",
    repeatRate: "52%",
  },
  {
    slug: "studio-roz",
    storeName: "Studio Roz",
    cover: "/landing/s-jewelry.jpg",
    initial: "S",
    niche: { ru: "Украшения ручной работы", uz: "Qoʻlda ishlangan zargarlik buyumlari" },
    quote: {
      ru: "Подробная карточка товара с фото и рейтингом снимает вопрос доверия ещё до переписки.",
      uz: "Rasm va reyting bilan batafsil mahsulot kartasi yozishmagacha ishonch savolini hal qiladi.",
    },
    title: { ru: "Премиальная витрина там, где важно доверие", uz: "Ishonch muhim boʻlgan joyda premium vitrina" },
    body: {
      ru: [
        "Handmade-ниша: решение о покупке сильно зависит от того, насколько магазин выглядит надёжно.",
        "Подробные карточки товара, рейтинг и отзывы в одном месте заменяют пересылку фото по одному в директ.",
        "Типичный эффект — выше конверсия из первого визита в заказ за счёт того, что доверие формирует сама витрина, а не переписка.",
      ],
      uz: [
        "Handmade nisha: xarid qarori doʻkon qanchalik ishonchli koʻrinishiga koʻp bogʻliq.",
        "Batafsil mahsulot kartalari, reyting va sharhlar bir joyda rasmlarni direktga birma-bir yuborishni almashtiradi.",
        "Odatiy natija — birinchi tashrifdan buyurtmaga oʻtish yuqoriroq, chunki ishonchni yozishma emas, vitrinaning oʻzi shakllantiradi.",
      ],
    },
    ordersPerMonth: "60–80",
    launchTime: "~20 мин",
    repeatRate: "31%",
  },
];

export function getCase(slug: string): CaseStudy | undefined {
  return CASES.find((c) => c.slug === slug);
}
