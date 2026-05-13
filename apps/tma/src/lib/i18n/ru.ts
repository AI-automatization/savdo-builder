import type { Translations } from './types';

// MARKETING-LOCALIZATION-UZ-001 — русский dictionary (default).
//
// Ключи в dot.notation, группированы по domain'у. При добавлении новой
// записи обязательно зеркалить в uz.ts (TypeScript не enforces consistency
// между файлами, но keys-of-ru используется как single source of truth
// в `I18nProvider.t()` fallback).

export const ru: Translations = {
  // ── Common actions ────────────────────────────────────────────────────
  'common.save': 'Сохранить',
  'common.cancel': 'Отмена',
  'common.confirm': 'Подтвердить',
  'common.delete': 'Удалить',
  'common.edit': 'Редактировать',
  'common.back': 'Назад',
  'common.next': 'Далее',
  'common.close': 'Закрыть',
  'common.search': 'Поиск',
  'common.loading': 'Загрузка...',
  'common.error': 'Ошибка',
  'common.retry': 'Попробовать снова',
  'common.somethingWentWrong': 'Что-то пошло не так',

  // ── Navigation ────────────────────────────────────────────────────────
  'nav.home': 'Главная',
  'nav.stores': 'Магазины',
  'nav.cart': 'Корзина',
  'nav.orders': 'Заказы',
  'nav.profile': 'Профиль',
  'nav.settings': 'Настройки',
  'nav.wishlist': 'Избранное',
  'nav.products': 'Товары',
  'nav.chats': 'Чаты',
  'nav.dashboard': 'Главная',

  // ── Auth ──────────────────────────────────────────────────────────────
  'auth.login': 'Войти',
  'auth.logout': 'Выйти из аккаунта',
  'auth.register': 'Зарегистрироваться',
  'auth.welcomeName': 'Привет, {name}!',
  'auth.guest': 'Гость',

  // ── Cart ──────────────────────────────────────────────────────────────
  'cart.title': 'Корзина',
  'cart.empty': 'Корзина пуста',
  'cart.addToCart': 'Добавить в корзину',
  'cart.clear': 'Очистить корзину',
  'cart.total': 'Итого',
  'cart.checkout': 'Оформить заказ',
  'cart.quantity': 'Количество',
  'cart.replaceConfirm': 'Заменить корзину?',
  'cart.replaceBody': 'В корзине сейчас товары из «{store}». Чтобы добавить товар из «{newStore}», нужно очистить старую корзину.',
  'cart.added': 'Добавлено в корзину',

  // ── Checkout ──────────────────────────────────────────────────────────
  'checkout.title': 'Оформление заказа',
  'checkout.customerInfo': 'Контактные данные',
  'checkout.fullName': 'ФИО',
  'checkout.phone': 'Телефон',
  'checkout.address': 'Адрес',
  'checkout.city': 'Город',
  'checkout.deliveryMethod': 'Способ доставки',
  'checkout.paymentMethod': 'Способ оплаты',
  'checkout.paymentCash': 'Наличными',
  'checkout.paymentCard': 'Картой',
  'checkout.submit': 'Подтвердить заказ',
  'checkout.authRequired': '⚠️ Нужна авторизация',
  'checkout.authHint': 'Войдите через Telegram',

  // ── Orders ────────────────────────────────────────────────────────────
  'orders.title': 'Мои заказы',
  'orders.empty': 'У вас пока нет заказов',
  'orders.orderNumber': 'Заказ #{number}',
  'orders.status.PENDING': 'Ожидает',
  'orders.status.CONFIRMED': 'Подтверждён',
  'orders.status.PROCESSING': 'В обработке',
  'orders.status.SHIPPED': 'Доставляется',
  'orders.status.DELIVERED': 'Доставлен',
  'orders.status.CANCELLED': 'Отменён',

  // ── Stores ────────────────────────────────────────────────────────────
  'stores.title': 'Магазины',
  'stores.searchPlaceholder': 'Поиск магазинов...',
  'stores.empty': 'Магазинов пока нет',
  'stores.notFound': 'Ничего не найдено',
  'stores.verifiedTitle': 'Проверенный магазин',
  'stores.openStore': 'Открыть магазин',

  // ── Products ──────────────────────────────────────────────────────────
  'products.title': 'Товары',
  'products.searchPlaceholder': 'Поиск товаров...',
  'products.empty': 'Товаров пока нет',
  'products.price': 'Цена',
  'products.oldPrice': 'Старая цена',
  'products.discount': 'Скидка',
  'products.inStock': 'В наличии',
  'products.outOfStock': 'Нет в наличии',
  'products.sortNew': 'Новые',
  'products.sortPriceAsc': '↑ Цена',
  'products.sortPriceDesc': '↓ Цена',

  // ── Settings ──────────────────────────────────────────────────────────
  'settings.title': 'Настройки',
  'settings.account': 'Аккаунт',
  'settings.theme': 'Тема оформления',
  'settings.themeHint': 'Авто — синхронизация с Telegram. Можно зафиксировать вручную.',
  'settings.language': 'Язык',
  'settings.languageHint': 'Выберите язык интерфейса',
  'settings.becomeSeller': 'Стать продавцом',
  'settings.becomeSellerHint': 'Продавайте на Savdo: создайте магазин, добавьте товары и принимайте заказы в Telegram.',
  'settings.becomeSellerCta': '🏪 Стать продавцом',
  'settings.app': 'Приложение',
  'settings.tgBot': 'Telegram-бот',
  'settings.role.buyer': 'Покупатель',
  'settings.role.seller': 'Продавец',

  // ── Seller-side common ────────────────────────────────────────────────
  'seller.myStore': 'Мой магазин',
  'seller.createStore': 'Создайте свой магазин',
  'seller.createStoreHint': 'Введите название чтобы начать продавать',
  'seller.storeName': 'Название магазина',
  'seller.products': 'Товары',
  'seller.orders': 'Заказы',
  'seller.stats': 'Статистика',

  // ── Wishlist ──────────────────────────────────────────────────────────
  'wishlist.title': 'Избранное',
  'wishlist.empty': 'В избранном пока пусто',

  // ── Errors / toasts ───────────────────────────────────────────────────
  'error.network': 'Не удалось загрузить данные',
  'error.tryAgain': 'Попробуйте ещё раз',
  'toast.saved': 'Сохранено',
  'toast.deleted': 'Удалено',
  'toast.copied': 'Скопировано',
};
