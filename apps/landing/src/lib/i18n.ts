export type Locale = "uz" | "ru";

export type Dict = {
  locale: Locale;
  meta: {
    title: string;
    description: string;
    ogTitle: string;
    ogDescription: string;
  };
  nav: {
    how: string;
    features: string;
    stores: string;
    pricing: string;
    faq: string;
    start: string;
  };
  hero: {
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    badge: string;
    metrics: Array<{ value: string; label: string }>;
  };
  problem: {
    title: string;
    body: string;
    items: Array<{ title: string; body: string }>;
  };
  how: {
    title: string;
    body: string;
    steps: Array<{ n: string; title: string; body: string }>;
  };
  features: {
    title: string;
    body: string;
    items: Array<{ icon: string; title: string; body: string }>;
  };
  stores: {
    title: string;
    subtitle: string;
    empty: string;
    verified: string;
    open: string;
  };
  pricing: {
    title: string;
    subtitle: string;
    monthly: string;
    perMonth: string;
    plans: Array<{
      id: "free" | "pro" | "studio";
      name: string;
      price: string;
      period: string;
      tagline: string;
      features: string[];
      cta: string;
      highlight?: boolean;
    }>;
  };
  faq: {
    title: string;
    items: Array<{ q: string; a: string }>;
  };
  whyUs: {
    title: string;
    cols: string[];
    rows: Array<{ label: string; cells: Array<"yes" | "no" | "commission" | "expensive"> }>;
    footnote: string;
  };
  finalCta: {
    title: string;
    subtitle: string;
  };
  footer: {
    tagline: string;
    rights: string;
    contact: string;
    bot: string;
  };
};

const uz: Dict = {
  locale: "uz",
  meta: {
    title: "MaxSavdo — Telegram-doʻkon konstruktori | Bot + Sayt + Kanal",
    description:
      "5 daqiqada Telegram-bot, sayt-vitrina va avtomatik kanal-postlar. Komissiyasiz, bitta akkauntdan. Telegram-savdogarlar uchun.",
    ogTitle: "MaxSavdo — 3 ta sotuv kanali bitta Telegram-akkauntdan",
    ogDescription:
      "Bot, sayt va kanal — 5 daqiqada. Komissiyasiz. Fiksatsiya qilingan obuna.",
  },
  nav: {
    how: "Qanday ishlaydi",
    features: "Imkoniyatlar",
    stores: "Doʻkonlar",
    pricing: "Tariflar",
    faq: "Savollar",
    start: "Boshlash",
  },
  hero: {
    badge: "Yopiq beta · birinchi sotuvchilar allaqachon bu yerda",
    title: "Bitta Telegram-akkaunt = 3 ta sotuv kanali",
    subtitle:
      "MaxSavdo — Telegram-savdogarlar uchun konstruktor. 5 daqiqada bot, sayt va avtomatik kanal-postlar — barchasi bitta akkauntdan, komissiyasiz.",
    ctaPrimary: "Bepul boshlash",
    ctaSecondary: "Qanday ishlaydi",
    metrics: [
      { value: "5 daqiqa", label: "ishga tushirish" },
      { value: "0%", label: "sotuvdan komissiya" },
      { value: "24/7", label: "doʻkon ishlaydi" },
    ],
  },
  problem: {
    title: "Direct yoki storiesda sotyapsizmi?",
    body: "Tanish holat. Va har kuni shu tufayli pul yoʻqotyapsiz.",
    items: [
      {
        title: "Buyurtmalar yoʻqoladi",
        body: "Kelishuvlar yozishmalarda choʻkib ketadi, manzil va summalar chalkashadi, baʼzi buyurtmalar shunchaki unutiladi.",
      },
      {
        title: "«Narxi?» xabarlari",
        body: "Mijoz katalogda oʻzi koʻrishi mumkin boʻlgan narsani siz qoʻlda qayta-qayta yozasiz.",
      },
      {
        title: "Tahlil va checkout yoʻq",
        body: "Nima sotilayotgani koʻrinmaydi, savatcha va normal buyurtma rasmiylashtirish yoʻq.",
      },
    ],
  },
  how: {
    title: "3 qadamda ishga tushiring",
    body: "Telefon yetadi — kompyuter, dizayner va dasturchi kerak emas. Bot oʻzi qoʻlingizdan tutib boshqaradi.",
    steps: [
      {
        n: "01",
        title: "@maxsavdo_bot ga kiring",
        body: "Telegram orqali tasdiqlang — parol kerak emas. 30 soniya.",
      },
      {
        n: "02",
        title: "Doʻkonni sozlang",
        body: "Nomini tanlang, mahsulot, narx va rasm qoʻshing — bot yoʻl koʻrsatadi.",
      },
      {
        n: "03",
        title: "3 ta kanalda sotuv",
        body: "Bot, sayt-vitrina va kanaldagi avtomatik postlar — barchasi tayyor. Buyurtma bitta joyga tushadi.",
      },
    ],
  },
  features: {
    title: "Nima ichida bor",
    body: "DM-dagi xaos oʻrniga tartib: telefondan boshqariladigan ekosistem.",
    items: [
      {
        icon: "bot",
        title: "Telegram-bot",
        body: "Mahsulot va buyurtmalarni boshqarish — telefondan. Kompyuter shart emas.",
      },
      {
        icon: "globe",
        title: "Sayt-vitrina",
        body: "maxsavdo.uz/sizning-doʻkon — havola yuboring, mijoz brauzerda koʻradi.",
      },
      {
        icon: "broadcast",
        title: "Avtomatik kanal-postlar",
        body: "Yangi mahsulot — yangi post. Qoʻlda yozish shart emas.",
      },
      {
        icon: "cart",
        title: "Korzina va checkout",
        body: "Buyurtma statuslari va tartib. DM-dagi chalkashlik tugadi.",
      },
      {
        icon: "stat",
        title: "Statistika va eslatmalar",
        body: "Sotuvlar, eng yaxshi mahsulotlar va mijozlar — bitta paneldan.",
      },
      {
        icon: "shield",
        title: "Komissiyasiz",
        body: "Har bir sotuvdan ulush yoʻq. Fiksatsiya qilingan oylik obuna.",
      },
    ],
  },
  stores: {
    title: "Bizning doʻkonlar",
    subtitle: "MaxSavdo da ishlayotgan haqiqiy savdogarlar.",
    empty: "Doʻkonlar tez orada paydo boʻladi.",
    verified: "Tasdiqlangan",
    open: "Doʻkonni ochish",
  },
  pricing: {
    title: "Sodda tariflar",
    subtitle: "Komissiyasiz. Sotuv hajmidan qatʼi nazar — oylik bir xil.",
    monthly: "oyiga",
    perMonth: "/oy",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "0",
        period: "soʻm",
        tagline: "Sinab koʻrish uchun",
        features: [
          "50 ta mahsulotgacha",
          "Telegram-bot",
          "MaxSavdo brendi bilan sayt",
          "Asosiy statistika",
        ],
        cta: "Boshlash",
      },
      {
        id: "pro",
        name: "Pro",
        price: "149 000",
        period: "soʻm/oy",
        tagline: "Faol savdogarlar uchun",
        features: [
          "Cheksiz mahsulotlar",
          "Avtomatik kanal-postlar",
          "Maxsus domen (.uz)",
          "Kengaytirilgan statistika",
          "Mijozga qoʻllab-quvvatlash",
        ],
        cta: "Pro ni tanlash",
        highlight: true,
      },
      {
        id: "studio",
        name: "Studio",
        price: "399 000",
        period: "soʻm/oy",
        tagline: "Komandali doʻkonlar uchun",
        features: [
          "Pro dagi hamma narsa",
          "Bir nechta operator",
          "Rollar va ruxsatlar",
          "Prioritet qoʻllab-quvvatlash",
          "API kirishi",
        ],
        cta: "Studio ni tanlash",
      },
    ],
  },
  faq: {
    title: "Tez-tez beriladigan savollar",
    items: [
      {
        q: "Komissiya bormi?",
        a: "Yoʻq. Faqat fiksatsiya qilingan oylik obuna. Sotuv hajmidan qatʼi nazar.",
      },
      {
        q: "Kompyuter kerakmi?",
        a: "Yoʻq. Doʻkonni telefondan, Telegram-bot orqali toʻliq boshqarasiz.",
      },
      {
        q: "Mijozlar qayerda buyurtma beradi?",
        a: "Botda, sayt-vitrinada yoki kanaldan — har qayerdan, buyurtma bitta joyga tushadi.",
      },
      {
        q: "Free tarifda nima cheklov?",
        a: "50 ta mahsulotgacha va MaxSavdo brendi bilan sayt. Avtopostlash yoʻq.",
      },
      {
        q: "Sinab koʻrish bepulmi?",
        a: "Ha. Free tarif vaqt cheklovisiz ishlaydi.",
      },
    ],
  },
  whyUs: {
    title: "Nega maxsavdo, hozirgisidan koʻra",
    cols: ["", "maxsavdo", "Direct / stories", "Marketplace", "Tilda / Shopify"],
    rows: [
      { label: "Savatcha va checkout", cells: ["yes", "no", "yes", "yes"] },
      { label: "Oʻz brendi va vitrinasi", cells: ["yes", "no", "no", "yes"] },
      { label: "Sotuvdan komissiyasiz", cells: ["yes", "yes", "commission", "yes"] },
      { label: "Telegram ichida", cells: ["yes", "yes", "no", "no"] },
      { label: "Bir necha daqiqada ishga tushirish", cells: ["yes", "yes", "no", "expensive"] },
    ],
    footnote:
      "Marketplace har sotuvdan ~15% oladi. Sayt konstruktorlari — oyiga $30+ va Telegram-native emas. maxsavdo — komissiya oʻrniga obuna, mijozlar allaqachon keladigan joyda.",
  },
  finalCta: {
    title: "Doʻkoningizni 5 daqiqada ishga tushiring",
    subtitle: "Yopiq beta davomida bepul. Sayt qurishsiz va komissiyasiz.",
  },
  footer: {
    tagline: "Telegram-savdogarlar uchun konstruktor",
    rights: "Barcha huquqlar himoyalangan",
    contact: "Aloqa",
    bot: "Bot",
  },
};

const ru: Dict = {
  locale: "ru",
  meta: {
    title: "MaxSavdo — конструктор магазина в Telegram | Бот + Сайт + Канал",
    description:
      "За 5 минут — Telegram-бот, сайт-витрина и автопостинг в канал. Без комиссий, фиксированная подписка. Для продавцов в Telegram.",
    ogTitle: "MaxSavdo — три канала продаж из одного Telegram-аккаунта",
    ogDescription:
      "Бот, сайт и канал — за 5 минут. Без комиссий. Фиксированная подписка.",
  },
  nav: {
    how: "Как работает",
    features: "Возможности",
    stores: "Магазины",
    pricing: "Тарифы",
    faq: "Вопросы",
    start: "Начать",
  },
  hero: {
    badge: "Закрытая бета · первые продавцы уже здесь",
    title: "Один Telegram-аккаунт — три канала продаж",
    subtitle:
      "MaxSavdo — конструктор магазина для Telegram-продавцов. За 5 минут получаете бота, сайт-витрину и автопостинг в канал. Без комиссий, фиксированная подписка.",
    ctaPrimary: "Начать бесплатно",
    ctaSecondary: "Как это работает",
    metrics: [
      { value: "5 минут", label: "запуск" },
      { value: "0%", label: "комиссия с продаж" },
      { value: "24/7", label: "магазин работает" },
    ],
  },
  problem: {
    title: "Продаёте в директе или сторис?",
    body: "Знакомая ситуация. И каждый день вы теряете на этом деньги.",
    items: [
      {
        title: "Заказы теряются",
        body: "Договорённости тонут в переписке, путаются адреса и суммы, часть заказов просто забывается.",
      },
      {
        title: "Сообщения «сколько стоит?»",
        body: "Клиент вручную переспрашивает то, что мог бы сам увидеть в каталоге.",
      },
      {
        title: "Нет аналитики и checkout",
        body: "Не видно, что продаётся, нет корзины и нормального оформления заказа.",
      },
    ],
  },
  how: {
    title: "Запуск за 3 шага",
    body: "Достаточно телефона — без компьютера, дизайнера и разработчика. Бот ведёт за руку.",
    steps: [
      {
        n: "01",
        title: "Зайдите в @maxsavdo_bot",
        body: "Подтвердите вход через Telegram — пароли не нужны. 30 секунд.",
      },
      {
        n: "02",
        title: "Настройте магазин",
        body: "Назовите магазин, добавьте товары с фото и ценой — бот ведёт по шагам.",
      },
      {
        n: "03",
        title: "Продажи в 3 каналах",
        body: "Бот, сайт-витрина и автопостинг в канал — всё работает. Заказ падает в одно окно.",
      },
    ],
  },
  features: {
    title: "Что входит",
    body: "Вместо хаоса в DM — экосистема, которой управляешь с телефона.",
    items: [
      {
        icon: "bot",
        title: "Telegram-бот",
        body: "Управление товарами и заказами — с телефона. Компьютер не нужен.",
      },
      {
        icon: "globe",
        title: "Сайт-витрина",
        body: "maxsavdo.uz/ваш-магазин — пришлите ссылку, клиент смотрит в браузере.",
      },
      {
        icon: "broadcast",
        title: "Автопостинг в канал",
        body: "Новый товар — новый пост. Писать вручную не нужно.",
      },
      {
        icon: "cart",
        title: "Корзина и checkout",
        body: "Статусы заказов и порядок. Хаоса в DM больше нет.",
      },
      {
        icon: "stat",
        title: "Статистика и напоминания",
        body: "Продажи, топ-товары и клиенты — в одной панели.",
      },
      {
        icon: "shield",
        title: "Без комиссий",
        body: "С каждой продажи не берём. Только фиксированная месячная подписка.",
      },
    ],
  },
  stores: {
    title: "Наши магазины",
    subtitle: "Реальные продавцы, которые уже работают на MaxSavdo.",
    empty: "Магазины скоро появятся.",
    verified: "Проверенный",
    open: "Открыть магазин",
  },
  pricing: {
    title: "Простые тарифы",
    subtitle: "Без комиссий. Сколько бы вы ни продали — платёж тот же.",
    monthly: "в месяц",
    perMonth: "/мес",
    plans: [
      {
        id: "free",
        name: "Free",
        price: "0",
        period: "сум",
        tagline: "Попробовать",
        features: [
          "До 50 товаров",
          "Telegram-бот",
          "Сайт с брендом MaxSavdo",
          "Базовая статистика",
        ],
        cta: "Начать",
      },
      {
        id: "pro",
        name: "Pro",
        price: "149 000",
        period: "сум/мес",
        tagline: "Для активных продавцов",
        features: [
          "Безлимит товаров",
          "Автопостинг в канал",
          "Свой домен (.uz)",
          "Расширенная статистика",
          "Поддержка",
        ],
        cta: "Выбрать Pro",
        highlight: true,
      },
      {
        id: "studio",
        name: "Studio",
        price: "399 000",
        period: "сум/мес",
        tagline: "Для магазинов с командой",
        features: [
          "Всё из Pro",
          "Несколько операторов",
          "Роли и права",
          "Приоритетная поддержка",
          "API-доступ",
        ],
        cta: "Выбрать Studio",
      },
    ],
  },
  faq: {
    title: "Частые вопросы",
    items: [
      {
        q: "Есть ли комиссия?",
        a: "Нет. Только фиксированная месячная подписка — независимо от оборота.",
      },
      {
        q: "Нужен ли компьютер?",
        a: "Нет. Магазин полностью управляется с телефона через Telegram-бот.",
      },
      {
        q: "Откуда клиенты делают заказ?",
        a: "Из бота, сайта-витрины или канала — откуда угодно, заказ падает в одно окно.",
      },
      {
        q: "Какие ограничения на Free?",
        a: "До 50 товаров и сайт с брендом MaxSavdo. Без автопостинга.",
      },
      {
        q: "Пробный период бесплатный?",
        a: "Да. Free-тариф работает без ограничения по времени.",
      },
    ],
  },
  whyUs: {
    title: "Почему maxsavdo, а не привычный способ",
    cols: ["", "maxsavdo", "Директ / сторис", "Маркетплейс", "Tilda / Shopify"],
    rows: [
      { label: "Корзина и checkout", cells: ["yes", "no", "yes", "yes"] },
      { label: "Свой бренд и витрина", cells: ["yes", "no", "no", "yes"] },
      { label: "Без комиссии с продаж", cells: ["yes", "yes", "commission", "yes"] },
      { label: "Внутри Telegram", cells: ["yes", "yes", "no", "no"] },
      { label: "Запуск за несколько минут", cells: ["yes", "yes", "no", "expensive"] },
    ],
    footnote:
      "Маркетплейс забирает ~15% с каждой продажи. Конструкторы сайтов — от $30+/мес и не заточены под Telegram. maxsavdo — вместо комиссии подписка, там, где уже есть ваши клиенты.",
  },
  finalCta: {
    title: "Запустите магазин за 5 минут",
    subtitle: "Бесплатно на время закрытой беты. Без конструктора сайта и без комиссии.",
  },
  footer: {
    tagline: "Конструктор магазина для Telegram-продавцов",
    rights: "Все права защищены",
    contact: "Связаться",
    bot: "Бот",
  },
};

export const dict: Record<Locale, Dict> = { uz, ru };

export function t(locale: Locale): Dict {
  return dict[locale];
}
