/**
 * MARKETING-LOCALIZATION-UZ-001 (backend часть) — i18n для Telegram-уведомлений.
 *
 * Использование: `t(languageCode, 'orders.statusChanged', { number, status })`.
 *
 * Источник `languageCode`: `User.languageCode` (Prisma). Default = 'ru'.
 * Для seller-уведомлений берётся из `seller.user.languageCode` (resolve в
 * `seller-notification.service` / в jobData при queue.add).
 *
 * Узбекские строки используют обратный апостроф `ʻ` (U+02BB) для `oʻ`/`gʻ`,
 * см. `.claude/skills/uzbek-translator/SKILL.md`.
 */

export type Locale = 'ru' | 'uz';

const messages: Record<Locale, Record<string, string>> = {
  ru: {
    // ── Order statuses (buyer-facing) ─────────────────────────────────────
    'orders.status.PENDING.buyer':    '⏳ ожидает подтверждения',
    'orders.status.CONFIRMED.buyer':  '✅ подтверждён продавцом',
    'orders.status.PROCESSING.buyer': '📦 готовится к отправке',
    'orders.status.SHIPPED.buyer':    '🚚 в пути',
    'orders.status.DELIVERED.buyer':  '🎉 доставлен',
    'orders.status.CANCELLED.buyer':  '❌ отменён',

    // ── Order statuses (seller-facing) ────────────────────────────────────
    'orders.status.PENDING.seller':    '⏳ ожидает подтверждения',
    'orders.status.CONFIRMED.seller':  '✅ подтверждён',
    'orders.status.PROCESSING.seller': '📦 в обработке',
    'orders.status.SHIPPED.seller':    '🚚 в пути',
    'orders.status.DELIVERED.seller':  '🎉 доставлен',
    'orders.status.CANCELLED.seller':  '❌ отменён покупателем',

    // ── New order (seller-facing) ─────────────────────────────────────────
    'notify.newOrder.title': '📦 Новый заказ #{orderNumber}',
    'notify.newOrder.body':  'Магазин: {storeName}\nТоваров: {itemCount}\nСумма: {total} {currency}',

    // ── Store moderation ──────────────────────────────────────────────────
    'notify.storeApproved': '✅ Ваш магазин «{storeName}» одобрен и теперь доступен покупателям!',
    'notify.storeRejected.title': '❌ Ваш магазин «{storeName}» отклонён.',
    'notify.storeRejected.reason': 'Причина: {reason}',
    'notify.verificationApproved': '✅ Ваш аккаунт продавца верифицирован. Теперь вы можете создать магазин.',

    // ── Order status change ───────────────────────────────────────────────
    'notify.orderStatus.buyer':  '🛒 Ваш заказ #{orderNumber} — {status}\nМагазин: {storeName}\nСумма: {total} {currency}',
    'notify.orderStatus.seller': '📦 Заказ #{orderNumber} — {status}\nМагазин: {storeName}\nСумма: {total} {currency}',

    // ── Chat message ──────────────────────────────────────────────────────
    'notify.chat.title':    '💬 <b>Новое сообщение</b>',
    'notify.chat.fromBuyer':  'от <b>{senderName}</b>{storeMeta}',
    'notify.chat.fromSeller': 'от <b>{senderName}</b>',
    'notify.chat.context.product': '\n📦 <i>{productTitle}</i>',
    'notify.chat.context.order':   '\n🧾 <i>Заказ #{orderNumber}</i>',
    'notify.chat.openButton': '✉️ Открыть чат',
    'notify.senderFallback.buyer': 'Покупатель',
    'notify.senderFallback.seller': 'Продавец',

    // ── Cart abandonment ──────────────────────────────────────────────────
    'notify.cartAbandoned.title': '🛒 <b>Вы оставили товары в корзине</b>',
    'notify.cartAbandoned.body':  'Магазин: {storeName}\nТоваров: {itemCount}\nСумма: {total} {currency}',
    'notify.cartAbandoned.cta':   'Завершите заказ за 30 секунд — товары всё ещё в наличии.',
    'notify.cartAbandoned.button': '🛍 Открыть корзину',

    // ── Wishlist price-drop ───────────────────────────────────────────────
    'notify.priceDrop.title': '💸 <b>Цена снижена на {discountPct}%!</b>',
    'notify.priceDrop.body':  '📦 {productTitle}\n🏪 {storeName}\n\n<s>{oldPrice} {currency}</s> → <b>{newPrice} {currency}</b>',
    'notify.backInStock.title': '✨ <b>Товар снова в наличии!</b>',
    'notify.backInStock.body':  '📦 {productTitle}\n🏪 {storeName}\n\nЦена: <b>{newPrice} {currency}</b>',
    'notify.wishlist.openButton': '🛍 Открыть товар',
  },

  uz: {
    // ── Order statuses (buyer-facing) ─────────────────────────────────────
    'orders.status.PENDING.buyer':    '⏳ tasdiqlanmoqda',
    'orders.status.CONFIRMED.buyer':  '✅ sotuvchi tomonidan tasdiqlangan',
    'orders.status.PROCESSING.buyer': '📦 joʻnatishga tayyorlanmoqda',
    'orders.status.SHIPPED.buyer':    '🚚 joʻnatildi',
    'orders.status.DELIVERED.buyer':  '🎉 yetkazib berildi',
    'orders.status.CANCELLED.buyer':  '❌ bekor qilindi',

    // ── Order statuses (seller-facing) ────────────────────────────────────
    'orders.status.PENDING.seller':    '⏳ tasdiqlanmoqda',
    'orders.status.CONFIRMED.seller':  '✅ tasdiqlangan',
    'orders.status.PROCESSING.seller': '📦 tayyorlanmoqda',
    'orders.status.SHIPPED.seller':    '🚚 joʻnatildi',
    'orders.status.DELIVERED.seller':  '🎉 yetkazib berildi',
    'orders.status.CANCELLED.seller':  '❌ xaridor bekor qildi',

    // ── New order (seller-facing) ─────────────────────────────────────────
    'notify.newOrder.title': '📦 Yangi buyurtma #{orderNumber}',
    'notify.newOrder.body':  'Doʻkon: {storeName}\nMahsulotlar: {itemCount}\nSumma: {total} {currency}',

    // ── Store moderation ──────────────────────────────────────────────────
    'notify.storeApproved': '✅ «{storeName}» doʻkoningiz tasdiqlandi va endi xaridorlar uchun ochiq!',
    'notify.storeRejected.title': '❌ «{storeName}» doʻkoningiz rad etildi.',
    'notify.storeRejected.reason': 'Sabab: {reason}',
    'notify.verificationApproved': '✅ Sotuvchi akkauntingiz tasdiqlandi. Endi doʻkon yaratishingiz mumkin.',

    // ── Order status change ───────────────────────────────────────────────
    'notify.orderStatus.buyer':  '🛒 Sizning buyurtmangiz #{orderNumber} — {status}\nDoʻkon: {storeName}\nSumma: {total} {currency}',
    'notify.orderStatus.seller': '📦 Buyurtma #{orderNumber} — {status}\nDoʻkon: {storeName}\nSumma: {total} {currency}',

    // ── Chat message ──────────────────────────────────────────────────────
    'notify.chat.title':    '💬 <b>Yangi xabar</b>',
    'notify.chat.fromBuyer':  '<b>{senderName}</b>dan{storeMeta}',
    'notify.chat.fromSeller': '<b>{senderName}</b>dan',
    'notify.chat.context.product': '\n📦 <i>{productTitle}</i>',
    'notify.chat.context.order':   '\n🧾 <i>Buyurtma #{orderNumber}</i>',
    'notify.chat.openButton': '✉️ Suhbatni ochish',
    'notify.senderFallback.buyer': 'Xaridor',
    'notify.senderFallback.seller': 'Sotuvchi',

    // ── Cart abandonment ──────────────────────────────────────────────────
    'notify.cartAbandoned.title': '🛒 <b>Savatda mahsulotlar qoldi</b>',
    'notify.cartAbandoned.body':  'Doʻkon: {storeName}\nMahsulotlar: {itemCount}\nSumma: {total} {currency}',
    'notify.cartAbandoned.cta':   '30 soniyada buyurtmani yakunlang — mahsulotlar hali mavjud.',
    'notify.cartAbandoned.button': '🛍 Savatni ochish',

    // ── Wishlist price-drop ───────────────────────────────────────────────
    'notify.priceDrop.title': '💸 <b>Narx {discountPct}% ga tushdi!</b>',
    'notify.priceDrop.body':  '📦 {productTitle}\n🏪 {storeName}\n\n<s>{oldPrice} {currency}</s> → <b>{newPrice} {currency}</b>',
    'notify.backInStock.title': '✨ <b>Mahsulot yana mavjud!</b>',
    'notify.backInStock.body':  '📦 {productTitle}\n🏪 {storeName}\n\nNarx: <b>{newPrice} {currency}</b>',
    'notify.wishlist.openButton': '🛍 Mahsulotni ochish',
  },
};

/**
 * Нормализует locale-string из User.languageCode → 'ru' | 'uz'.
 * Любое неподдерживаемое значение → 'ru' (fallback).
 */
export function normalizeLocale(raw: string | null | undefined): Locale {
  if (raw === 'uz') return 'uz';
  return 'ru';
}

/**
 * Локализованный перевод с `{var}` interpolation.
 * Если ключа нет в выбранной локали → fallback на ru. Если и в ru нет → возвращает ключ
 * (видно в логах, безопасно).
 */
export function t(
  locale: Locale | string | null | undefined,
  key: string,
  vars?: Record<string, string | number>,
): string {
  const loc = normalizeLocale(typeof locale === 'string' ? locale : 'ru');
  const template = messages[loc][key] ?? messages.ru[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, varName) => {
    const v = vars[varName];
    return v != null ? String(v) : match;
  });
}

/**
 * Локализованное число для Узбекистана. Использует пробел как тысячный
 * разделитель (как в русском). `toLocaleString('uz')` тоже работает корректно.
 */
export function fmt(n: number, locale: Locale | string | null | undefined = 'ru'): string {
  return n.toLocaleString(normalizeLocale(typeof locale === 'string' ? locale : 'ru'));
}

/**
 * Локализация для валюты UZS. ru → "сум", uz → "soʻm".
 */
export function currency(code: string, locale: Locale | string | null | undefined): string {
  if (code !== 'UZS') return code;
  return normalizeLocale(typeof locale === 'string' ? locale : 'ru') === 'uz' ? 'soʻm' : 'сум';
}
