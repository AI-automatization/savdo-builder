import type { Locale } from "./i18n";

/**
 * The content layer for GEO/AEO.
 *
 * Why this exists: the landing page alone is a single transactional URL. Generative
 * engines (ChatGPT/Perplexity/AI Overviews/Yandex Neyro) cite *answers*, not pricing
 * blocks — so there has to be a page per real question a seller asks, each opening
 * with a self-contained answer the model can lift verbatim.
 *
 * Shape rules, applied to every guide below (these are the levers, not decoration):
 * - `answer` is 40-60 words and must make sense with zero surrounding context. It is
 *   rendered as the first paragraph AND fed to `Article.description`/`abstract`.
 * - `sections` prefer bullets and tables over prose — extractable beats readable-prose.
 * - `faq` is per-guide and gets its own FAQPage markup on that URL.
 * - `updated` is a real content date. Freshness is a citation signal, so it must not
 *   be a build timestamp — bump it only when the words actually change.
 *
 * Product facts here are load-bearing; keep them true to the platform:
 * one seller = one shop, Telegram-only login (never SMS), no mobile app yet,
 * no per-sale commission, storefront lives at shop.maxsavdo.uz/<slug>.
 */

/** Stable identity across locales — what pairs a uz guide with its ru twin for hreflang. */
export type GuideKey =
  | "open-shop"
  | "pricing"
  | "instagram-migration"
  | "inventory"
  | "checkout";

export type GuideTable = {
  head: string[];
  rows: string[][];
};

/**
 * A real screenshot of the flow the section describes.
 *
 * Why this exists: Experience is the one E-E-A-T dimension a competitor cannot
 * fabricate, and text alone carries none of it. A genuine capture of the bot
 * creating a shop is worth more here than another paragraph.
 *
 * `width`/`height` are the file's intrinsic pixels, not the display size — they
 * are what lets the browser reserve the box before the file lands (CLS).
 * `alt` describes what is on screen; it is not a place to repeat the heading.
 */
export type GuideImage = {
  /** Path under `public/`, e.g. `/guides/open-shop-bot-start.png`. */
  src: string;
  alt: string;
  width: number;
  height: number;
  /** Optional visible caption under the image. */
  caption?: string;
};

export type GuideSection = {
  heading: string;
  body?: string[];
  bullets?: string[];
  table?: GuideTable;
  image?: GuideImage;
};

export type GuideHowTo = {
  name: string;
  totalTime: string;
  steps: Array<{ name: string; text: string }>;
};

export type Guide = {
  key: GuideKey;
  slug: string;
  title: string;
  h1: string;
  description: string;
  /** 40-60 words, self-contained. The single highest-leverage field in this file. */
  answer: string;
  updated: string;
  sections: GuideSection[];
  faq: Array<{ q: string; a: string }>;
  howTo?: GuideHowTo;
};

const uzGuides: Guide[] = [
  {
    key: "open-shop",
    slug: "telegramda-dokon-ochish",
    title: "Telegramda doʻkon qanday ochiladi — 2026 yil qoʻllanmasi",
    h1: "Telegramda doʻkon qanday ochiladi",
    description:
      "Telegramda onlayn doʻkon ochishning bosqichma-bosqich qoʻllanmasi: bot, sayt-vitrina va kanal-postlar. Dasturchi va kompyuter kerak emas.",
    answer:
      "Telegramda doʻkon ochish uchun @maxsavdo_bot ga kirib, doʻkon nomini tanlaysiz va mahsulotlarni rasm va narx bilan qoʻshasiz. Kirish Telegram akkaunti orqali tasdiqlanadi, SMS kod kerak emas. Bot avtomatik ravishda savatcha va checkout bilan ishlaydigan sayt-vitrina yaratadi. Butun jarayon telefonda bajariladi, dasturchi kerak emas va odatda 5-10 daqiqa oladi.",
    updated: "2026-07-30",
    howTo: {
      name: "Telegramda doʻkon ochish",
      totalTime: "PT10M",
      steps: [
        {
          name: "Botga kirish",
          text: "Telegramda @maxsavdo_bot ni oching va «Boshlash» ni bosing. Kirish Telegram akkauntingiz orqali tasdiqlanadi — parol oʻylab topish yoki SMS kodini kutish kerak emas.",
        },
        {
          name: "Doʻkon nomi va manzilini tanlash",
          text: "Doʻkon nomini kiritasiz, bot esa undan sayt manzilini yasaydi: shop.maxsavdo.uz/sizning-dokon. Bu havolani mijozlarga yuborasiz — ular brauzerda ham, Telegram ichida ham ochadi.",
        },
        {
          name: "Mahsulot qoʻshish",
          text: "Har bir mahsulot uchun rasm, nom, narx va tavsif qoʻshasiz. Oʻlcham yoki rang kabi variantlarni ham koʻrsatish mumkin. Bot har bir qadamda nima kiritish kerakligini soʻrab boradi.",
        },
        {
          name: "Yetkazib berish va toʻlov shartlarini yozish",
          text: "Qaysi hududlarga yetkazib berasiz, narxi qancha va toʻlovni qanday qabul qilasiz — shularni doʻkon sozlamalarida koʻrsatasiz. Mijoz buyurtma berishdan oldin buni koʻradi.",
        },
        {
          name: "Havolani tarqatish",
          text: "Doʻkon havolasini Instagram profilingizga, Telegram kanalingizga va statuslarga qoʻyasiz. Buyurtmalar bot orqali sizga xabar sifatida tushadi.",
        },
      ],
    },
    sections: [
      {
        heading: "Nima uchun aynan Telegram",
        body: [
          "Oʻzbekistonda savdo koʻp hollarda Telegram va Instagram-direct orqali boradi — mijoz allaqachon shu ilovada. Alohida ilova yuklab olishni talab qilmaydigan doʻkon konversiyani yoʻqotmaydi: xaridor havolani bosadi va darhol katalogni koʻradi.",
          "Telegram-doʻkonning klassik onlayn-doʻkondan farqi shundaki, unda ishonch allaqachon mavjud: mijoz siz bilan xuddi shu ilovada yozishgan. Shu bilan birga savatcha, buyurtma statuslari va tahlil — yozishmada emas, tizimda boʻladi.",
        ],
      },
      {
        heading: "Nima kerak boʻladi",
        bullets: [
          "Telegram akkaunti bilan smartfon — kompyuter shart emas",
          "Mahsulot rasmlari (telefonda olingan surat ham yetadi)",
          "Narxlar va yetkazib berish shartlari",
          "Doʻkon nomi — sayt manzili shundan yasaladi",
        ],
      },
      {
        heading: "Ochilgandan keyin nima boʻladi",
        body: [
          "Doʻkon uchta joyda bir vaqtda ishlay boshlaydi va uchalasi bitta katalogdan oziqlanadi — mahsulotni bir joyda oʻzgartirsangiz, hammasida oʻzgaradi.",
        ],
        bullets: [
          "Telegram-bot — mahsulot va buyurtmalarni telefondan boshqarasiz",
          "Sayt-vitrina — shop.maxsavdo.uz/sizning-dokon manzilida, Google va Yandex indekslaydi",
          "Kanal-postlar — yangi mahsulot qoʻshilganda kanalga post avtomatik chiqadi",
        ],
      },
      {
        heading: "Odatiy xatolar",
        table: {
          head: ["Xato", "Nima boʻladi", "Qanday toʻgʻrilash"],
          rows: [
            [
              "Rasmsiz mahsulot",
              "Xaridor nima sotilayotganini tushunmaydi va chiqib ketadi",
              "Har bir mahsulotga kamida bitta aniq rasm qoʻyish",
            ],
            [
              "Narx koʻrsatilmagan",
              "«Narxi?» degan xabarlar oqimi qaytadan boshlanadi",
              "Narxni har bir kartochkada koʻrsatish — doʻkonning asosiy maqsadi shu",
            ],
            [
              "Tavsif faqat bir tilda",
              "Boshqa tildagi qidiruv soʻrovlari boʻyicha doʻkon topilmaydi",
              "Nom va tavsifni oʻzbek va rus tilida yozish",
            ],
            [
              "Yetkazib berish sharti yozilmagan",
              "Buyurtmadan keyin bahs va bekor qilishlar koʻpayadi",
              "Hudud, muddat va narxni doʻkon sozlamalarida koʻrsatish",
            ],
          ],
        },
      },
    ],
    faq: [
      {
        q: "Telegramda doʻkon ochish uchun dasturchi kerakmi?",
        a: "Yoʻq. Doʻkon @maxsavdo_bot ichida sozlanadi: nom, mahsulot, narx va yetkazib berish shartlarini kiritasiz, sayt-vitrina esa avtomatik yasaladi. Kod yozish, domen sotib olish yoki hosting sozlash talab qilinmaydi.",
      },
      {
        q: "Doʻkon ochish qancha vaqt oladi?",
        a: "Mahsulot rasmlari va narxlari tayyor boʻlsa, birinchi versiyasi 5-10 daqiqada ishga tushadi. Katalog kattaligi — asosiy vaqt sarfi: har bir mahsulotni qoʻshish taxminan bir daqiqa oladi.",
      },
      {
        q: "Kirish uchun SMS kod keladimi?",
        a: "Yoʻq. Kirish faqat Telegram akkaunti orqali tasdiqlanadi — SMS kodi ham, parol ham yoʻq. Bu SMS kutish va kod kelmasligi bilan bogʻliq muammolarni butunlay olib tashlaydi.",
      },
      {
        q: "Bitta akkauntda bir nechta doʻkon ochish mumkinmi?",
        a: "Hozircha yoʻq — bitta sotuvchi uchun bitta doʻkon. Bu MVP bosqichidagi ataylab qoʻyilgan cheklov. Bir nechta doʻkon bilan ishlash rejalashtirilgan, lekin hali mavjud emas.",
      },
    ],
  },
  {
    key: "pricing",
    slug: "telegram-dokon-narxi",
    title: "Telegram-doʻkon narxi: komissiya va obuna solishtirildi",
    h1: "Telegram-doʻkon qancha turadi",
    description:
      "Telegram-doʻkon narxi: obuna va marketplace komissiyasi solishtirildi. Qaysi aylanmada obuna arzonroq boʻladi — jadval va hisob.",
    answer:
      "MaxSavdo da Telegram-doʻkon fiksatsiya qilingan oylik obuna boʻyicha ishlaydi: Free tarifi 0 soʻm, Pro 149 000 soʻm/oy, Studio 399 000 soʻm/oy. Sotuvdan komissiya olinmaydi — aylanma oshsa ham toʻlov oʻzgarmaydi. Marketplace odatda har bir sotuvdan ulush oladi, shuning uchun aylanma oshgani sari farq kattalashadi.",
    updated: "2026-07-30",
    sections: [
      {
        heading: "Tariflar",
        table: {
          head: ["Tarif", "Narx", "Kimga", "Asosiy cheklov"],
          rows: [
            [
              "Free",
              "0 soʻm",
              "Sinab koʻrish uchun",
              "50 ta mahsulot va oyiga 50 ta buyurtma",
            ],
            [
              "Pro",
              "149 000 soʻm/oy",
              "Faol savdogarlar",
              "Mahsulot va buyurtma soni cheklanmagan",
            ],
            [
              "Studio",
              "399 000 soʻm/oy",
              "Katta doʻkonlar",
              "Pro dagi hamma narsa + API kirishi",
            ],
          ],
        },
      },
      {
        heading: "Obuna va komissiya — qaysi biri arzonroq",
        body: [
          "Farqni tushunish uchun bitta hisobni koʻrib chiqamiz. Marketplace har bir sotuvdan taxminan 15% oladi. Obuna esa aylanmaga bogʻliq emas.",
        ],
        table: {
          head: ["Oylik aylanma", "15% komissiya", "Pro obunasi", "Farq"],
          rows: [
            ["1 000 000 soʻm", "150 000 soʻm", "149 000 soʻm", "deyarli teng"],
            ["3 000 000 soʻm", "450 000 soʻm", "149 000 soʻm", "obuna 301 000 soʻm arzon"],
            ["10 000 000 soʻm", "1 500 000 soʻm", "149 000 soʻm", "obuna 1 351 000 soʻm arzon"],
          ],
        },
      },
      {
        heading: "Xulosa",
        bullets: [
          "Aylanma oyiga ~1 mln soʻmdan past boʻlsa — Free tarifidan boshlash mantiqiy",
          "Aylanma 1 mln soʻmdan oshsa — obuna komissiyadan arzonroq va farq tez oʻsadi",
          "Aylanma qancha katta boʻlsa, komissiyasiz model shuncha foydali",
        ],
      },
      {
        heading: "Yashirin toʻlovlar bormi",
        body: [
          "Yoʻq. Obuna narxi — toʻliq narx: sotuvdan ulush, tranzaksiya uchun qoʻshimcha foiz yoki mahsulot joylashtirish uchun toʻlov yoʻq. Free tarifi vaqt boʻyicha cheklanmagan, ya'ni sinov muddati tugab qolmaydi.",
          "Free tarifidagi yagona jiddiy chegara — oyiga 50 ta buyurtma. Bu chegaradan oshsa doʻkon vaqtincha yopiladi, shuning uchun savdo oʻsganda Pro ga oʻtish kerak boʻladi.",
        ],
      },
    ],
    faq: [
      {
        q: "Sotuvdan komissiya olinadimi?",
        a: "Yoʻq. Har bir sotuvdan ulush olinmaydi — faqat fiksatsiya qilingan oylik obuna. Oyiga 1 million yoki 50 million soʻmga savdo qilasizmi, obuna toʻlovi bir xil qoladi.",
      },
      {
        q: "Free tarifida qancha vaqt ishlash mumkin?",
        a: "Vaqt cheklovisiz. Free — sinov muddati emas, doimiy tarif: 50 ta mahsulotgacha, oyiga 50 ta buyurtmagacha, Telegram-bot va MaxSavdo brendi bilan sayt. Buyurtma chegarasidan oshsa doʻkon vaqtincha yopiladi.",
      },
      {
        q: "Tarifni keyin oʻzgartirish mumkinmi?",
        a: "Ha. Free dan Pro yoki Studio ga oʻtish va orqaga tushish mumkin. Doʻkon, mahsulotlar va buyurtmalar tarixi saqlanadi — faqat cheklovlar oʻzgaradi.",
      },
      {
        q: "Narxlar soʻmda belgilanganmi?",
        a: "Ha, tariflar soʻmda: Pro — 149 000 soʻm/oy, Studio — 399 000 soʻm/oy. Valyuta kursiga bogʻlangan toʻlov yoʻq, shuning uchun oylik xarajat oldindan aniq boʻladi.",
      },
    ],
  },
  {
    key: "instagram-migration",
    slug: "instagram-dokonni-telegramga-kochirish",
    title: "Instagram-doʻkonni Telegramga koʻchirish — amaliy qoʻllanma",
    h1: "Instagram-doʻkonni Telegramga qanday koʻchirish",
    description:
      "Instagram-directdagi savdoni Telegram-doʻkonga koʻchirish: nimadan boshlash, auditoriyani qanday olib oʻtish va nimani yoʻqotmaslik kerak.",
    answer:
      "Instagram-doʻkonni koʻchirish uchun avval @maxsavdo_bot da katalogni yaratasiz, soʻng doʻkon havolasini Instagram profilingizga va storieslarga qoʻyasiz. Instagram vitrina va reklama kanali sifatida qoladi, buyurtma va checkout esa Telegramga oʻtadi. Auditoriyani tashlab ketmaysiz — uni oddiy havola orqali yangi doʻkonga olib oʻtasiz.",
    updated: "2026-07-30",
    sections: [
      {
        heading: "Nima uchun koʻchirish kerak",
        bullets: [
          "Directda buyurtmalar yozishmalarda choʻkib ketadi — manzil va summa chalkashadi",
          "«Narxi?» savoliga har kuni qoʻlda javob yozishga toʻgʻri keladi",
          "Savatcha va buyurtma rasmiylashtirish yoʻq — mijoz oʻzi hisoblab yozadi",
          "Nima sotilayotgani boʻyicha statistika yoʻq",
        ],
      },
      {
        heading: "Koʻchirish tartibi",
        body: [
          "Instagram akkauntini oʻchirish kerak emas — u trafik manbai boʻlib qoladi. Maqsad buyurtma oqimini yozishmadan tizimga olib oʻtish.",
        ],
        bullets: [
          "Eng koʻp sotiladigan 10-20 mahsulotni botga qoʻshasiz — butun katalogni birdan koʻchirish shart emas",
          "Doʻkon havolasini Instagram profilidagi «sayt» maydoniga qoʻyasiz",
          "Storieslarda havolali stiker bilan doʻkonni bir necha kun eslatib turasiz",
          "Directga narx soʻrab yozganlarga havolani yuborasiz — javob yozish oʻrniga",
          "Bir-ikki hafta ishlagach qolgan katalogni ham koʻchirasiz",
        ],
      },
      {
        heading: "Nima oʻzgaradi",
        table: {
          head: ["", "Instagram-direct", "Telegram-doʻkon"],
          rows: [
            ["Katalog", "Postlar va storieslarda tarqoq", "Bitta katalog, qidiruv bilan"],
            ["Narx", "Har safar qoʻlda yoziladi", "Kartochkada koʻrinadi"],
            ["Buyurtma", "Yozishmada kelishiladi", "Savatcha va checkout"],
            ["Statistika", "Yoʻq", "Sotuv va top-mahsulotlar"],
            ["Qidiruvda topilishi", "Topilmaydi", "Google va Yandex indekslaydi"],
          ],
        },
      },
      {
        heading: "Nimani yoʻqotmaslik kerak",
        body: [
          "Koʻchirishda eng koʻp uchraydigan xato — Instagramni tashlab ketish. U yerda auditoriya yigʻilgan, shuning uchun kontent chiqishda davom etishi kerak; oʻzgarishi kerak boʻlgan narsa — buyurtma qayerda rasmiylashtirilishi.",
          "Ikkinchi xato — mahsulot tavsiflarini faqat bir tilda yozish. Sayt-vitrina qidiruv tizimlariga tushadi, shuning uchun nom va tavsifni oʻzbek va rus tilida yozish doʻkonni topiladigan qiladi.",
        ],
      },
    ],
    faq: [
      {
        q: "Instagram akkauntini oʻchirish kerakmi?",
        a: "Yoʻq va tavsiya qilinmaydi. Instagram trafik manbai va vitrina boʻlib qoladi — u yerda auditoriyangiz yigʻilgan. Faqat buyurtma qabul qilish joyi oʻzgaradi: directdagi yozishma oʻrniga savatcha va checkout.",
      },
      {
        q: "Mijozlar Telegramga oʻtadimi?",
        a: "Oʻzbekistonda Telegram allaqachon eng koʻp ishlatiladigan messenjer, shuning uchun alohida ilova yuklab olish talab qilinmaydi. Mijoz havolani bosadi va darhol katalogni koʻradi — roʻyxatdan oʻtish ham shart emas.",
      },
      {
        q: "Butun katalogni birdan koʻchirish kerakmi?",
        a: "Yoʻq. Eng koʻp sotiladigan 10-20 mahsulotdan boshlash yetarli — shu bilan doʻkon ishlay boshlaydi. Qolgan mahsulotlarni keyin, ish jarayonida qoʻshib borish qulayroq.",
      },
    ],
  },
  {
    key: "inventory",
    slug: "telegram-dokonda-ombor-hisobi",
    title: "Telegram-doʻkonda ombor hisobi qanday yuritiladi",
    h1: "Telegram-doʻkonda ombor hisobi",
    description:
      "MaxSavdo'da tovar qoldigʻi qanday hisoblanadi: buyurtma tushganda son avtomatik kamayadi, bekor qilinsa qaytadi. Alohida ombor dasturi qachon kerak boʻlishi — shu yerda.",
    answer:
      "MaxSavdo'da har bir mahsulotga ombordagi son kiritiladi. Xaridor buyurtma bersa, shu son avtomatik kamayadi; buyurtma bekor qilinsa, tovar omborga qaytadi. Qoldiq nolga tushganda mahsulot vitrinada «Mavjud emas» deb koʻrsatiladi va sotib olinmaydi. Bu — bitta doʻkon uchun sotuvga bogʻliq asosiy ombor hisobi; koʻp filial yoki partiya darajasidagi hisobot alohida dastur talab qiladi.",
    updated: "2026-08-04",
    sections: [
      {
        heading: "Ombor hisobi qanday ishlaydi",
        bullets: [
          "Mahsulot qoʻshganda ombordagi sonni kiritasiz — masalan, 30 dona",
          "Xaridor buyurtma bersa, sotilgan son avtomatik ayiriladi",
          "Buyurtma bekor qilinsa yoki rad etilsa, son omborga qaytadi",
          "Qoldiq kam qolganda kartochkada «Qoldi: N dona» koʻrinadi",
          "Qoldiq nolga tushsa, mahsulot «Mavjud emas» deb belgilanadi va sotib olinmaydi",
        ],
      },
      {
        heading: "Nega bu muhim",
        body: [
          "Ombordagi haqiqiy sondan koʻp sotib yuborish — Instagram-direct yoki qogʻoz daftarda hisob yuritganlarning eng koʻp uchraydigan muammosi: mijozga «bor» deb yozib qoʻyiladi, keyin tovar yoʻqligi maʼlum boʻladi. Buyurtma va ombor bitta tizimda boʻlgani uchun son qoʻlda kuzatilmaydi — avtomatik yangilanadi.",
        ],
      },
      {
        heading: "Qachon yetarli, qachon yetarli emas",
        table: {
          head: ["Holat", "MaxSavdo yetadimi"],
          rows: [
            ["Bitta doʻkon, bitta umumiy qoldiq", "Ha — sotuvga bogʻliq son avtomatik hisoblanadi"],
            ["Bir nechta filial/ombor oʻrtasida boʻlinish", "Yoʻq — hozircha bitta doʻkon uchun bitta umumiy qoldiq"],
            ["Partiya, seriya yoki yaroqlilik muddati boʻyicha hisob", "Yoʻq — faqat umumiy son, partiya darajasi yoʻq"],
            ["Fizik doʻkondagi kassa bilan bitta hisobda ishlash", "Yoʻq — MaxSavdo faqat onlayn buyurtmalar boʻyicha qoldiqni hisoblaydi"],
          ],
        },
      },
      {
        heading: "Odatiy xatolar",
        table: {
          head: ["Xato", "Nima boʻladi", "Qanday toʻgʻrilash"],
          rows: [
            [
              "Ombordagi sonni kiritmaslik",
              "Tizim doim «mavjud» deb koʻrsatadi, tugagan tovar ham sotiladi",
              "Har bir mahsulotga aniq son kiritish",
            ],
            [
              "Sonni faqat oy oxirida yangilash",
              "Kartochkadagi son haqiqiy qoldiqdan farq qiladi",
              "Yangi partiya kelganda sonni darhol yangilash",
            ],
            [
              "Bekor qilingan buyurtmalarni hisobga olmaslik",
              "Aslida bor tovar «tugagan» boʻlib koʻrinishi mumkin",
              "Joriy qoldiqni buyurtmalar tarixi bilan vaqti-vaqtida solishtirish",
            ],
          ],
        },
      },
    ],
    faq: [
      {
        q: "MaxSavdo toʻliq ombor dasturi (WMS)mi?",
        a: "Yoʻq. MaxSavdo har bir mahsulot uchun bitta umumiy qoldiqni sotuvga bogʻlab yuritadi — buyurtma tushganda kamayadi, bekor boʻlsa qaytadi. Koʻp ombor, partiya yoki seriya darajasidagi toʻliq WMS funksiyasi yoʻq.",
      },
      {
        q: "Qoldiq qachon avtomatik yangilanadi?",
        a: "Ikki holatda: xaridor buyurtma berganda (kamayadi) va buyurtma bekor qilinganda yoki rad etilganda (qaytadi). Boshqa barcha holatda sonni sotuvchi qoʻlda kiritadi va oʻzgartiradi.",
      },
      {
        q: "Tovar tugasa xaridor uni koʻra oladimi?",
        a: "Ha, lekin sotib ololmaydi — kartochkada «Mavjud emas» belgisi chiqadi. Bu tovar tugaganda ortiqcha buyurtma tushishining oldini oladi.",
      },
    ],
  },
  {
    key: "checkout",
    slug: "telegram-dokonda-onlayn-kassa",
    title: "Telegram-doʻkonda onlayn kassa qanday ishlaydi",
    h1: "Telegram-doʻkonda onlayn kassa",
    description:
      "MaxSavdo'dagi savatcha va checkout onlayn buyurtmalarni qanday rasmiylashtiradi — va bu nega qonun talab qiladigan fiskal kassa apparatini almashtirmasligi.",
    answer:
      "MaxSavdo'dagi «kassa» — bu savatcha va checkout: xaridor mahsulotni tanlaydi, yetkazib berish manzilini kiritadi va naqd yoki karta orqali toʻlov turini tanlaydi, buyurtma esa sotuvchiga @maxsavdo_bot orqali avtomatik tushadi. Bu onlayn buyurtmalarni rasmiylashtiradi, lekin Oʻzbekistonda naqd savdo uchun qonun talab qilishi mumkin boʻlgan fiskal kassa apparatini almashtirmaydi — ular alohida masala.",
    updated: "2026-08-04",
    sections: [
      {
        heading: "Checkout qanday ishlaydi",
        bullets: [
          "Xaridor mahsulotni savatchaga qoʻshadi va miqdorini tanlaydi",
          "Yetkazib berish hududi va manzilini kiritadi",
          "Toʻlov turini tanlaydi — naqd (yetkazib berishda) yoki karta orqali oʻtkazma",
          "Buyurtma tasdiqlangach, sotuvchiga @maxsavdo_bot orqali avtomatik xabar tushadi",
          "Sotuvchi buyurtma holatini (qabul qilindi, yetkazilmoqda, bajarildi) tizimda yangilaydi",
        ],
      },
      {
        heading: "Toʻlov turlari",
        table: {
          head: ["Toʻlov turi", "Qanday ishlaydi"],
          rows: [
            ["Naqd (yetkazib berishda)", "Xaridor kuryerga yoki olib ketishda naqd toʻlaydi"],
            [
              "Karta orqali oʻtkazma",
              "Sotuvchi oʻz karta rekvizitini sozlamalarda yoqadi, xaridor shu raqamga oʻtkazadi",
            ],
          ],
        },
      },
      {
        heading: "Bu fiskal kassa apparatimi?",
        body: [
          "Yoʻq. Oʻzbekiston qonunchiligida naqd pul yoki karta orqali savdo qilganda roʻyxatdan oʻtgan fiskal kassa apparati yoki onlayn-kassa moduli talab qilinishi mumkin — bu alohida, davlat tomonidan tasdiqlangan uskuna yoki dastur. MaxSavdo'dagi checkout buyurtmani onlayn rasmiylashtiradi, lekin fiskal chek chiqarmaydi va soliq idorasiga hisobot bermaydi. Fiskal talab sizga tegishli boʻlsa, buni alohida hal qilish kerak.",
        ],
      },
    ],
    faq: [
      {
        q: "MaxSavdo kassa apparatini almashtiradimi?",
        a: "Yoʻq. MaxSavdo — Telegram-doʻkon uchun onlayn buyurtma va toʻlov qabul qilish tizimi (savatcha, checkout). Qonun talab qiladigan fiskal kassa apparati yoki onlayn-kassa moduli bilan bogʻliq emas va uni almashtirmaydi.",
      },
      {
        q: "Toʻlovni qanday qabul qilish mumkin?",
        a: "Ikki asosiy usul bor: yetkazib berishda naqd yoki sotuvchining karta rekvizitiga oʻtkazma. Karta raqami xaridorga faqat sotuvchi uni doʻkon sozlamalarida yoqib qoʻygan boʻlsa koʻrinadi.",
      },
      {
        q: "Buyurtma qabul qilingani sotuvchiga qanday yetib boradi?",
        a: "Xaridor checkoutʼni yakunlashi bilan sotuvchiga @maxsavdo_bot orqali avtomatik xabar tushadi — mahsulot, miqdor, manzil va toʻlov turi bilan. Yozishmani kutib tekshirib oʻtirish shart emas.",
      },
    ],
  },
];

const ruGuides: Guide[] = [
  {
    key: "open-shop",
    slug: "kak-otkryt-magazin-v-telegram",
    title: "Как открыть магазин в Telegram — пошаговое руководство 2026",
    h1: "Как открыть магазин в Telegram",
    description:
      "Пошаговое руководство: как открыть онлайн-магазин в Telegram — бот, сайт-витрина и автопостинг. Без разработчика и без компьютера.",
    answer:
      "Чтобы открыть магазин в Telegram, зайдите в @maxsavdo_bot, укажите название магазина и добавьте товары с фото и ценой. Бот автоматически создаёт сайт-витрину с корзиной и оформлением заказа. Весь процесс делается с телефона, разработчик не нужен и обычно занимает 5-10 минут.",
    updated: "2026-07-30",
    howTo: {
      name: "Открыть магазин в Telegram",
      totalTime: "PT10M",
      steps: [
        {
          name: "Войти в бота",
          text: "Откройте @maxsavdo_bot в Telegram и нажмите «Начать». Вход подтверждается через ваш Telegram-аккаунт — не нужно придумывать пароль и ждать SMS-код.",
        },
        {
          name: "Выбрать название и адрес магазина",
          text: "Вы вводите название, а бот делает из него адрес сайта: shop.maxsavdo.uz/ваш-магазин. Эту ссылку вы отправляете клиентам — она открывается и в браузере, и внутри Telegram.",
        },
        {
          name: "Добавить товары",
          text: "Для каждого товара добавляете фото, название, цену и описание. Можно указать варианты — размер или цвет. Бот спрашивает, что вводить, на каждом шаге.",
        },
        {
          name: "Указать доставку и оплату",
          text: "В настройках магазина указываете, в какие районы доставляете, сколько это стоит и как принимаете оплату. Клиент видит это до оформления заказа.",
        },
        {
          name: "Раздать ссылку",
          text: "Ставите ссылку на магазин в профиль Instagram, в свой Telegram-канал и в сторис. Заказы приходят вам сообщением от бота.",
        },
      ],
    },
    sections: [
      {
        heading: "Почему именно Telegram",
        body: [
          "В Узбекистане продажи в основном идут через Telegram и Instagram-директ — клиент уже находится в этом приложении. Магазин, который не требует установки отдельного приложения, не теряет конверсию: покупатель нажимает ссылку и сразу видит каталог.",
          "Отличие Telegram-магазина от классического интернет-магазина в том, что доверие уже есть: клиент переписывался с вами в этом же приложении. При этом корзина, статусы заказов и аналитика оказываются в системе, а не в переписке.",
        ],
      },
      {
        heading: "Что понадобится",
        bullets: [
          "Смартфон с аккаунтом Telegram — компьютер не нужен",
          "Фотографии товаров (снимков с телефона достаточно)",
          "Цены и условия доставки",
          "Название магазина — из него получится адрес сайта",
        ],
      },
      {
        heading: "Что происходит после открытия",
        body: [
          "Магазин начинает работать в трёх местах одновременно, и все три берут данные из одного каталога — меняете товар в одном месте, меняется везде.",
        ],
        bullets: [
          "Telegram-бот — управление товарами и заказами с телефона",
          "Сайт-витрина — по адресу shop.maxsavdo.uz/ваш-магазин, его индексируют Google и Яндекс",
          "Посты в канал — при добавлении товара пост выходит автоматически",
        ],
      },
      {
        heading: "Типичные ошибки",
        table: {
          head: ["Ошибка", "Что происходит", "Как исправить"],
          rows: [
            [
              "Товар без фото",
              "Покупатель не понимает, что продаётся, и уходит",
              "Минимум одно чёткое фото на каждый товар",
            ],
            [
              "Не указана цена",
              "Поток сообщений «сколько стоит?» возвращается",
              "Показывать цену в каждой карточке — в этом весь смысл магазина",
            ],
            [
              "Описание на одном языке",
              "Магазин не находится по запросам на другом языке",
              "Писать название и описание на русском и узбекском",
            ],
            [
              "Не описаны условия доставки",
              "После заказа растёт число споров и отмен",
              "Указать район, срок и стоимость в настройках магазина",
            ],
          ],
        },
      },
    ],
    faq: [
      {
        q: "Нужен ли разработчик, чтобы открыть магазин в Telegram?",
        a: "Нет. Магазин настраивается внутри @maxsavdo_bot: вы вводите название, товары, цены и условия доставки, а сайт-витрина создаётся автоматически. Писать код, покупать домен или настраивать хостинг не требуется.",
      },
      {
        q: "Сколько времени занимает открытие магазина?",
        a: "Если фото и цены готовы, первая версия запускается за 5-10 минут. Основное время уходит на размер каталога: добавление одного товара занимает примерно минуту.",
      },
      {
        q: "Придёт ли SMS-код для входа?",
        a: "Нет. Вход подтверждается только через аккаунт Telegram — ни SMS-кода, ни пароля. Это полностью убирает проблемы с ожиданием SMS и кодами, которые не приходят.",
      },
      {
        q: "Можно ли открыть несколько магазинов на одном аккаунте?",
        a: "Пока нет — один продавец, один магазин. Это осознанное ограничение на этапе MVP. Работа с несколькими магазинами запланирована, но сейчас недоступна.",
      },
    ],
  },
  {
    key: "pricing",
    slug: "skolko-stoit-magazin-v-telegram",
    title: "Сколько стоит магазин в Telegram: подписка против комиссии",
    h1: "Сколько стоит магазин в Telegram",
    description:
      "Стоимость магазина в Telegram: сравнение фиксированной подписки и комиссии маркетплейса. При каком обороте подписка выгоднее — расчёт и таблицы.",
    answer:
      "Магазин в Telegram на MaxSavdo работает по фиксированной месячной подписке: тариф Free — 0 сум, Pro — 149 000 сум/мес, Studio — 399 000 сум/мес. Комиссия с продаж не берётся, поэтому при росте оборота платёж не меняется. Маркетплейс обычно забирает долю с каждой продажи, и с ростом оборота разница увеличивается.",
    updated: "2026-07-30",
    sections: [
      {
        heading: "Тарифы",
        table: {
          head: ["Тариф", "Цена", "Кому", "Основное ограничение"],
          rows: [
            ["Free", "0 сум", "Попробовать", "50 товаров и 50 заказов в месяц"],
            [
              "Pro",
              "149 000 сум/мес",
              "Активные продавцы",
              "Без лимита товаров и заказов",
            ],
            [
              "Studio",
              "399 000 сум/мес",
              "Крупные магазины",
              "Всё из Pro + API-доступ",
            ],
          ],
        },
      },
      {
        heading: "Подписка или комиссия — что дешевле",
        body: [
          "Чтобы увидеть разницу, посмотрим на расчёт. Маркетплейс забирает примерно 15% с каждой продажи. Подписка от оборота не зависит.",
        ],
        table: {
          head: ["Оборот в месяц", "Комиссия 15%", "Подписка Pro", "Разница"],
          rows: [
            ["1 000 000 сум", "150 000 сум", "149 000 сум", "почти одинаково"],
            ["3 000 000 сум", "450 000 сум", "149 000 сум", "подписка дешевле на 301 000 сум"],
            ["10 000 000 сум", "1 500 000 сум", "149 000 сум", "подписка дешевле на 1 351 000 сум"],
          ],
        },
      },
      {
        heading: "Вывод",
        bullets: [
          "Оборот ниже ~1 млн сум в месяц — логично начать с Free",
          "Оборот выше 1 млн сум — подписка дешевле комиссии, и разрыв быстро растёт",
          "Чем больше оборот, тем выгоднее модель без комиссии",
        ],
      },
      {
        heading: "Есть ли скрытые платежи",
        body: [
          "Нет. Цена подписки — это полная цена: нет доли с продажи, нет дополнительного процента за транзакцию и нет платы за размещение товара. Тариф Free не ограничен по времени, то есть пробный период не заканчивается.",
          "Единственное серьёзное ограничение на Free — 50 заказов в месяц. При превышении магазин временно скрывается, поэтому с ростом продаж придётся перейти на Pro.",
        ],
      },
    ],
    faq: [
      {
        q: "Берётся ли комиссия с продаж?",
        a: "Нет. Доля с каждой продажи не удерживается — только фиксированная месячная подписка. Продали вы за месяц на 1 миллион или на 50 миллионов сум, платёж за подписку остаётся тем же.",
      },
      {
        q: "Сколько можно работать на тарифе Free?",
        a: "Без ограничения по времени. Free — это не пробный период, а постоянный тариф: до 50 товаров, до 50 заказов в месяц, Telegram-бот и сайт с брендом MaxSavdo. При превышении лимита заказов магазин временно скрывается.",
      },
      {
        q: "Можно ли поменять тариф позже?",
        a: "Да. Можно перейти с Free на Pro или Studio и вернуться обратно. Магазин, товары и история заказов сохраняются — меняются только ограничения тарифа.",
      },
      {
        q: "Цены зафиксированы в сумах?",
        a: "Да, тарифы в сумах: Pro — 149 000 сум/мес, Studio — 399 000 сум/мес. Платежей, привязанных к курсу валюты, нет, поэтому месячные расходы известны заранее.",
      },
    ],
  },
  {
    key: "instagram-migration",
    slug: "perenesti-magazin-iz-instagram-v-telegram",
    title: "Как перенести магазин из Instagram в Telegram — практика",
    h1: "Как перенести магазин из Instagram в Telegram",
    description:
      "Как перенести продажи из Instagram-директа в Telegram-магазин: с чего начать, как перевести аудиторию и что нельзя потерять при переносе.",
    answer:
      "Чтобы перенести магазин из Instagram, сначала соберите каталог в @maxsavdo_bot, затем поставьте ссылку на магазин в профиль Instagram и в сторис. Instagram остаётся витриной и каналом трафика, а заказы и оформление переходят в Telegram. Аудиторию вы не бросаете — переводите её по обычной ссылке.",
    updated: "2026-07-30",
    sections: [
      {
        heading: "Зачем переносить",
        bullets: [
          "В директе заказы тонут в переписке — путаются адрес и сумма",
          "На вопрос «сколько стоит?» приходится отвечать вручную каждый день",
          "Нет корзины и оформления — клиент считает сумму сам",
          "Нет статистики по тому, что продаётся",
        ],
      },
      {
        heading: "Порядок переноса",
        body: [
          "Аккаунт Instagram удалять не нужно — он остаётся источником трафика. Задача в том, чтобы вывести поток заказов из переписки в систему.",
        ],
        bullets: [
          "Добавляете в бота 10-20 самых продаваемых товаров — весь каталог сразу переносить не обязательно",
          "Ставите ссылку на магазин в поле «сайт» в профиле Instagram",
          "Несколько дней напоминаете о магазине в сторис со стикером-ссылкой",
          "Тем, кто пишет в директ про цену, отправляете ссылку вместо ответа текстом",
          "Через одну-две недели работы переносите остальной каталог",
        ],
      },
      {
        heading: "Что меняется",
        table: {
          head: ["", "Instagram-директ", "Telegram-магазин"],
          rows: [
            ["Каталог", "Разбросан по постам и сторис", "Один каталог с поиском"],
            ["Цена", "Пишется вручную каждый раз", "Видна в карточке"],
            ["Заказ", "Согласуется в переписке", "Корзина и оформление"],
            ["Статистика", "Нет", "Продажи и топ-товары"],
            ["Находимость в поиске", "Не находится", "Индексируется Google и Яндекс"],
          ],
        },
      },
      {
        heading: "Что нельзя потерять",
        body: [
          "Самая частая ошибка при переносе — бросить Instagram. Там собрана аудитория, поэтому контент должен продолжать выходить; измениться должно только то, где оформляется заказ.",
          "Вторая ошибка — писать описания товаров только на одном языке. Сайт-витрина попадает в поисковые системы, поэтому название и описание на русском и узбекском делают магазин находимым.",
        ],
      },
    ],
    faq: [
      {
        q: "Нужно ли удалять аккаунт в Instagram?",
        a: "Нет, и это не рекомендуется. Instagram остаётся источником трафика и витриной — там собрана ваша аудитория. Меняется только место приёма заказов: вместо переписки в директе — корзина и оформление.",
      },
      {
        q: "Перейдут ли клиенты в Telegram?",
        a: "В Узбекистане Telegram уже самый используемый мессенджер, поэтому устанавливать отдельное приложение не требуется. Клиент нажимает ссылку и сразу видит каталог — регистрация тоже не нужна.",
      },
      {
        q: "Нужно ли переносить весь каталог сразу?",
        a: "Нет. Достаточно начать с 10-20 самых продаваемых товаров — этого хватает, чтобы магазин заработал. Остальные товары удобнее добавлять потом, уже в процессе работы.",
      },
    ],
  },
  {
    key: "inventory",
    slug: "uchet-sklada-v-telegram-magazine",
    title: "Как ведётся учёт склада в Telegram-магазине",
    h1: "Учёт склада в Telegram-магазине",
    description:
      "Как в MaxSavdo считается остаток товара: количество автоматически уменьшается при заказе и возвращается при отмене. Когда нужна отдельная складская программа — здесь.",
    answer:
      "В MaxSavdo для каждого товара указывается количество на складе. Когда покупатель делает заказ, это количество автоматически уменьшается; при отмене заказа товар возвращается на склад. Когда остаток доходит до нуля, товар помечается «Нет в наличии» и его нельзя купить. Это базовый складской учёт, привязанный к продажам одного магазина; учёт по нескольким филиалам или партиям требует отдельной программы.",
    updated: "2026-08-04",
    sections: [
      {
        heading: "Как работает учёт склада",
        bullets: [
          "При добавлении товара вы указываете количество на складе — например, 30 штук",
          "Когда покупатель оформляет заказ, проданное количество автоматически вычитается",
          "При отмене или отклонении заказа количество возвращается на склад",
          "Когда остаток небольшой, в карточке видно «Осталось: N шт»",
          "Когда остаток доходит до нуля, товар помечается «Нет в наличии» и его нельзя купить",
        ],
      },
      {
        heading: "Почему это важно",
        body: [
          "Продать больше, чем реально есть на складе — самая частая проблема у тех, кто ведёт учёт в Instagram-директе или в бумажной тетради: клиенту пишут «есть», а потом оказывается, что товара нет. Заказ и склад находятся в одной системе, поэтому количество не нужно отслеживать вручную — оно обновляется автоматически.",
        ],
      },
      {
        heading: "Когда достаточно, а когда нет",
        table: {
          head: ["Ситуация", "Хватает ли MaxSavdo"],
          rows: [
            ["Один магазин, один общий остаток", "Да — количество считается автоматически по продажам"],
            ["Распределение между несколькими филиалами/складами", "Нет — пока один общий остаток на магазин"],
            ["Учёт по партиям, сериям или сроку годности", "Нет — только общее количество, без уровня партий"],
            ["Единый учёт с кассой в физическом магазине", "Нет — MaxSavdo считает остаток только по онлайн-заказам"],
          ],
        },
      },
      {
        heading: "Типичные ошибки",
        table: {
          head: ["Ошибка", "Что происходит", "Как исправить"],
          rows: [
            [
              "Не указано количество на складе",
              "Система всегда показывает «в наличии», продаётся и то, чего уже нет",
              "Указывать точное количество для каждого товара",
            ],
            [
              "Обновлять количество только в конце месяца",
              "Число в карточке расходится с реальным остатком",
              "Обновлять количество сразу при поступлении новой партии",
            ],
            [
              "Не учитывать отменённые заказы",
              "Товар, который на самом деле есть, может выглядеть «закончившимся»",
              "Периодически сверять текущий остаток с историей заказов",
            ],
          ],
        },
      },
    ],
    faq: [
      {
        q: "MaxSavdo — это полноценная складская программа (WMS)?",
        a: "Нет. MaxSavdo ведёт один общий остаток по каждому товару, привязанный к продажам: уменьшается при заказе, возвращается при отмене. Функций полноценной WMS — несколько складов, партии, серии — нет.",
      },
      {
        q: "Когда остаток обновляется автоматически?",
        a: "В двух случаях: когда покупатель оформляет заказ (уменьшается) и когда заказ отменяют или отклоняют (возвращается). Во всех остальных случаях количество вводит и меняет продавец вручную.",
      },
      {
        q: "Видит ли покупатель товар, если он закончился?",
        a: "Да, но купить не может — в карточке появляется отметка «Нет в наличии». Это не даёт принять лишний заказ на закончившийся товар.",
      },
    ],
  },
  {
    key: "checkout",
    slug: "onlayn-kassa-v-telegram-magazine",
    title: "Как работает онлайн-касса в Telegram-магазине",
    h1: "Онлайн-касса в Telegram-магазине",
    description:
      "Как корзина и оформление заказа в MaxSavdo обрабатывают онлайн-заказы — и почему это не заменяет фискальный кассовый аппарат, требуемый законом.",
    answer:
      "«Касса» в MaxSavdo — это корзина и оформление заказа: покупатель выбирает товар, указывает адрес доставки и выбирает способ оплаты — наличными или переводом на карту, а заказ автоматически приходит продавцу через @maxsavdo_bot. Это оформляет онлайн-заказы, но не заменяет фискальный кассовый аппарат, который в Узбекистане может требоваться законом при продаже за наличные — это отдельный вопрос.",
    updated: "2026-08-04",
    sections: [
      {
        heading: "Как работает оформление заказа",
        bullets: [
          "Покупатель добавляет товар в корзину и выбирает количество",
          "Указывает район и адрес доставки",
          "Выбирает способ оплаты — наличными при доставке или переводом на карту",
          "После подтверждения заказа продавцу автоматически приходит уведомление через @maxsavdo_bot",
          "Продавец обновляет статус заказа (принят, доставляется, выполнен) в системе",
        ],
      },
      {
        heading: "Способы оплаты",
        table: {
          head: ["Способ оплаты", "Как это работает"],
          rows: [
            ["Наличные (при доставке)", "Покупатель платит курьеру или при самовывозе"],
            [
              "Перевод на карту",
              "Продавец включает свои реквизиты в настройках, покупатель переводит на этот номер",
            ],
          ],
        },
      },
      {
        heading: "Это фискальный кассовый аппарат?",
        body: [
          "Нет. Законодательство Узбекистана может требовать при продаже за наличные или карту зарегистрированный фискальный кассовый аппарат или модуль онлайн-кассы — это отдельное, официально сертифицированное оборудование или программа. Оформление заказа в MaxSavdo обрабатывает заказ онлайн, но не печатает фискальный чек и не отчитывается перед налоговой. Если фискальные требования применимы к вам, это нужно решать отдельно.",
        ],
      },
    ],
    faq: [
      {
        q: "Заменяет ли MaxSavdo кассовый аппарат?",
        a: "Нет. MaxSavdo — это система приёма онлайн-заказов и оплаты для Telegram-магазина (корзина, оформление заказа). Она не связана с фискальным кассовым аппаратом или модулем онлайн-кассы, требуемым законом, и не заменяет его.",
      },
      {
        q: "Как можно принимать оплату?",
        a: "Есть два основных способа: наличными при доставке или переводом на карту продавца. Номер карты виден покупателю только если продавец включил его в настройках магазина.",
      },
      {
        q: "Как продавец узнаёт о новом заказе?",
        a: "Как только покупатель завершает оформление заказа, продавцу автоматически приходит уведомление через @maxsavdo_bot — с товаром, количеством, адресом и способом оплаты. Не нужно вручную проверять переписку.",
      },
    ],
  },
];

export const guides: Record<Locale, Guide[]> = {
  uz: uzGuides,
  ru: ruGuides,
};

/** Route segment for the guides index, per locale. */
export const GUIDES_SEGMENT: Record<Locale, string> = {
  uz: "qollanma",
  ru: "rukovodstva",
};

/** `/qollanma` · `/ru/rukovodstva` — the index path for a locale. */
export function guidesIndexPath(locale: Locale): string {
  return locale === "uz"
    ? `/${GUIDES_SEGMENT.uz}`
    : `/ru/${GUIDES_SEGMENT.ru}`;
}

/** Path of one guide, in that locale's own slug. */
export function guidePath(locale: Locale, slug: string): string {
  return `${guidesIndexPath(locale)}/${slug}`;
}

export function getGuide(locale: Locale, slug: string): Guide | undefined {
  return guides[locale].find((g) => g.slug === slug);
}

/**
 * hreflang pairing. The two locales use different slugs for the same guide, so the
 * alternates have to be resolved through `key` — matching on slug would silently
 * emit a self-referencing pair and tell Google the ru page has no uz twin.
 */
export function guideAlternates(key: GuideKey): Record<string, string> {
  const uz = guides.uz.find((g) => g.key === key);
  const ru = guides.ru.find((g) => g.key === key);
  if (!uz || !ru) {
    throw new Error(`guideAlternates: guide "${key}" is missing a locale twin`);
  }
  const uzPath = guidePath("uz", uz.slug);
  return {
    uz: uzPath,
    ru: guidePath("ru", ru.slug),
    "x-default": uzPath,
  };
}
