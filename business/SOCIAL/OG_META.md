# Open Graph / SEO Meta

> Для landing-страниц `savdo.uz`, статей блога, share-карточек.

---

## Главная (savdo.uz)

```html
<title>Savdo — Маркетплейс Узбекистана в Telegram</title>
<meta name="description" content="Открой магазин в Telegram за 3 минуты. Принимай заказы, общайся с покупателями, доставляй по Узбекистану. Бесплатно — без сайта и комиссий на старте.">
<meta property="og:title" content="Savdo — Маркетплейс Узбекистана в Telegram">
<meta property="og:description" content="Открой магазин за 3 минуты. Бесплатно. Без сайта.">
<meta property="og:image" content="https://savdo.uz/og/home.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="ru_RU">
<meta property="og:locale:alternate" content="uz_UZ">
<meta name="twitter:card" content="summary_large_image">
```

---

## Buyer-facing landing

```html
<title>Покупай у местных в Telegram — Savdo</title>
<meta name="description" content="Сотни магазинов Узбекистана в одном Telegram-приложении. Доставка по всей стране. Безопасно: проверенные продавцы, отзывы, рейтинг.">
```

---

## Seller-facing landing (`/seller`)

```html
<title>Открой магазин в Telegram за 3 минуты — Savdo</title>
<meta name="description" content="Бесплатная регистрация. Заказы прямо в Telegram. Автопост товаров в твой канал. Без сайта, домена и бухгалтерии. Подходит для физлиц.">
```

---

## Store page (dynamic `/[storeSlug]`)

```html
<title>{{storeName}} — магазин на Savdo</title>
<meta name="description" content="{{storeName}} — {{categoryName}} в Узбекистане. Доставка из {{city}}. Связь напрямую в Telegram. {{reviewCount}} отзывов · ⭐ {{avgRating}}">
<meta property="og:image" content="{{coverUrl}}"> <!-- store coverMediaId -->
```

---

## Product page (dynamic `/[storeSlug]/products/[id]`)

```html
<title>{{productTitle}} — {{storeName}}</title>
<meta name="description" content="{{productTitle}} от {{storeName}}. Цена {{price}} сум. Доставка из {{city}}. {{shortDescription}}">
<meta property="og:image" content="{{firstImageUrl}}">
<meta property="product:price:amount" content="{{price}}">
<meta property="product:price:currency" content="UZS">
```

---

## JSON-LD Schema (главная)

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Savdo",
  "url": "https://savdo.uz",
  "logo": "https://savdo.uz/logos/savdo-mark.png",
  "description": "Маркетплейс Узбекистана в Telegram",
  "address": {
    "@type": "PostalAddress",
    "addressCountry": "UZ",
    "addressLocality": "Tashkent"
  },
  "sameAs": [
    "https://t.me/savdo_builderBOT",
    "https://instagram.com/savdo.uz"
  ]
}
```

См. `apps/web-buyer/src/app/layout.tsx` — там это уже подключено
(MARKETING-SEO-INFRA-001 ✅ 11.05.2026).
