# Telegram — bot profile + channel templates

## Bot Profile (@savdo_builderBOT)

### Description (для `/setdescription`)
> Savdo — открой магазин в Telegram за 3 минуты.
> Принимай заказы, общайся с покупателями, доставляй по всему Узбекистану.
> Бесплатно. Без сайта. Без комиссий на старте.

### About text (для `/setabouttext`, max 120 chars)
> Маркетплейс в Telegram для Узбекистана. Открой магазин за 3 минуты — бесплатно.

### Avatar
`LOGOS/savdo-mark.svg` → 512×512 PNG (см. конвертацию в LOGOS/README.md).

### Commands menu
```
/start - Главное меню
/menu - Главное меню
/orders - Мои заказы
/store - Мой магазин (для продавцов)
/help - Помощь
```

---

## Channel Post Templates

### Welcome / Pinned message
```
👋 Добро пожаловать в Savdo!

Это маркетплейс в Telegram для Узбекистана.

🛍 Покупатель — нажми кнопку ниже и выбирай товары
🏪 Продавец — открой свой магазин за 3 минуты

📱 Открыть приложение → [WebApp button]
```

### Product autopost (когда seller публикует товар)
```
🛍 <b>{{title}}</b>

📝 {{description}}

💰 Цена: <b>{{price}} сум</b>
🏪 Магазин: {{store_name}}
```
Кнопки:
- 🛒 Открыть магазин
- 💬 Написать продавцу

### Promo / Sale post
```
🔥 Новые поступления в Savdo!

3 магазина запустили сезонные коллекции:
• {{store_1_name}} — {{category_1}}
• {{store_2_name}} — {{category_2}}
• {{store_3_name}} — {{category_3}}

📱 Открыть приложение
```

---

## Telegram-WebApp Manifest

Для регистрации WebApp в @BotFather (`/setmenubutton`):
- **URL:** `https://savdo.uz/tma` (или прямой Railway URL)
- **Button text:** `📱 Открыть Savdo`
