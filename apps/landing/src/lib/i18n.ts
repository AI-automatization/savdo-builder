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
    cases: string;
    blog: string;
    about: string;
    contacts: string;
    support: string;
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
  about: {
    eyebrow: string;
    title: string;
    subtitle: string;
    missionTitle: string;
    missionBody: string;
    storyTitle: string;
    storyBody: string;
    stats: Array<{ value: string; label: string }>;
    valuesTitle: string;
    values: Array<{ title: string; body: string }>;
    parentTitle: string;
    parentBody: string;
    ctaTitle: string;
    ctaBody: string;
  };
  howPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    steps: Array<{ n: string; title: string; body: string }>;
    compareTitle: string;
    beforeTitle: string;
    before: string[];
    afterTitle: string;
    after: string[];
    faqTeaserTitle: string;
    faqTeaserCta: string;
  };
  faqPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    categories: Array<{ title: string; items: Array<{ q: string; a: string }> }>;
    cta: string;
  };
  contactsPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    channels: Array<{ title: string; body: string; value: string }>;
    formTitle: string;
    formName: string;
    formNamePlaceholder: string;
    formContact: string;
    formContactPlaceholder: string;
    formTopic: string;
    formTopics: string[];
    formMessage: string;
    formMessagePlaceholder: string;
    formSubmit: string;
  };
  casesPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    note: string;
    readMore: string;
    metricOrders: string;
    metricTime: string;
    metricRepeat: string;
    ctaTitle: string;
    ctaBody: string;
  };
  blogPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    readTime: string;
    backToBlog: string;
    publishedOn: string;
    ctaTitle: string;
    ctaBody: string;
    categories: { guides: string; product: string; market: string };
  };
  supportPage: {
    eyebrow: string;
    title: string;
    subtitle: string;
    responseTitle: string;
    responseValue: string;
    responseBody: string;
    channelTitle: string;
    channelBody: string;
    channelCta: string;
    issuesTitle: string;
    issues: Array<{ title: string; body: string }>;
    faqLink: string;
    formTitle: string;
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
    cases: "Keyslar",
    blog: "Blog",
    about: "Biz haqimizda",
    contacts: "Bogʻlanish",
    support: "Qoʻllab-quvvatlash",
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
  about: {
    eyebrow: "Kompaniya haqida",
    title: "O'zi sotadigan vitrinani biz yaratamiz",
    subtitle: "maxsavdo — O'zbekiston sotuvchilari uchun Telegram'da doʻkon konstruktori.",
    missionTitle: "Nega buni qilamiz",
    missionBody: "Minglab sotuvchilar Telegram va Instagram orqali savdo qiladi — qo'lda hisob, yozishmalarda yo'qolgan buyurtmalar. Biz 5 daqiqada katta marketpleys darajasidagi vitrinani beramiz, butun tushum sotuvchida qoladi.",
    storyTitle: "Hammasi qanday boshlandi",
    storyBody: "Loyiha oddiy kuzatuvdan o'sib chiqdi: sotuvchilar «buyurtma berish uchun qayerga bosish kerak» lahzasida mijozlarni yo'qotishadi. maxsavdo shu lahzani olib tashlaydi.",
    stats: [
      { value: "5 daqiqa", label: "ro'yxatdan o'tishdan birinchi mahsulotgacha" },
      { value: "0%", label: "sotuvdan komissiya" },
      { value: "2", label: "interfeys tili — UZ/RU" },
    ],
    valuesTitle: "Biz nimaga tayanamiz",
    values: [
      { title: "Sotuvchining puli — sotuvchining puli", body: "Sotuvdan komissiyasiz. Obuna orqali daromad topamiz, birovning tushumidan foiz olib emas." },
      { title: "Raqamlarda halollik", body: "Funksiya yo'q bo'lsa — bor deb yozmaymiz. Reja tayyor bo'lmasa — «tez orada» deymiz." },
      { title: "Telegram — platforma, to'siq emas", body: "Auditoriyasi bor joydan sotuvchini ketishga majburlamaymiz — uni kuchaytiramiz." },
    ],
    parentTitle: "maxsavdo ortida kim turibdi",
    parentBody: "maxsavdo — TezCode studiyasining mahsuloti, kompaniyaning asosiy yo'nalishi sifatida ishlab chiqilmoqda.",
    ctaTitle: "Birinchi sotuvchilarga qo'shiling",
    ctaBody: "Yopiq beta — erta narx abadiy mustahkamlanadi.",
  },
  howPage: {
    eyebrow: "Qanday ishlaydi",
    title: "Bo'sh Telegram'dan birinchi buyurtmagacha",
    subtitle: "Besh qadam, har biri bir necha daqiqa. Dasturchisiz va sayt qurishsiz.",
    steps: [
      { n: "1", title: "Telefon raqami orqali kiring", body: "Kod @maxsavdo_bot'ga keladi, parol kerak emas. Akkaunt birinchi kirishda avtomatik yaratiladi." },
      { n: "2", title: "Do'kon yarating", body: "Nom, shahar, Telegram havolasi — boshlash uchun shu kifoya." },
      { n: "3", title: "Mahsulot qo'shing", body: "Rasm, narx, tavsif, variantlar. Katalog katta do'konlardagidek ko'rinadi." },
      { n: "4", title: "Havolani ulashing", body: "Bitta havola — Instagram, Telegram kanali, storis uchun. Xaridor o'zi buyurtma beradi." },
      { n: "5", title: "Buyurtmalarni kabinetda boshqaring", body: "Barcha buyurtmalar statuslar bilan bitta ro'yxatda." },
    ],
    compareTitle: "Oldin va keyin",
    beforeTitle: "maxsavdo-siz",
    before: [
      "Katalog — titkilash kerak bo'lgan postlar lentasi",
      "Buyurtma direktdagi yozishma orqali",
      "Marketpleys komissiyasi — har sotuvdan ~15%",
    ],
    afterTitle: "maxsavdo bilan",
    after: [
      "Qidiruv va kategoriyali katalog",
      "Xaridor o'zi buyurtma beradi",
      "0% komissiya — butun tushum sizniki",
    ],
    faqTeaserTitle: "Savollaringiz qoldimi?",
    faqTeaserCta: "Barcha savollarni ko'rish",
  },
  faqPage: {
    eyebrow: "Savol-javoblar",
    title: "maxsavdo haqida bilishingiz kerak bo'lgan hammasi",
    subtitle: "Javob topmadingizmi — bizga yozing.",
    categories: [
      {
        title: "Umumiy savollar",
        items: [
          { q: "O'z Telegram-botim kerakmi?", a: "Yo'q. Do'kon oddiy havola orqali ishlaydi." },
          { q: "Uzum yoki Olchadan nimasi yaxshi?", a: "Marketpleys har sotuvdan ~15% oladi va o'z brendingizni bermaydi. Sizda — shaxsiy vitrina, komissiyasiz." },
          { q: "Bitta akkauntda bir nechta do'kon yuritish mumkinmi?", a: "Hozircha bitta sotuvchi = bitta do'kon." },
          { q: "Mobil ilova bormi?", a: "Hozircha — telefonga moslashtirilgan veb-versiya." },
        ],
      },
      {
        title: "To'lov va tariflar",
        items: [
          { q: "Bu qancha turadi?", a: "Hozir, yopiq betada — bepul. Birinchi sotuvchilar erta narxni mustahkamlaydi." },
          { q: "Betadan keyin nima bo'ladi?", a: "Pullik rejalar paydo bo'ladi, lekin erta narx birinchi sotuvchilar uchun saqlanadi." },
          { q: "To'lovni to'xtatsam nima bo'ladi?", a: "Do'kon pauza rejimiga o'tadi, mahsulotlar saqlanadi." },
        ],
      },
      {
        title: "Texnik savollar",
        items: [
          { q: "To'lov qanday qabul qilinadi?", a: "Onlayn to'lov keyingi bosqichda ulanadi, hozircha qulay usulda o'zingiz qabul qilasiz." },
          { q: "O'z domenimni ulasa bo'ladimi?", a: "Hozircha yo'q, rejalarda bor." },
          { q: "Nimadir ishlamasa nima qilaman?", a: "«Qo'llab-quvvatlash» sahifasi orqali — Telegram-bot eng tez javob beradi." },
        ],
      },
    ],
    cta: "Qo'llab-quvvatlashga yozish",
  },
  contactsPage: {
    eyebrow: "Bog'lanish",
    title: "Biz aloqadamiz",
    subtitle: "Mahsulot yoki hamkorlik bo'yicha savol — qulay kanalni tanlang.",
    channels: [
      { title: "Telegram", body: "Eng tezi — bir soat ichida javob beramiz.", value: "@maxsavdo_bot" },
      { title: "Email", body: "Hujjatlar va rasmiy murojaatlar uchun.", value: "hello@maxsavdo.uz" },
    ],
    formTitle: "Bizga yozing",
    formName: "Ismingiz",
    formNamePlaceholder: "Ismingiz",
    formContact: "Telegram yoki telefon",
    formContactPlaceholder: "@username yoki +998 __ ___ __ __",
    formTopic: "Murojaat mavzusi",
    formTopics: ["Umumiy savol", "Tariflar", "Hamkorlik", "Texnik muammo"],
    formMessage: "Xabar",
    formMessagePlaceholder: "Savolingizni yozing...",
    formSubmit: "Yuborish",
  },
  casesPage: {
    eyebrow: "Sotuvchilar tarixi",
    title: "Do'konlar maxsavdo'da qanday o'sadi",
    subtitle: "Haqiqiy nishalar asosidagi stsenariylar — ishga tushirishdan barqaror savdogacha.",
    note: "Illyustrativ misollar: real nishalar va o'rtacha ko'rsatkichlar asosida, aniq mijozlarning tasdiqlangan iqtiboslari emas.",
    readMore: "Batafsil",
    metricOrders: "buyurtma/oy",
    metricTime: "ishga tushirish",
    metricRepeat: "takroriy xaridlar",
    ctaTitle: "Shunday natija xohlaysizmi?",
    ctaBody: "Yopiq beta davomida do'koningizni bepul ishga tushiring.",
  },
  blogPage: {
    eyebrow: "Blog",
    title: "Hikoyalar, maslahatlar va mahsulot yangilanishlari",
    subtitle: "Telegram'da qanday sotish va boshlovchilar uchun asoslar.",
    readTime: "daqiqada o'qiladi",
    backToBlog: "Barcha maqolalar",
    publishedOn: "E'lon qilingan",
    ctaTitle: "O'zingiz sinab ko'rishga tayyormisiz?",
    ctaBody: "5 daqiqada do'koningizni bepul yarating.",
    categories: { guides: "Qo'llanmalar", product: "Mahsulot", market: "Bozor" },
  },
  supportPage: {
    eyebrow: "Qo'llab-quvvatlash",
    title: "Tushunishga yordam beramiz",
    subtitle: "Savollarning ko'pi bitta Telegram-suhbatda hal bo'ladi.",
    responseTitle: "O'rtacha javob vaqti",
    responseValue: "< 1 soat",
    responseBody: "ish vaqtida",
    channelTitle: "Eng tezi — Telegram",
    channelBody: "Muammoni tasvirlab yozing — tezroq tushunamiz.",
    channelCta: "@maxsavdo_bot'ga yozish",
    issuesTitle: "Tez-tez uchraydigan muammolar",
    issues: [
      { title: "Tasdiqlash kodi kelmayapti", body: "@maxsavdo_bot bilan suhbat ochiqligini tekshiring, /start'ni qayta bosing." },
      { title: "Do'kon xaridorlarga ko'rinmayapti", body: "Yangi do'kon moderatsiyadan o'tadi — odatda 24 soatgacha." },
      { title: "Mahsulot qo'sha olmayapman", body: "Tarif limitini tekshiring va majburiy maydonlarni to'ldiring." },
      { title: "Xaridor javob bermayapti", body: "Buyurtmadagi kontakt orqali bog'laning." },
    ],
    faqLink: "Barcha savollarni FAQ'da ko'rish",
    formTitle: "Javob topmadingizmi? Yozing",
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
    cases: "Кейсы",
    blog: "Блог",
    about: "О нас",
    contacts: "Контакты",
    support: "Поддержка",
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
  about: {
    eyebrow: "О компании",
    title: "Мы делаем витрину, которая продаёт сама",
    subtitle: "maxsavdo — конструктор магазина в Telegram для продавцов Узбекистана.",
    missionTitle: "Почему мы это делаем",
    missionBody: "Тысячи продавцов ведут бизнес через Telegram и Instagram — переписки, ручной подсчёт заказов. Мы даём витрину уровня большого маркетплейса за 5 минут, оставляя всю выручку у продавца.",
    storyTitle: "Как всё начиналось",
    storyBody: "Проект вырос из наблюдения: продавцы теряют клиентов в момент «куда нажать, чтобы заказать». maxsavdo убирает этот момент.",
    stats: [
      { value: "5 мин", label: "от регистрации до первого товара" },
      { value: "0%", label: "комиссии с продаж" },
      { value: "2", label: "языка интерфейса — UZ/RU" },
    ],
    valuesTitle: "На чём мы стоим",
    values: [
      { title: "Деньги продавца — деньги продавца", body: "Без комиссии с продаж. Зарабатываем на подписке, а не на проценте с чужой выручки." },
      { title: "Честность в цифрах", body: "Если фичи нет — не пишем, что она есть. Если тариф не готов — говорим «скоро»." },
      { title: "Telegram — платформа, а не костыль", body: "Не заставляем продавца уходить с площадки, где уже есть его аудитория." },
    ],
    parentTitle: "Кто стоит за maxsavdo",
    parentBody: "maxsavdo — продукт студии TezCode, разрабатывается как основной продукт компании.",
    ctaTitle: "Присоединяйтесь к первым продавцам",
    ctaBody: "Закрытая бета — ранняя цена закрепляется навсегда.",
  },
  howPage: {
    eyebrow: "Как это работает",
    title: "От пустого Telegram до первого заказа",
    subtitle: "Пять шагов, каждый — несколько минут. Без разработчика и сайтостроителя.",
    steps: [
      { n: "1", title: "Войдите по номеру телефона", body: "Код приходит в @maxsavdo_bot, пароль не нужен. Аккаунт создаётся автоматически." },
      { n: "2", title: "Создайте магазин", body: "Название, город, ссылка на Telegram — этого достаточно для старта." },
      { n: "3", title: "Добавьте товары", body: "Фото, цена, описание, варианты. Каталог как у больших магазинов." },
      { n: "4", title: "Поделитесь ссылкой", body: "Одна ссылка — в Instagram, Telegram-канал, сторис. Покупатель заказывает сам." },
      { n: "5", title: "Обрабатывайте заказы в кабинете", body: "Все заказы в одном списке со статусами." },
    ],
    compareTitle: "До и после",
    beforeTitle: "Без maxsavdo",
    before: [
      "Каталог — лента постов, которую нужно листать",
      "Заказ оформляется перепиской в директ",
      "Комиссия маркетплейса — ~15% с продажи",
    ],
    afterTitle: "С maxsavdo",
    after: [
      "Каталог с поиском и категориями",
      "Покупатель сам оформляет заказ",
      "0% комиссии — вся выручка ваша",
    ],
    faqTeaserTitle: "Остались вопросы?",
    faqTeaserCta: "Смотреть все вопросы",
  },
  faqPage: {
    eyebrow: "Вопросы и ответы",
    title: "Всё, что нужно знать о maxsavdo",
    subtitle: "Не нашли ответ — напишите нам.",
    categories: [
      {
        title: "Общие вопросы",
        items: [
          { q: "Нужен ли свой Telegram-бот?", a: "Нет. Магазин работает по обычной ссылке." },
          { q: "Чем это лучше Uzum или Olcha?", a: "Маркетплейс берёт ~15% с продажи и не даёт своего бренда. У вас — собственная витрина, без комиссии." },
          { q: "Можно вести несколько магазинов на аккаунт?", a: "Сейчас один продавец = один магазин." },
          { q: "Есть ли мобильное приложение?", a: "Пока — веб-версия, оптимизированная под телефон." },
        ],
      },
      {
        title: "Оплата и тарифы",
        items: [
          { q: "Сколько это стоит?", a: "Сейчас, в закрытой бете, — бесплатно. Первые продавцы фиксируют раннюю цену." },
          { q: "Что будет после беты?", a: "Появятся платные планы, но ранняя цена сохранится для первых продавцов." },
          { q: "Что будет, если перестану платить?", a: "Магазин перейдёт в режим паузы, товары сохранятся." },
        ],
      },
      {
        title: "Технические вопросы",
        items: [
          { q: "Как принимается оплата?", a: "Онлайн-оплата подключится позже, сейчас принимаете удобным способом сами." },
          { q: "Можно подключить свой домен?", a: "Пока нет, в планах." },
          { q: "Что делать, если что-то не работает?", a: "Через страницу «Поддержка» — Telegram-бот отвечает быстрее всего." },
        ],
      },
    ],
    cta: "Написать в поддержку",
  },
  contactsPage: {
    eyebrow: "Связаться с нами",
    title: "Мы на связи",
    subtitle: "Вопрос по продукту или партнёрству — выберите удобный канал.",
    channels: [
      { title: "Telegram", body: "Быстрее всего — отвечаем в течение часа.", value: "@maxsavdo_bot" },
      { title: "Email", body: "Для документов и официальных обращений.", value: "hello@maxsavdo.uz" },
    ],
    formTitle: "Написать нам",
    formName: "Как вас зовут",
    formNamePlaceholder: "Ваше имя",
    formContact: "Telegram или телефон",
    formContactPlaceholder: "@username или +998 __ ___ __ __",
    formTopic: "Тема обращения",
    formTopics: ["Общий вопрос", "Тарифы", "Партнёрство", "Техническая проблема"],
    formMessage: "Сообщение",
    formMessagePlaceholder: "Опишите вопрос...",
    formSubmit: "Отправить",
  },
  casesPage: {
    eyebrow: "Истории продавцов",
    title: "Как магазины растут на maxsavdo",
    subtitle: "Сценарии на основе реальных ниш — от запуска до стабильных продаж.",
    note: "Иллюстративные примеры: построены на реальных нишах и типичных показателях, а не на подтверждённых цитатах конкретных клиентов.",
    readMore: "Подробнее",
    metricOrders: "заказов/мес",
    metricTime: "на запуск",
    metricRepeat: "повторных покупок",
    ctaTitle: "Хотите такой же результат?",
    ctaBody: "Запустите магазин бесплатно, пока идёт закрытая бета.",
  },
  blogPage: {
    eyebrow: "Блог",
    title: "Истории, советы и обновления продукта",
    subtitle: "Как продавать в Telegram и матчасть для начинающих.",
    readTime: "мин чтения",
    backToBlog: "Все статьи",
    publishedOn: "Опубликовано",
    ctaTitle: "Готовы попробовать сами?",
    ctaBody: "Создайте магазин бесплатно за 5 минут.",
    categories: { guides: "Гайды", product: "Продукт", market: "Рынок" },
  },
  supportPage: {
    eyebrow: "Поддержка",
    title: "Мы поможем разобраться",
    subtitle: "Большинство вопросов решаются за один Telegram-диалог.",
    responseTitle: "Среднее время ответа",
    responseValue: "< 1 часа",
    responseBody: "в рабочее время",
    channelTitle: "Быстрее всего — Telegram",
    channelBody: "Опишите проблему — так быстрее разберёмся.",
    channelCta: "Написать в @maxsavdo_bot",
    issuesTitle: "Частые проблемы",
    issues: [
      { title: "Не приходит код подтверждения", body: "Проверьте диалог с @maxsavdo_bot, нажмите /start ещё раз." },
      { title: "Магазин не виден покупателям", body: "Новый магазин проходит модерацию — обычно до 24 часов." },
      { title: "Не могу добавить товар", body: "Проверьте лимит тарифа и обязательные поля." },
      { title: "Покупатель не отвечает", body: "Свяжитесь по контакту из заказа." },
    ],
    faqLink: "Смотреть все вопросы в FAQ",
    formTitle: "Не нашли ответ? Напишите",
  },
};

export const dict: Record<Locale, Dict> = { uz, ru };

export function t(locale: Locale): Dict {
  return dict[locale];
}
