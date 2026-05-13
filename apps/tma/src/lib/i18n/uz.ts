import type { Translations } from './types';

// MARKETING-LOCALIZATION-UZ-001 — узбекский (Latin / Lotin) dictionary.
//
// ВНИМАНИЕ: для `oʻ` / `gʻ` используется ОБРАТНЫЙ апостроф (U+02BB `ʻ`),
// НЕ обычный (U+0027 `'`). См. `.claude/skills/uzbek-translator/SKILL.md`.
// Перед коммитом прогрепай файл на `o'` / `g'` — должно быть 0 матчей.
//
// Стиль: вежливый императив `-ing` (Kiring, не Kir). Магазин = `doʻkon`,
// не `magazin`. Скидка = `chegirma`, не `skidka`. Все ключи зеркалят ru.ts.

export const uz: Translations = {
  // ── Common actions ────────────────────────────────────────────────────
  'common.save': 'Saqlash',
  'common.cancel': 'Bekor qilish',
  'common.confirm': 'Tasdiqlash',
  'common.delete': 'Oʻchirish',
  'common.edit': 'Tahrirlash',
  'common.back': 'Orqaga',
  'common.next': 'Davom etish',
  'common.close': 'Yopish',
  'common.search': 'Qidirish',
  'common.loading': 'Yuklanmoqda...',
  'common.error': 'Xatolik',
  'common.retry': 'Yana urinib koʻring',
  'common.somethingWentWrong': 'Nimadir notoʻgʻri ketdi',

  // ── Navigation ────────────────────────────────────────────────────────
  'nav.home': 'Bosh sahifa',
  'nav.stores': 'Doʻkonlar',
  'nav.cart': 'Savat',
  'nav.orders': 'Buyurtmalar',
  'nav.profile': 'Profil',
  'nav.settings': 'Sozlamalar',
  'nav.wishlist': 'Sevimlilar',
  'nav.products': 'Mahsulotlar',
  'nav.chats': 'Suhbatlar',
  'nav.dashboard': 'Bosh sahifa',

  // ── Auth ──────────────────────────────────────────────────────────────
  'auth.login': 'Kirish',
  'auth.logout': 'Akkauntdan chiqish',
  'auth.register': 'Roʻyxatdan oʻtish',
  'auth.welcomeName': 'Salom, {name}!',
  'auth.guest': 'Mehmon',

  // ── Cart ──────────────────────────────────────────────────────────────
  'cart.title': 'Savat',
  'cart.empty': 'Savat boʻsh',
  'cart.addToCart': 'Savatga qoʻshish',
  'cart.clear': 'Savatni tozalash',
  'cart.total': 'Jami',
  'cart.checkout': 'Buyurtma berish',
  'cart.quantity': 'Soni',
  'cart.replaceConfirm': 'Savatni almashtirish?',
  'cart.replaceBody': 'Savatda hozir «{store}» doʻkonidan mahsulotlar bor. «{newStore}» doʻkonidan mahsulot qoʻshish uchun eski savatni tozalash kerak.',
  'cart.added': 'Savatga qoʻshildi',

  // ── Checkout ──────────────────────────────────────────────────────────
  'checkout.title': 'Buyurtmani rasmiylashtirish',
  'checkout.customerInfo': 'Aloqa maʼlumotlari',
  'checkout.fullName': 'Ism familiya',
  'checkout.phone': 'Telefon',
  'checkout.address': 'Manzil',
  'checkout.city': 'Shahar',
  'checkout.deliveryMethod': 'Yetkazib berish usuli',
  'checkout.paymentMethod': 'Toʻlov usuli',
  'checkout.paymentCash': 'Naqd pul',
  'checkout.paymentCard': 'Karta orqali',
  'checkout.submit': 'Buyurtmani tasdiqlash',
  'checkout.authRequired': '⚠️ Avtorizatsiya kerak',
  'checkout.authHint': 'Telegram orqali kiring',

  // ── Orders ────────────────────────────────────────────────────────────
  'orders.title': 'Buyurtmalarim',
  'orders.empty': 'Sizda hali buyurtmalar yoʻq',
  'orders.orderNumber': 'Buyurtma #{number}',
  'orders.status.PENDING': 'Kutilmoqda',
  'orders.status.CONFIRMED': 'Tasdiqlangan',
  'orders.status.PROCESSING': 'Tayyorlanmoqda',
  'orders.status.SHIPPED': 'Yetkazilmoqda',
  'orders.status.DELIVERED': 'Yetkazib berildi',
  'orders.status.CANCELLED': 'Bekor qilindi',

  // ── Stores ────────────────────────────────────────────────────────────
  'stores.title': 'Doʻkonlar',
  'stores.searchPlaceholder': 'Doʻkon qidirish...',
  'stores.empty': 'Doʻkonlar hali yoʻq',
  'stores.notFound': 'Hech narsa topilmadi',
  'stores.verifiedTitle': 'Tasdiqlangan doʻkon',
  'stores.openStore': 'Doʻkonni ochish',

  // ── Products ──────────────────────────────────────────────────────────
  'products.title': 'Mahsulotlar',
  'products.searchPlaceholder': 'Mahsulot qidirish...',
  'products.empty': 'Mahsulotlar hali yoʻq',
  'products.price': 'Narx',
  'products.oldPrice': 'Eski narx',
  'products.discount': 'Chegirma',
  'products.inStock': 'Mavjud',
  'products.outOfStock': 'Mavjud emas',
  'products.sortNew': 'Yangi',
  'products.sortPriceAsc': '↑ Narx',
  'products.sortPriceDesc': '↓ Narx',

  // ── Settings ──────────────────────────────────────────────────────────
  'settings.title': 'Sozlamalar',
  'settings.account': 'Akkaunt',
  'settings.theme': 'Mavzu',
  'settings.themeHint': 'Avto — Telegram bilan sinxronlash. Qoʻlda ham belgilash mumkin.',
  'settings.language': 'Til',
  'settings.languageHint': 'Interfeys tilini tanlang',
  'settings.becomeSeller': 'Oʻz doʻkoningizni oching',
  'settings.becomeSellerHint': 'Savdo platformasida soting: doʻkon yarating, mahsulot qoʻshing va Telegram orqali buyurtma qabul qiling.',
  'settings.becomeSellerCta': '🏪 Sotuvchi boʻlish',
  'settings.app': 'Ilova',
  'settings.tgBot': 'Telegram-bot',
  'settings.role.buyer': 'Xaridor',
  'settings.role.seller': 'Sotuvchi',

  // ── Seller-side common ────────────────────────────────────────────────
  'seller.myStore': 'Doʻkonim',
  'seller.createStore': 'Oʻz doʻkoningizni yarating',
  'seller.createStoreHint': 'Sotishni boshlash uchun nom kiriting',
  'seller.storeName': 'Doʻkon nomi',
  'seller.products': 'Mahsulotlar',
  'seller.orders': 'Buyurtmalar',
  'seller.stats': 'Statistika',

  // ── Wishlist ──────────────────────────────────────────────────────────
  'wishlist.title': 'Sevimlilar',
  'wishlist.empty': 'Sevimlilar roʻyxati boʻsh',

  // ── Errors / toasts ───────────────────────────────────────────────────
  'error.network': 'Maʼlumotlarni yuklab boʻlmadi',
  'error.tryAgain': 'Yana urinib koʻring',
  'toast.saved': 'Saqlandi',
  'toast.deleted': 'Oʻchirildi',
  'toast.copied': 'Nusxalandi',
};
