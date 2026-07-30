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
    guides: string;
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
  /**
   * Answers are written to stand alone: 40-60 words, no "as mentioned above",
   * no dependence on the surrounding page. That is what lets an answer engine
   * lift one verbatim, and it is the whole point of the FAQPage markup.
   * The homepage renders the first `HOMEPAGE_FAQ_COUNT`; `/faq` renders all.
   */
  faq: {
    title: string;
    subtitle: string;
    allLabel: string;
    items: Array<{ q: string; a: string }>;
  };
  /** Copy for the standalone `/faq` route (uz) · `/ru/faq` (ru). */
  faqPage: {
    title: string;
    description: string;
    h1: string;
    intro: string;
  };
  /** Copy for the guides index and article chrome. Article bodies live in `guides.ts`. */
  guidesPage: {
    title: string;
    description: string;
    h1: string;
    intro: string;
    readMore: string;
    updatedLabel: string;
    backLabel: string;
    ctaTitle: string;
    ctaBody: string;
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
    resources: string;
  };
};

/** How many FAQ entries the homepage section shows before linking to `/faq`. */
export const HOMEPAGE_FAQ_COUNT = 5;

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
    guides: "Qoʻllanma",
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
        body: "shop.maxsavdo.uz/sizning-doʻkon — havola yuboring, mijoz brauzerda koʻradi.",
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
          "Oyiga 50 ta buyurtma",
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
          "Cheksiz buyurtmalar",
          "Avtomatik kanal-postlar",
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
          "Prioritet qoʻllab-quvvatlash",
          "API kirishi",
        ],
        cta: "Studio ni tanlash",
      },
    ],
  },
  faq: {
    title: "Tez-tez beriladigan savollar",
    subtitle: "Savdogarlar koʻp beradigan savollarga qisqa javoblar.",
    allLabel: "Barcha savollar",
    items: [
      {
        q: "Komissiya bormi?",
        a: "Yoʻq. MaxSavdo har bir sotuvdan ulush olmaydi — faqat fiksatsiya qilingan oylik obuna toʻlanadi. Oyiga 1 million yoki 50 million soʻmga savdo qilishingizdan qatʼi nazar, obuna narxi oʻzgarmaydi.",
      },
      {
        q: "Kompyuter kerakmi?",
        a: "Yoʻq. Doʻkon toʻliq telefondan, @maxsavdo_bot orqali boshqariladi: mahsulot qoʻshish, narxni oʻzgartirish va buyurtmalarni koʻrish — hammasi Telegram ichida bajariladi. Kompyuter ham, alohida ilova ham talab qilinmaydi.",
      },
      {
        q: "Mijozlar qayerda buyurtma beradi?",
        a: "Uchta joydan: Telegram-botda, sayt-vitrinada yoki kanaldagi postdan. Mijoz qaysi kanalni tanlashidan qatʼi nazar, buyurtma bitta joyga — sizning boshqaruv panelingizga tushadi va bot sizga xabar yuboradi.",
      },
      {
        q: "Free tarifda qanday cheklovlar bor?",
        a: "Free tarifida 50 ta mahsulotgacha qoʻshish mumkin, sayt MaxSavdo brendi bilan chiqadi va avtomatik kanal-postlar ishlamaydi. Telegram-bot, savatcha, checkout va asosiy statistika esa toʻliq ishlaydi.",
      },
      {
        q: "Sinab koʻrish bepulmi?",
        a: "Ha. Free tarifi vaqt boʻyicha cheklanmagan — bu sinov muddati emas, doimiy tarif. Karta kiritish yoki toʻlov maʼlumotlarini qoldirish talab qilinmaydi, obuna kerak boʻlsa keyin oʻzingiz tanlaysiz.",
      },
      {
        q: "Doʻkon ochish qancha vaqt oladi?",
        a: "Mahsulot rasmlari va narxlari tayyor boʻlsa, doʻkonning birinchi versiyasi 5-10 daqiqada ishga tushadi. Asosiy vaqt katalog kattaligiga ketadi: bitta mahsulotni qoʻshish taxminan bir daqiqa oladi.",
      },
      {
        q: "Kirish uchun SMS kod keladimi?",
        a: "Yoʻq. Kirish faqat Telegram akkaunti orqali tasdiqlanadi — SMS kodi ham, parol ham yoʻq. Shu sababli kod kelmasligi yoki SMS kechikishi bilan bogʻliq muammolar umuman yuzaga kelmaydi.",
      },
      {
        q: "Bitta akkauntda bir nechta doʻkon boʻladimi?",
        a: "Hozircha yoʻq: bitta sotuvchi uchun bitta doʻkon. Bu MVP bosqichida ataylab qoʻyilgan cheklov — bir nechta doʻkon bilan ishlash rejalarda bor, lekin hali mavjud emas.",
      },
      {
        q: "Oʻz domenimni ulash mumkinmi?",
        a: "Hozircha yoʻq. Har bir doʻkon shop.maxsavdo.uz/sizning-dokon manzilida ishlaydi va bu manzil qidiruv tizimlariga indekslanadi. Oʻz domenini ulash rejalarda bor, lekin hali ishlamaydi — shuning uchun uni tarif imkoniyati sifatida vaʼda qilmaymiz.",
      },
      {
        q: "Doʻkon havolasi qanday koʻrinadi?",
        a: "Doʻkon nomidan manzil yasaladi: shop.maxsavdo.uz/sizning-dokon. Bu oddiy havola — uni Instagram profiliga, Telegram kanaliga yoki statusga qoʻyish mumkin, mijoz brauzerda ham, Telegram ichida ham ochadi.",
      },
      {
        q: "Mobil ilova bormi?",
        a: "Alohida mobil ilova hozircha yoʻq va u kerak ham emas: doʻkon Telegram ichida va brauzerda ishlaydi. Sotuvchi bot orqali boshqaradi, xaridor esa havola orqali kiradi — hech kim hech narsa yuklab olmaydi.",
      },
      {
        q: "Toʻlovni qanday qabul qilaman?",
        a: "Toʻlov shartlarini doʻkon sozlamalarida oʻzingiz koʻrsatasiz — masalan yetkazib berishda naqd yoki oʻzingiz ishlatadigan usul. Mijoz buyurtma berishdan oldin bu shartlarni koʻradi, shuning uchun kelishmovchilik kamayadi.",
      },
      {
        q: "Mijoz roʻyxatdan oʻtishi kerakmi?",
        a: "Yoʻq. Xaridor katalogni koʻrish va buyurtma berish uchun roʻyxatdan oʻtmaydi va parol oʻylab topmaydi. Bu buyurtma yoʻlidagi eng katta toʻsiqni olib tashlaydi — mijoz havolani bosadi va darhol xarid qiladi.",
      },
      {
        q: "Doʻkonni Google topadimi?",
        a: "Ha. Sayt-vitrina oddiy veb-sahifa, shuning uchun Google va Yandex uni indekslaydi. Topilish ehtimolini oshirish uchun mahsulot nomi va tavsifini toʻliq — imkoni boʻlsa oʻzbek va rus tilida — yozish tavsiya etiladi.",
      },
    ],
  },
  faqPage: {
    title: "Savollar va javoblar — MaxSavdo",
    description:
      "Telegram-doʻkon, tariflar, komissiya, kirish va yetkazib berish boʻyicha savollarga javoblar. MaxSavdo qanday ishlaydi.",
    h1: "Savollar va javoblar",
    intro:
      "Telegram-doʻkon ochish, tariflar va kunlik ish boʻyicha savdogarlar koʻp beradigan savollar. Har bir javob mustaqil — kerakli savolni topib oʻqish yetarli.",
  },
  guidesPage: {
    title: "Qoʻllanmalar — Telegramda savdo qilish",
    description:
      "Telegramda doʻkon ochish, narxlar va Instagramdan koʻchirish boʻyicha amaliy qoʻllanmalar. Oʻzbekistondagi savdogarlar uchun.",
    h1: "Qoʻllanmalar",
    intro:
      "Telegramda savdo boʻyicha amaliy qoʻllanmalar: doʻkonni qanday ochish, qancha turadi va Instagramdagi savdoni qanday koʻchirish kerak.",
    readMore: "Oʻqish",
    updatedLabel: "Yangilangan",
    backLabel: "Barcha qoʻllanmalar",
    ctaTitle: "Doʻkonni hoziroq ochish",
    ctaBody:
      "Free tarifi vaqt cheklovisiz ishlaydi. @maxsavdo_bot ga kirib, 5-10 daqiqada birinchi mahsulotni joylashtirasiz.",
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
    resources: "Foydali",
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
    guides: "Руководства",
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
        body: "shop.maxsavdo.uz/ваш-магазин — пришлите ссылку, клиент смотрит в браузере.",
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
          "До 50 заказов в месяц",
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
          "Безлимит заказов",
          "Автопостинг в канал",
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
          "Приоритетная поддержка",
          "API-доступ",
        ],
        cta: "Выбрать Studio",
      },
    ],
  },
  faq: {
    title: "Частые вопросы",
    subtitle: "Короткие ответы на то, что продавцы спрашивают чаще всего.",
    allLabel: "Все вопросы",
    items: [
      {
        q: "Есть ли комиссия?",
        a: "Нет. MaxSavdo не берёт долю с каждой продажи — оплачивается только фиксированная месячная подписка. Продали вы за месяц на 1 миллион или на 50 миллионов сум, цена подписки не меняется.",
      },
      {
        q: "Нужен ли компьютер?",
        a: "Нет. Магазин полностью управляется с телефона через @maxsavdo_bot: добавить товар, изменить цену, посмотреть заказы — всё делается внутри Telegram. Ни компьютер, ни отдельное приложение не требуются.",
      },
      {
        q: "Откуда клиенты делают заказ?",
        a: "Из трёх мест: из Telegram-бота, с сайта-витрины или из поста в канале. Какой бы канал клиент ни выбрал, заказ попадает в одно окно — в вашу панель, и бот присылает вам уведомление.",
      },
      {
        q: "Какие ограничения на тарифе Free?",
        a: "На Free можно добавить до 50 товаров, сайт выходит с брендом MaxSavdo, а автопостинг в канал не работает. При этом Telegram-бот, корзина, оформление заказа и базовая статистика доступны полностью.",
      },
      {
        q: "Пробный период бесплатный?",
        a: "Да. Тариф Free не ограничен по времени — это не пробный период, а постоянный тариф. Вводить карту или оставлять платёжные данные не нужно, подписку вы выбираете позже и только если она понадобится.",
      },
      {
        q: "Сколько времени занимает открытие магазина?",
        a: "Если фото и цены готовы, первая версия магазина запускается за 5-10 минут. Основное время уходит на размер каталога: добавление одного товара занимает примерно минуту.",
      },
      {
        q: "Придёт ли SMS-код для входа?",
        a: "Нет. Вход подтверждается только через аккаунт Telegram — ни SMS-кода, ни пароля. Поэтому проблемы с неприходящими или задержанными SMS здесь просто не возникают.",
      },
      {
        q: "Можно ли иметь несколько магазинов на одном аккаунте?",
        a: "Пока нет: один продавец — один магазин. Это осознанное ограничение на этапе MVP. Работа с несколькими магазинами есть в планах, но сейчас недоступна.",
      },
      {
        q: "Можно ли подключить свой домен?",
        a: "Пока нет. Каждый магазин работает по адресу shop.maxsavdo.uz/ваш-магазин, и этот адрес индексируется поисковыми системами. Подключение своего домена есть в планах, но пока не работает — поэтому мы не обещаем его как возможность тарифа.",
      },
      {
        q: "Как выглядит ссылка на магазин?",
        a: "Адрес формируется из названия магазина: shop.maxsavdo.uz/ваш-магазин. Это обычная ссылка — её можно поставить в профиль Instagram, в Telegram-канал или в сторис, и она открывается как в браузере, так и внутри Telegram.",
      },
      {
        q: "Есть ли мобильное приложение?",
        a: "Отдельного мобильного приложения пока нет, и оно не нужно: магазин работает внутри Telegram и в браузере. Продавец управляет через бота, покупатель заходит по ссылке — никому ничего не надо скачивать.",
      },
      {
        q: "Как принимать оплату?",
        a: "Условия оплаты вы указываете в настройках магазина сами — например наличными при доставке или тем способом, который используете. Клиент видит эти условия до оформления заказа, поэтому недопониманий становится меньше.",
      },
      {
        q: "Нужно ли клиенту регистрироваться?",
        a: "Нет. Покупателю не нужно регистрироваться и придумывать пароль, чтобы посмотреть каталог и сделать заказ. Это убирает главный барьер на пути к заказу — клиент нажимает ссылку и сразу покупает.",
      },
      {
        q: "Найдёт ли магазин Google?",
        a: "Да. Сайт-витрина — обычная веб-страница, поэтому Google и Яндекс её индексируют. Чтобы повысить шансы быть найденным, стоит писать название и описание товара полно и, если возможно, на русском и узбекском.",
      },
    ],
  },
  faqPage: {
    title: "Вопросы и ответы — MaxSavdo",
    description:
      "Ответы на вопросы о магазине в Telegram: тарифы, комиссия, вход, доставка. Как работает MaxSavdo.",
    h1: "Вопросы и ответы",
    intro:
      "То, что продавцы спрашивают чаще всего об открытии магазина в Telegram, тарифах и ежедневной работе. Каждый ответ самостоятельный — достаточно найти нужный вопрос.",
  },
  guidesPage: {
    title: "Руководства — как продавать в Telegram",
    description:
      "Практические руководства: как открыть магазин в Telegram, сколько это стоит и как перенести продажи из Instagram. Для продавцов Узбекистана.",
    h1: "Руководства",
    intro:
      "Практические руководства по продажам в Telegram: как открыть магазин, сколько это стоит и как перенести продажи из Instagram.",
    readMore: "Читать",
    updatedLabel: "Обновлено",
    backLabel: "Все руководства",
    ctaTitle: "Открыть магазин сейчас",
    ctaBody:
      "Тариф Free работает без ограничения по времени. Зайдите в @maxsavdo_bot и разместите первый товар за 5-10 минут.",
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
    resources: "Полезное",
  },
};

export const dict: Record<Locale, Dict> = { uz, ru };

export function t(locale: Locale): Dict {
  return dict[locale];
}
