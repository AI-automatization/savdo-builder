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

  // ── BOT-I18N-FULL-001: остальные флоу ──────────────────────────────────
  'help.text': '📖 <b>Помощь — maxsavdo</b>\n\n<b>Команды:</b>\n/start — Главное меню\n/menu — Главное меню\n/orders — Мои заказы\n/store — Мой магазин (для продавцов)\n/help — Это сообщение\n\n<b>Как найти магазин?</b>\n1. Нажмите «📱 Открыть приложение»\n2. Или нажмите «🏪 Найти магазин» и введите адрес\n\n<b>Как стать продавцом?</b>\nНапишите /start → поделитесь номером → выберите «🏪 Я продавец»\n\n<b>Вопросы и поддержка:</b>\n{support}{appLink}',
  'help.appLink': '\n\n📱 <a href="{url}">Открыть приложение</a>',
  'help.supportFallback': 'Обратитесь к администратору',

  'reg.alreadySeller': '✅ Вы уже зарегистрированы как продавец.',
  'reg.errorMaybeDuplicate': '❌ Ошибка регистрации. Возможно, этот номер уже зарегистрирован.',

  'channel.noStoreYet': '🏪 У вас ещё нет магазина. Создадим его прямо сейчас!\n\nВведите <b>название вашего магазина</b>:',
  'channel.linkIntro': '📢 <b>Привязка Telegram-канала</b>\n\n1. Добавьте бота как <b>администратора</b> в ваш канал\n2. Отправьте сюда <b>username канала</b>, например:\n\n<code>@mystore_channel</code>',
  'channel.botNotAdmin': '❌ Бот не является администратором канала <code>{channel}</code>.\n\nДобавьте бота как администратора и попробуйте снова:',
  'btn.tryAgain': '🔄 Попробовать снова',
  'channel.needStoreFirst': '⚠️ Сначала нужно создать магазин.',
  'btn.createStore': '🏪 Создать магазин',
  'channel.linked': '✅ Канал <b>{channel}</b> привязан!\n\nАвтопостинг включён — при публикации товара бот сам отправит его в канал с фото и кнопкой заказа.\n\n⚙️ Настроить шаблон поста можно в TMA → Настройки → Канал.',
  'store.createdLinkChannel': '✅ Магазин <b>{name}</b> создан!\n\n📢 <b>Теперь привяжем Telegram-канал</b>\n\n1. Добавьте бота как <b>администратора</b> в ваш канал\n2. Отправьте сюда <b>username канала</b>, например:\n\n<code>@mystore_channel</code>',
  'store.createFailed': '❌ Не удалось создать магазин. Попробуйте ещё раз: /start',

  'products.title': '📦 <b>Мои товары — {store}</b>\n\nВсего товаров: <b>{count}</b>\n\n<i>Управляйте товарами, добавляйте новые и публикуйте их прямо в приложении. При публикации товар автоматически появится в вашем Telegram-канале.</i>',
  'products.noStore': '📦 <b>Товары</b>\n\n<i>Создайте магазин чтобы добавлять товары.</i>',
  'btn.openInApp': '📦 Открыть в приложении',

  'logout.done': '✅ Вы вышли из аккаунта.\n\nДля повторного входа нажмите /start',
  'btn.loginAgain': '🔄 Войти снова',

  'orders.none': '📭 Заказов пока нет.',
  'orders.sellerHeader': '<b>📋 Заказы ({count}):</b>',
  'orders.buyerHeader': '<b>📦 Мои заказы:</b>',
  'orders.buyerNoneYet': '📭 У вас ещё нет заказов.',
  'orders.buyerNoneYetWithLink': '📭 У вас ещё нет заказов. Оформите первый: {url}',

  'stats.text': '📊 <b>Статистика «{store}»</b>\n\n📦 Товаров: <b>{products}</b>\n🛒 Всего заказов: <b>{orders}</b>',

  'switch.needStore': '🏪 У вас ещё нет магазина. Создайте магазин, чтобы войти в режим продавца.',
  'btn.becomeSeller': '🏪 Стать продавцом',

  'find.prompt': '🔍 Введите адрес магазина:\n\nНапример: <code>my-store</code>',
  'find.notFound': '❌ Магазин <code>{slug}</code> не найден.',
  'btn.searchAgain': '🔍 Искать снова',
  'find.noProducts': '📭 Товаров пока нет',
  'find.productsHeader': '<b>Товары:</b>',
  'btn.openStore': '🛒 Открыть магазин',

  'deeplink.openStore': '🏪 <b>Открыть магазин в приложении maxsavdo</b>',
  'deeplink.storeLink': '🔗 Открыть магазин:',
  'btn.open': '🛒 Открыть',

  'order.status.PENDING': '🟡 Ожидает',
  'order.status.CONFIRMED': '🔵 Подтверждён',
  'order.status.SHIPPED': '🚚 В пути',
  'order.status.DELIVERED': '✅ Доставлен',
  'order.status.CANCELLED': '❌ Отменён',

  'channelPost.price': '💰 Цена: <b>{price}</b>',
  'channelPost.store': '🏪 Магазин: {store}',
  'channelPost.more': '👆 Подробнее:',
  'btn.writeSeller': '💬 Написать продавцу',
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

  // ── BOT-I18N-FULL-001: остальные флоу ──────────────────────────────────
  'help.text': '📖 <b>Yordam — maxsavdo</b>\n\n<b>Buyruqlar:</b>\n/start — Bosh menyu\n/menu — Bosh menyu\n/orders — Buyurtmalarim\n/store — Doʻkonim (sotuvchilar uchun)\n/help — Ushbu xabar\n\n<b>Doʻkonni qanday topish mumkin?</b>\n1. «📱 Ilovani ochish» tugmasini bosing\n2. Yoki «🏪 Doʻkon topish» tugmasini bosib, manzilni kiriting\n\n<b>Qanday sotuvchi boʻlish mumkin?</b>\n/start yozing → raqamingizni ulashing → «🏪 Men sotuvchiman»ni tanlang\n\n<b>Savollar va yordam:</b>\n{support}{appLink}',
  'help.appLink': '\n\n📱 <a href="{url}">Ilovani ochish</a>',
  'help.supportFallback': 'Administratorga murojaat qiling',

  'reg.alreadySeller': '✅ Siz allaqachon sotuvchi sifatida roʻyxatdan oʻtgansiz.',
  'reg.errorMaybeDuplicate': '❌ Roʻyxatdan oʻtishda xatolik. Bu raqam allaqachon roʻyxatdan oʻtgan boʻlishi mumkin.',

  'channel.noStoreYet': '🏪 Sizda hali doʻkon yoʻq. Hoziroq yaratamiz!\n\n<b>Doʻkoningiz nomini</b> kiriting:',
  'channel.linkIntro': '📢 <b>Telegram-kanalni ulash</b>\n\n1. Botni kanalingizga <b>administrator</b> sifatida qoʻshing\n2. Bu yerga <b>kanal username</b>ini yuboring, masalan:\n\n<code>@mystore_channel</code>',
  'channel.botNotAdmin': '❌ Bot <code>{channel}</code> kanalining administratori emas.\n\nBotni administrator sifatida qoʻshib, qayta urinib koʻring:',
  'btn.tryAgain': '🔄 Qayta urinish',
  'channel.needStoreFirst': '⚠️ Avval doʻkon yaratish kerak.',
  'btn.createStore': '🏪 Doʻkon yaratish',
  'channel.linked': '✅ <b>{channel}</b> kanali ulandi!\n\nAvtomatik joylash yoqildi — mahsulot eʼlon qilinganda bot uni rasm va buyurtma tugmasi bilan kanalga oʻzi yuboradi.\n\n⚙️ Post shablonini TMA → Sozlamalar → Kanal boʻlimida sozlash mumkin.',
  'store.createdLinkChannel': '✅ <b>{name}</b> doʻkoni yaratildi!\n\n📢 <b>Endi Telegram-kanalni ulaymiz</b>\n\n1. Botni kanalingizga <b>administrator</b> sifatida qoʻshing\n2. Bu yerga <b>kanal username</b>ini yuboring, masalan:\n\n<code>@mystore_channel</code>',
  'store.createFailed': '❌ Doʻkon yaratilmadi. Qayta urinib koʻring: /start',

  'products.title': '📦 <b>Mahsulotlarim — {store}</b>\n\nJami mahsulotlar: <b>{count}</b>\n\n<i>Mahsulotlarni ilovada boshqaring, yangilarini qoʻshing va eʼlon qiling. Eʼlon qilinganda mahsulot Telegram-kanalingizda avtomatik paydo boʻladi.</i>',
  'products.noStore': '📦 <b>Mahsulotlar</b>\n\n<i>Mahsulot qoʻshish uchun doʻkon yarating.</i>',
  'btn.openInApp': '📦 Ilovada ochish',

  'logout.done': '✅ Siz akkauntdan chiqdingiz.\n\nQayta kirish uchun /start bosing',
  'btn.loginAgain': '🔄 Qayta kirish',

  'orders.none': '📭 Hozircha buyurtmalar yoʻq.',
  'orders.sellerHeader': '<b>📋 Buyurtmalar ({count}):</b>',
  'orders.buyerHeader': '<b>📦 Buyurtmalarim:</b>',
  'orders.buyerNoneYet': '📭 Sizda hali buyurtmalar yoʻq.',
  'orders.buyerNoneYetWithLink': '📭 Sizda hali buyurtmalar yoʻq. Birinchisini rasmiylashtiring: {url}',

  'stats.text': '📊 <b>«{store}» statistikasi</b>\n\n📦 Mahsulotlar: <b>{products}</b>\n🛒 Jami buyurtmalar: <b>{orders}</b>',

  'switch.needStore': '🏪 Sizda hali doʻkon yoʻq. Sotuvchi rejimiga oʻtish uchun doʻkon yarating.',
  'btn.becomeSeller': '🏪 Sotuvchi boʻlish',

  'find.prompt': '🔍 Doʻkon manzilini kiriting:\n\nMasalan: <code>my-store</code>',
  'find.notFound': '❌ <code>{slug}</code> doʻkoni topilmadi.',
  'btn.searchAgain': '🔍 Qayta qidirish',
  'find.noProducts': '📭 Hozircha mahsulotlar yoʻq',
  'find.productsHeader': '<b>Mahsulotlar:</b>',
  'btn.openStore': '🛒 Doʻkonni ochish',

  'deeplink.openStore': '🏪 <b>maxsavdo ilovasida doʻkonni ochish</b>',
  'deeplink.storeLink': '🔗 Doʻkonni ochish:',
  'btn.open': '🛒 Ochish',

  'order.status.PENDING': '🟡 Kutilmoqda',
  'order.status.CONFIRMED': '🔵 Tasdiqlandi',
  'order.status.SHIPPED': '🚚 Yoʻlda',
  'order.status.DELIVERED': '✅ Yetkazildi',
  'order.status.CANCELLED': '❌ Bekor qilindi',

  'channelPost.price': '💰 Narxi: <b>{price}</b>',
  'channelPost.store': '🏪 Doʻkon: {store}',
  'channelPost.more': '👆 Batafsil:',
  'btn.writeSeller': '💬 Sotuvchiga yozish',
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
