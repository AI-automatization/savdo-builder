import type { Translations } from './types';

// MARKETING-LOCALIZATION-UZ-001 (admin) — узбекский dictionary (латиница).
// Обратный апостроф ʻ (U+02BB) для oʻ/gʻ, ʼ (U+02BC) — tutuq belgisi.

export const uz: Translations = {
  // ── Common ────────────────────────────────────────────────────────────
  'common.loading': 'Yuklanmoqda…',
  'common.language': 'Til',

  // ── Theme ─────────────────────────────────────────────────────────────
  'theme.light': 'Yorugʻ mavzu',
  'theme.dark': 'Qorongʻi mavzu',
  'theme.toLight': 'Yorugʻ mavzuga oʻtish',
  'theme.toDark': 'Qorongʻi mavzuga oʻtish',

  // ── Layout / sidebar ──────────────────────────────────────────────────
  'layout.adminPanel': 'Admin panel',
  'layout.search': 'Qidiruv...',
  'layout.logout': 'Chiqish',
  'layout.logoutAria': 'Admin paneldan chiqish',
  'layout.navMain': 'Asosiy navigatsiya',
  'layout.navSections': 'Boʻlimlar',
  'layout.content': 'Kontent',

  // ── Navigation groups ─────────────────────────────────────────────────
  'nav.group.data': 'Maʼlumotlar',
  'nav.group.tools': 'Vositalar',
  'nav.group.security': 'Xavfsizlik',
  'nav.group.devops': 'DevOps',

  // ── Navigation items ──────────────────────────────────────────────────
  'nav.dashboard': 'Dashboard',
  'nav.users': 'Foydalanuvchilar',
  'nav.sellers': 'Sotuvchilar',
  'nav.stores': 'Doʻkonlar',
  'nav.products': 'Mahsulotlar',
  'nav.categories': 'Turkumlar',
  'nav.orders': 'Buyurtmalar',
  'nav.moderation': 'Moderatsiya',
  'nav.analytics': 'Analitika',
  'nav.events': 'Hodisalar',
  'nav.auditLogs': 'Audit jurnali',
  'nav.database': 'Maʼlumotlar bazasi',
  'nav.broadcast': 'Axborot tarqatish',
  'nav.chats': 'Suhbatlar',
  'nav.reports': 'Shikoyatlar',
  'nav.admins': 'Administratorlar',
  'nav.mfa': 'MFA sozlash',
  'nav.systemHealth': 'Tizim holati',
  'nav.featureFlags': 'Feature flags',
  'nav.queues': 'Navbatlar (Bull)',

  // ── Login ─────────────────────────────────────────────────────────────
  'login.title': 'Savdo Admin',
  'login.subtitlePhone': 'Telegram OTP orqali kirish',
  'login.subtitleOtp': 'Kod {phone} raqamiga yuborildi',
  'login.subtitleMfa': 'Autentifikator ilovasidagi kodni kiriting',
  'login.phoneLabel': 'Telefon raqami',
  'login.tgHint': 'Kod Telegram orqali @savdo_builderBOT dan keladi',
  'login.getCode': 'Kod olish',
  'login.sending': 'Yuborilmoqda...',
  'login.checking': 'Tekshirilmoqda...',
  'login.confirm': 'Tasdiqlash',
  'login.mfaActive': 'Ikki bosqichli autentifikatsiya yoqilgan. Google Authenticator / Authy / 1Password oching.',
  'login.mfaCodeLabel': 'Ilovadagi kod (6 raqam)',
  'login.subtitleMfaSetup': '2FA sozlash talab qilinadi',
  'login.mfaSetupHint': 'QR-kodni Google Authenticator / Authy / 1Password ilovasida skanerlang, soʻng ilovadagi 6 xonali kodni kiriting.',
  'login.mfaSecretLabel': 'Yoki kalitni qoʻlda kiriting',
  'login.mfaSetupConfirm': 'Tasdiqlash va kirish',
  'login.loginAgain': 'Qaytadan kirish',
  'login.otpLegend': 'Telegramdan kelgan 6 xonali kodni kiriting',
  'login.otpGroupAria': 'Tasdiqlash kodi',
  'login.otpDigitAria': '6 dan {n}-raqam',
  'login.resendIn': 'Qayta yuborish',
  'login.resend': 'Kodni qayta yuborish',
  'login.changeNumber': 'Raqamni oʻzgartirish',
  'login.openQueues': 'Bull Board ochilmoqda...',
  'login.errPhoneFormat': 'Format: +998XXXXXXXXX (kоddan keyin 9 raqam)',
  'login.errSendFailed': 'Kod yuborishda xatolik',
  'login.errNotAdmin': 'Kirish taqiqlangan. Bu kabinet faqat Savdo administratorlari uchun.',
  'login.errTgNotLinked': 'Telegram bogʻlanmagan. @savdo_builderBOT botiga /start buyrugʻini yozing',
  'login.errBadCode': 'Notoʻgʻri yoki muddati oʻtgan kod.',
  'login.errBadMfa': 'Notoʻgʻri TOTP kod',
  'login.errLoginFailed': 'Kirib boʻlmadi',
};
