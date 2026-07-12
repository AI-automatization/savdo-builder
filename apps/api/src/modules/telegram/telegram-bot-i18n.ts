/**
 * BOT-ONBOARDING-I18N-001 — ru/uz словарь для onboarding-флоу бота.
 *
 * Скоуп: язык-чузер, приветствие, шаринг контакта, выбор роли, регистрация
 * продавца, «магазин создан», меню продавца/покупателя, смена названия
 * магазина. Остальные тексты бота (списки заказов и т.д.) пока RU-only —
 * см. tasks.md BOT-I18N-FULL-001.
 *
 * Узбекский: Latin, для `oʻ`/`gʻ` — ОБРАТНЫЙ апостроф U+02BB `ʻ`, НЕ U+0027
 * (правило MARKETING-LOCALIZATION-UZ-001, см. apps/tma/src/lib/i18n/uz.ts).
 *
 * Плейсхолдеры — `{name}`, `{url}` и т.п., подстановка через `t()`.
 * Значения могут содержать Telegram-HTML (<b>, <code>) — caller шлёт parseMode HTML,
 * динамические значения подставлять УЖЕ прогнанными через escapeTgHtml.
 */

export type BotLang = 'ru' | 'uz';

const ru = {
  chooseLanguage: '🌐 Выберите язык / Tilni tanlang:',
  'btn.lang.ru': '🇷🇺 Русский',
  'btn.lang.uz': '🇺🇿 Oʻzbekcha',

  'greeting.new': '👋 Привет{name}!\n\nДобро пожаловать в <b>maxsavdo</b> — маркетплейс продавцов Узбекистана.\n\nДля входа поделитесь номером телефона:',
  'greeting.ghost': '👋 Привет{name}!\n\nВы уже вошли через наше приложение. Для полноценной работы с ботом поделитесь номером телефона:',
  'contact.received': '✅ Номер получен! Определяем ваш аккаунт...',

  'role.question': 'Как вы хотите зарегистрироваться?',
  'btn.role.buyer': '🛍 Я покупатель',
  'btn.role.seller': '🏪 Я продавец',

  'reg.step1': '🏪 Регистрация продавца\n\nШаг 1/3 — Введите ваше <b>полное имя</b>:',
  'reg.step2': '✅ Отлично!\n\nШаг 2/3 — Введите <b>название магазина</b>:',
  'reg.step3': '✅ Название сохранено!\n\nШаг 3/3 — Введите <b>описание магазина</b> (или пропустите):',
  'btn.skip': '⏭ Пропустить',
  'reg.error': '❌ Ошибка регистрации. Напишите /start и попробуйте снова.',

  'store.created': '🎉 <b>Магазин создан!</b>\n\n🏪 {name}\n🔗 {url}\n\nТеперь настройте Telegram-канал для автопостинга товаров:',
  'btn.linkChannel': '📢 Привязать TG канал',
  'btn.skipChannel': '⏭ Пропустить',
  'btn.renameStore': '✏️ Изменить название',

  'rename.ask': '✏️ Введите <b>новое название магазина</b>:',
  'rename.done': '✅ Название обновлено: <b>{name}</b>\n\n🔗 Ссылка магазина не изменилась: {url}',
  'rename.noStore': '⚠️ Магазин не найден.',

  'menu.seller.title': '👋 <b>{name}</b>, панель управления:\n\n💡 <i>Для удобного управления товарами используйте приложение</i>',
  'btn.openApp': '📱 Открыть приложение',
  'btn.sellerOrders': '📋 Заказы',
  'btn.sellerProducts': '📦 Товары',
  'btn.sellerStore': '🔗 Магазин',
  'btn.sellerStats': '📊 Статистика',
  'btn.menuLinkChannel': '📢 Привязать Telegram-канал',
  'btn.buyerMode': '🛒 Режим покупателя',
  'btn.language': '🌐 Til / Язык',

  'menu.buyer.greeting': '👋 Привет, <b>{name}</b>!',
  'btn.findStore': '🏪 Найти магазин',
  'btn.myOrders': '📦 Мои заказы',
  'btn.sellerMode': '🏪 Режим продавца',

  'buyer.askName': '✅ Номер подтверждён!\n\nКак вас зовут? Введите <b>имя и фамилию</b> (например: Алишер Иванов)\nили только имя:',

  'store.info': '🏪 <b>{name}</b>\n🔗 {url}\n📌 Статус: {status}{channel}',
  'store.channelLinked': '\n📢 Канал: {channel}',
  'store.channelNotLinked': '\n📢 Канал: не привязан',
};

const uz: Record<BotKey, string> = {
  chooseLanguage: '🌐 Tilni tanlang / Выберите язык:',
  'btn.lang.ru': '🇷🇺 Русский',
  'btn.lang.uz': '🇺🇿 Oʻzbekcha',

  'greeting.new': '👋 Salom{name}!\n\n<b>maxsavdo</b>ga xush kelibsiz — Oʻzbekiston sotuvchilari uchun marketpleys.\n\nKirish uchun telefon raqamingizni ulashing:',
  'greeting.ghost': '👋 Salom{name}!\n\nSiz ilovamiz orqali allaqachon kirgansiz. Bot bilan toʻliq ishlash uchun telefon raqamingizni ulashing:',
  'contact.received': '✅ Raqam qabul qilindi! Akkauntingizni aniqlayapmiz...',

  'role.question': 'Qanday roʻyxatdan oʻtmoqchisiz?',
  'btn.role.buyer': '🛍 Men xaridorman',
  'btn.role.seller': '🏪 Men sotuvchiman',

  'reg.step1': '🏪 Sotuvchi roʻyxatdan oʻtishi\n\n1/3-qadam — <b>Toʻliq ismingizni</b> kiriting:',
  'reg.step2': '✅ Ajoyib!\n\n2/3-qadam — <b>Doʻkon nomini</b> kiriting:',
  'reg.step3': '✅ Nom saqlandi!\n\n3/3-qadam — <b>Doʻkon tavsifini</b> kiriting (yoki oʻtkazib yuboring):',
  'btn.skip': '⏭ Oʻtkazib yuborish',
  'reg.error': '❌ Roʻyxatdan oʻtishda xatolik. /start yozib qayta urinib koʻring.',

  'store.created': '🎉 <b>Doʻkon yaratildi!</b>\n\n🏪 {name}\n🔗 {url}\n\nEndi mahsulotlarni avtomatik joylash uchun Telegram-kanalni sozlang:',
  'btn.linkChannel': '📢 TG kanalni ulash',
  'btn.skipChannel': '⏭ Oʻtkazib yuborish',
  'btn.renameStore': '✏️ Nomini oʻzgartirish',

  'rename.ask': '✏️ <b>Doʻkonning yangi nomini</b> kiriting:',
  'rename.done': '✅ Nom yangilandi: <b>{name}</b>\n\n🔗 Doʻkon havolasi oʻzgarmadi: {url}',
  'rename.noStore': '⚠️ Doʻkon topilmadi.',

  'menu.seller.title': '👋 <b>{name}</b>, boshqaruv paneli:\n\n💡 <i>Mahsulotlarni qulay boshqarish uchun ilovadan foydalaning</i>',
  'btn.openApp': '📱 Ilovani ochish',
  'btn.sellerOrders': '📋 Buyurtmalar',
  'btn.sellerProducts': '📦 Mahsulotlar',
  'btn.sellerStore': '🔗 Doʻkon',
  'btn.sellerStats': '📊 Statistika',
  'btn.menuLinkChannel': '📢 Telegram-kanalni ulash',
  'btn.buyerMode': '🛒 Xaridor rejimi',
  'btn.language': '🌐 Til / Язык',

  'menu.buyer.greeting': '👋 Salom, <b>{name}</b>!',
  'btn.findStore': '🏪 Doʻkon topish',
  'btn.myOrders': '📦 Buyurtmalarim',
  'btn.sellerMode': '🏪 Sotuvchi rejimi',

  'buyer.askName': '✅ Raqam tasdiqlandi!\n\nIsmingiz nima? <b>Ism va familiyangizni</b> kiriting (masalan: Alisher Ivanov)\nyoki faqat ismingizni:',

  'store.info': '🏪 <b>{name}</b>\n🔗 {url}\n📌 Holat: {status}{channel}',
  'store.channelLinked': '\n📢 Kanal: {channel}',
  'store.channelNotLinked': '\n📢 Kanal: ulanmagan',
};

export type BotKey = keyof typeof ru;

const DICT: Record<BotLang, Record<BotKey, string>> = { ru, uz };

/** Подстановка `{param}` → value. Значения params должны быть уже escapeTgHtml-нуты. */
export function t(lang: BotLang, key: BotKey, params?: Record<string, string>): string {
  let text = DICT[lang][key] ?? DICT.ru[key];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.split(`{${k}}`).join(v);
    }
  }
  return text;
}

export function normalizeBotLang(raw?: string | null): BotLang {
  return raw === 'uz' ? 'uz' : 'ru';
}
