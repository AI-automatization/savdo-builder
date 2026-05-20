# UZ-локализация web-buyer + web-seller — Design

**Тикет:** `MARKETING-LOCALIZATION-UZ-001`
**Дата:** 2026-05-16
**Автор:** Азим (web-buyer, web-seller)
**Статус:** approved, готов к плану реализации

---

## 1. Цель и контекст

web-buyer и web-seller сейчас полностью на русском — текст захардкожен в JSX
десятков файлов. Нужна узбекская локализация (латиница) с возможностью
переключения языка пользователем.

Инфраструктура i18n уже существует и обкатана в трёх аппах монорепо:
`apps/tma/src/lib/i18n/`, `apps/admin/src/lib/i18n/`, `apps/api/src/shared/i18n.ts`.
Admin-версию Полат пометил тем же тикетом `MARKETING-LOCALIZATION-UZ-001`.

**Не входит в этот спек** (отдельные follow-up тикеты):
- SEO `generateMetadata` / OpenGraph остаётся на RU — там в основном имена
  магазинов и товаров (пользовательские данные, не переводятся).
- Форматирование чисел/валюты — остаётся `toLocaleString("ru-RU")` + «сум».
- API-тексты (ошибки, уведомления) — домен Полата, частично уже сделано
  (`apps/api/src/shared/i18n.ts`, Wave 23).

## 2. Выбор архитектуры

| Вариант | Плюсы | Минусы |
|---------|-------|--------|
| `next-intl` | нативная поддержка Server Components, locale в URL | новая зависимость; locale-в-URL покупателю из Telegram-ссылки не нужен; расходится с паттерном остального монорепо |
| **Зеркалить существующий паттерн** ✅ | ноль новых зависимостей; консистентность с TMA/admin/api; паттерн обкатан | Server Components должны быть обёрнуты вручную (в наших аппах их единицы) |

**Выбран** второй вариант — копия `apps/admin/src/lib/i18n/`.

Страницы обеих апп почти все `Client Components` (`'use client'`), так что хук
`useTranslation()` подходит напрямую. Server Components встречаются только в
`metadata`-экспортах — они вне scope (см. §1).

## 3. Инфраструктура

В каждой аппе создаётся `src/lib/i18n/` — точная копия структуры admin:

### `types.ts`
```ts
export type Locale = 'ru' | 'uz';
export const SUPPORTED_LOCALES: Locale[] = ['ru', 'uz'];
export const DEFAULT_LOCALE: Locale = 'ru';
export type Translations = Record<string, string>;
```
`uz` — латиница (соглашение UZ-маркетплейсов с 2023).

### `ru.ts` / `uz.ts`
Плоский словарь `Translations`, ключи в `dot.notation` (напр. `checkout.title`,
`cart.empty.cta`). `ru.ts` — single source of truth: значение не найдено в
`uz.ts` → fallback на `ru.ts` → fallback на сам ключ.

### `I18nProvider.tsx`
React Context, идентичен admin-версии:
- `useTranslation()` → `{ locale, setLocale, t }`.
- `t(key, vars?)` — подстановка `{name}` плейсхолдеров через `interpolate()`.
- Детект начальной локали: `localStorage` → `navigator.language` (`uz*` → uz)
  → `DEFAULT_LOCALE`.
- `setLocale()` пишет в `localStorage` и обновляет `document.documentElement.lang`.
- Ключи `localStorage`: `savdo_buyer_locale` (web-buyer), `savdo_seller_locale`
  (web-seller) — изолированы от admin (`savdo_admin_locale`).

### `index.ts`
Barrel-экспорт: `I18nProvider`, `useTranslation`, `Locale`, `SUPPORTED_LOCALES`,
`DEFAULT_LOCALE`.

### Монтирование
`<I18nProvider>` добавляется в провайдер-стек корневого `app/layout.tsx`,
внутри `ThemeProvider`, оборачивая `{children}`:
```
QueryProvider → AuthProvider → ThemeProvider → I18nProvider → {children}
```
`<html lang="ru">` остаётся статикой; реальный `lang` ставит провайдер эффектом.

## 4. Переключатель языка

Компактный сегментированный тумблер `RU | UZ` — визуально как существующий
theme-toggle.
- **web-buyer** — в `/profile`, в секции настроек (рядом с темой).
- **web-seller** — в `/settings`, в секции настроек.

Один переключатель на аппу. Смена локали — мгновенная (Context re-render),
без перезагрузки.

## 5. Извлечение строк — волнами

Принцип: текущий русский текст из JSX → ключ в `ru.ts` + вызов `t('key')`.
Затем `uz.ts` заполняется узбекскими переводами (генерирую я, Азим ревьюит).

Порядок (web-buyer первым — лицом к покупателю):

**web-buyer**
1. Storefront + каталог — `(shop)/page.tsx`, `[slug]/`, `[slug]/products/[id]/`,
   home-компоненты, `components/store/`, `components/catalog/`.
2. Orders / chats / profile / notifications / wishlist — `(shop)/orders/`,
   `(shop)/chats/`, `(shop)/profile/`, `(shop)/notifications/`, `(shop)/wishlist/`,
   `components/chat/`.
3. Cart / checkout — `(minimal)/cart/`, `(minimal)/checkout/`.
4. Статические страницы — `offer`, `privacy`, `terms`, `refund`.
5. Shared — `components/layout/` (Header, BottomNavBar), общие компоненты.

**web-seller**
6. Auth / onboarding — `(auth)/login/`, `(onboarding)/onboarding/`.
7. Dashboard-страницы — `dashboard`, `orders`, `products`, `analytics`, `chat`,
   `notifications`, `profile`, `settings`, `store/categories`.
8. Shared — `(dashboard)/layout.tsx`, общие компоненты.

Каждая волна = отдельная задача в плане реализации. После волны — `tsc --noEmit`
чист, push в ветку аппы.

## 6. Соглашения по ключам

- Namespace по фиче/странице: `checkout.*`, `cart.*`, `orders.*`, `nav.*`,
  `common.*` (кнопки «Сохранить», «Отмена», «Назад»).
- Общие повторяющиеся строки — в `common.*`, не дублировать.
- Плейсхолдеры — `{name}`, `{count}` и т.п.; склонения/плюрализацию не вводим
  (YAGNI) — где нужно, отдельные ключи или числовой суффикс.

## 7. Тестирование / верификация

- Локальный `pnpm build` запрещён (ПК Азима зависает) — верификация: `npx tsc
  --noEmit` чист после каждой волны + проверка на Railway-URL ветки.
- Ручная проверка: переключить язык в profile/settings, пройти ключевые флоу
  (каталог → товар → корзина → checkout для buyer; login → dashboard →
  товар/заказ для seller).
- Регрессия RU: при `locale='ru'` текст идентичен текущему — это критерий, что
  ключи извлечены без потерь.

## 8. Критерий готовности

- Обе аппы: переключатель RU/UZ работает, выбор сохраняется между сессиями.
- Весь UI-текст (вне scope §1) идёт через `t()`; хардкоженного русского в JSX
  не осталось.
- `uz.ts` заполнен для всех ключей; пропущенный ключ виден через ru-fallback.
- `tsc --noEmit` чист в обеих аппах.
