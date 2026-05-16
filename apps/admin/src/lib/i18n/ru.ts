import type { Translations } from './types';

// MARKETING-LOCALIZATION-UZ-001 (admin) — русский dictionary (default + fallback).
// Ключи в dot.notation. При добавлении записи — зеркалить в uz.ts.

export const ru: Translations = {
  // ── Common ────────────────────────────────────────────────────────────
  'common.loading': 'Загрузка…',
  'common.language': 'Язык',

  // ── Theme ─────────────────────────────────────────────────────────────
  'theme.light': 'Светлая тема',
  'theme.dark': 'Тёмная тема',
  'theme.toLight': 'Переключить на светлую тему',
  'theme.toDark': 'Переключить на тёмную тему',

  // ── Layout / sidebar ──────────────────────────────────────────────────
  'layout.adminPanel': 'Admin Panel',
  'layout.search': 'Поиск...',
  'layout.logout': 'Выйти',
  'layout.logoutAria': 'Выйти из админки',
  'layout.navMain': 'Главная навигация',
  'layout.navSections': 'Разделы',
  'layout.content': 'Содержимое',

  // ── Navigation groups ─────────────────────────────────────────────────
  'nav.group.data': 'Данные',
  'nav.group.tools': 'Инструменты',
  'nav.group.security': 'Безопасность',
  'nav.group.devops': 'DevOps',

  // ── Navigation items ──────────────────────────────────────────────────
  'nav.dashboard': 'Dashboard',
  'nav.users': 'Пользователи',
  'nav.sellers': 'Продавцы',
  'nav.stores': 'Магазины',
  'nav.products': 'Товары',
  'nav.categories': 'Категории',
  'nav.orders': 'Заказы',
  'nav.moderation': 'Модерация',
  'nav.analytics': 'Аналитика',
  'nav.events': 'События',
  'nav.auditLogs': 'Аудит-лог',
  'nav.database': 'База данных',
  'nav.broadcast': 'Рассылка',
  'nav.chats': 'Чаты',
  'nav.reports': 'Жалобы',
  'nav.admins': 'Администраторы',
  'nav.mfa': 'MFA setup',
  'nav.systemHealth': 'Состояние системы',
  'nav.featureFlags': 'Feature flags',
  'nav.queues': 'Очереди (Bull)',

  // ── Login ─────────────────────────────────────────────────────────────
  'login.title': 'Savdo Admin',
  'login.subtitlePhone': 'Вход через Telegram OTP',
  'login.subtitleOtp': 'Код отправлен на {phone}',
  'login.subtitleMfa': 'Введите код из приложения-аутентификатора',
  'login.phoneLabel': 'Номер телефона',
  'login.tgHint': 'Код придёт в Telegram от @savdo_builderBOT',
  'login.getCode': 'Получить код',
  'login.sending': 'Отправляем...',
  'login.checking': 'Проверяем...',
  'login.confirm': 'Подтвердить',
  'login.mfaActive': 'Двухфакторная аутентификация активна. Откройте Google Authenticator / Authy / 1Password.',
  'login.mfaCodeLabel': 'Код из приложения (6 цифр)',
  'login.subtitleMfaSetup': 'Требуется настройка 2FA',
  'login.mfaSetupHint': 'Отсканируйте QR-код в Google Authenticator / Authy / 1Password, затем введите 6-значный код из приложения.',
  'login.mfaSecretLabel': 'Или введите ключ вручную',
  'login.mfaSetupConfirm': 'Подтвердить и войти',
  'login.loginAgain': 'Войти заново',
  'login.otpLegend': 'Введите 6-значный код из Telegram',
  'login.otpGroupAria': 'Код подтверждения',
  'login.otpDigitAria': 'Цифра {n} из 6',
  'login.resendIn': 'Повторить через',
  'login.resend': 'Отправить код повторно',
  'login.changeNumber': 'Изменить номер',
  'login.openQueues': 'Открываем Bull Board...',
  'login.errPhoneFormat': 'Формат: +998XXXXXXXXX (9 цифр после кода)',
  'login.errSendFailed': 'Ошибка отправки кода',
  'login.errNotAdmin': 'Доступ запрещён. Этот кабинет только для администраторов Savdo.',
  'login.errTgNotLinked': 'Telegram не привязан. Напиши боту @savdo_builderBOT команду /start',
  'login.errBadCode': 'Неверный или просроченный код.',
  'login.errBadMfa': 'Неверный TOTP код',
  'login.errLoginFailed': 'Не удалось войти',
};
