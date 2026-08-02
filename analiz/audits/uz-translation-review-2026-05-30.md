# UZ-перевод — review-материал (ru ↔ uz)

> **Задача:** `WEB-UZ-TRANSLATION-REVIEW-001`. Сгенерировано автоматически для нативной вычитки Азимом.
> Источник: ветки `web-buyer` / `web-seller` (i18n-файлы живут там, не на main).
> Файлы: `apps/web-*/src/lib/i18n/{ru,uz}.ts`.
>
> **Как читать:** колонка «Флаг» — авто-эвристика, НЕ приговор. Глазами проверь строки с флагами в первую очередь,
> затем пробегись по остальным на естественность узбекского. Правки вносить прямо в `uz.ts` на соответствующей ветке.
>
> **Легенда флагов:**
> - 🔴 **КИРИЛЛИЦА в uz** — узбекский у нас латиница, кириллица = баг, чинить обязательно.
> - 🟠 **апостроф-дефект** — в норме узб. латиница использует ДВА разных символа, оба правильные:
>   **oʻ / gʻ** → ʻ U+02BB (turned comma); **тутук-белгиси** (`maʼlumot`, `isteʼmol`, `taʼminlash`) → ʼ U+02BC.
>   Флаг ставится ТОЛЬКО на реальный дефект: U+02BB не после o/g, кудрявая кавычка ‘/’ (U+2018/U+2019),
>   или ASCII `'` между букв. Просто наличие ʼU+02BC или ʻU+02BB — это норма, НЕ флаг.
> - 🟡 **= ru** — uz-строка дословно совпала с русской (кириллической) → вероятно забыли перевести.
> - ❌ **НЕТ uz** — ключ есть в ru, в uz отсутствует → UI показывает русский fallback. Решить: переводить или это намеренно (бренд/латиница-нейтрально).
>
> **Авто-итог по орфографии:** кириллицы — 0, отсутствующих ключей — 0, дословных ru-совпадений — 0,
> кудрявых кавычек/мисплейснутых U+02BB — 0. Файлы орфографически чистые; цель твоей вычитки — **естественность
> формулировок** (полный список ниже), а не механические дефекты.

---

## web-buyer

**Итого ключей:** 532 · 🔴 кириллица: **0** · ❌ нет uz: **0** · 🟡 = ru: **0** · 🟠 апостроф-вариативность: **0**

### ⚑ Строки с флагами (0) — смотреть первыми

_нет_

<details><summary>### Полный список (532) — для прогона на естественность</summary>

| Ключ | ru | uz |
|---|---|---|
| `common.save` | Сохранить | Saqlash |
| `common.cancel` | Отмена | Bekor qilish |
| `common.back` | Назад | Orqaga |
| `common.close` | Закрыть | Yopish |
| `common.delete` | Удалить | Oʻchirish |
| `common.edit` | Изменить | Tahrirlash |
| `common.loading` | Загрузка… | Yuklanmoqda… |
| `common.retry` | Повторить | Qayta urinish |
| `common.error` | Что-то пошло не так | Nimadir xato ketdi |
| `common.empty` | Ничего не найдено | Hech narsa topilmadi |
| `settings.title` | Настройки | Sozlamalar |
| `settings.language` | Язык интерфейса | Interfeys tili |
| `home.hero.tagline` | Bozor zamonaviy | Bozor zamonaviy |
| `home.hero.title` | Магазины Telegram.\nБез посредников. | Telegram doʻkonlari.\nVositachilarsiz. |
| `home.hero.subtitle` | Прямая связь с продавцом. Цена как в чате. Доставка по Узбекистану. | Sotuvchi bilan toʻgʻridan-toʻgʻri aloqa. Narx chatdagidek. Oʻzbekiston boʻylab yetkazib berish. |
| `home.hero.browseStores` | Смотреть магазины | Doʻkonlarni koʻrish |
| `home.hero.becomeSeller` | Стать продавцом | Sotuvchi boʻlish |
| `home.categories.all` | Все | Barchasi |
| `home.topStores.title` | — Топ магазины | — Top doʻkonlar |
| `home.topStores.allStores` | Все магазины → | Barcha doʻkonlar → |
| `home.featured.byCategory` | По категории | Kategoriya boʻyicha |
| `home.featured.newArrivals` | Новинки | Yangi mahsulotlar |
| `home.featured.allProducts` | Все товары → | Barcha mahsulotlar → |
| `home.featured.emptyCatalog` | В этой категории пока нет товаров | Bu kategoriyada hozircha mahsulot yoʻq |
| `home.featured.emptyFeatured` | Скоро здесь появятся товары | Tez orada mahsulotlar paydo boʻladi |
| `home.quickLinks.ordersTitle` | Мои заказы | Buyurtmalarim |
| `home.quickLinks.ordersSubtitle` | Статус доставки и история | Yetkazib berish holati va tarixi |
| `home.quickLinks.chatsTitle` | Чаты с продавцами | Sotuvchilar bilan suhbatlar |
| `home.quickLinks.chatsSubtitle` | Вопросы по заказу или товару | Buyurtma yoki mahsulot boʻyicha savollar |
| `home.recentStores.title` | — Недавние магазины | — Soʻnggi doʻkonlar |
| `home.recentStores.forget` | Забыть магазин | Doʻkonni unutish |
| `store.verified` | Проверенный | Tasdiqlangan |
| `store.verifiedLabel` | Проверенный магазин | Tasdiqlangan doʻkon |
| `store.allProducts` | Все товары → | Barcha mahsulotlar → |
| `store.chat` | Чат | Chat |
| `store.byCategory` | — По категориям | — Kategoriyalar boʻyicha |
| `store.allCategory` | Все | Barchasi |
| `store.productsSection` | — Товары | — Mahsulotlar |
| `store.shopSubLabel` | — Магазин · {city} | — Doʻkon · {city} |
| `store.reviewWordUz` | ta sharh | ta sharh |
| `store.ratingAriaLabel` | Рейтинг {rating} из 5, {count} отзывов | Reyting {rating} dan 5, {count} ta sharh |
| `store.noPhoto` | Без фото | Fotosiz |
| `store.outOfStock` | Нет в наличии | Mavjud emas |
| `store.inStock` | В наличии · {count} шт | Mavjud · {count} dona |
| `store.filters.label` | Фильтры | Filtrlar |
| `store.filters.reset` | Сбросить | Tozalash |
| `store.filters.category` | Категория | Kategoriya |
| `store.filters.price` | Цена, сум | Narx, soʻm |
| `store.filters.priceFrom` | от | dan |
| `store.filters.priceTo` | до | gacha |
| `store.filters.noFilters` | У этой категории нет дополнительных фильтров | Bu kategoriyada qoʻshimcha filtrlar yoʻq |
| `store.filters.any` | Любой | Istalgan |
| `store.filters.anyValue` | Любое | Istalgan |
| `store.filters.clear` | Очистить | Tozalash |
| `store.productsSearch` | Поиск по товарам... | Mahsulotlar boʻyicha qidiruv... |
| `store.productsEmpty` | Товаров в этой категории пока нет | Bu kategoriyada hozircha mahsulot yoʻq |
| `store.searchEmpty` | Ничего не найдено | Hech narsa topilmadi |
| `product.notFound` | Товар не найден | Mahsulot topilmadi |
| `product.notFoundDesc` | Возможно, продавец его удалил или скрыл | Ehtimol, sotuvchi uni oʻchirgan yoki yashirgan |
| `product.toStore` | К магазину | Doʻkonga oʻtish |
| `product.back` | Назад | Orqaga |
| `product.wishlistAdd` | В избранное | Sevimlilar |
| `product.wishlistRemove` | Убрать из избранного | Sevimlilardan olib tashlash |
| `product.shareTelegram` | Поделиться в Telegram | Telegramda ulashish |
| `product.linkCopied` | Ссылка скопирована | Havola nusxalandi |
| `product.showPhoto` | Показать фото {n} | {n}-rasmni koʻrsatish |
| `product.ctaLoading` | Загрузка... | Yuklanmoqda... |
| `product.ctaOutOfStock` | Нет в наличии | Mavjud emas |
| `product.ctaSelectVariant` | Выберите вариант | Variant tanlang |
| `product.ctaAdded` | Добавлено ✓ | Qoʻshildi ✓ |
| `product.ctaAddToCart` | В корзину · {price} сум | Savatga · {price} soʻm |
| `product.discuss` | Обсудить | Muhokama |
| `product.discussLabel` | Обсудить с продавцом | Sotuvchi bilan muhokama qilish |
| `product.variantUnavailable` | Эта комбинация временно недоступна | Bu kombinatsiya vaqtincha mavjud emas |
| `product.variantLabel` | Вариант: | Variant: |
| `product.decreaseQty` | Уменьшить количество | Miqdorni kamaytirish |
| `product.increaseQty` | Увеличить количество | Miqdorni oshirish |
| `product.descriptionSection` | — Описание | — Tavsif |
| `product.attributesSection` | — Характеристики | — Xususiyatlar |
| `product.fromStore` | — Из этого магазина | — Ushbu doʻkondan |
| `product.allFromStore` | Все → | Barchasi → |
| `product.reviews.section` | — Отзывы | — Sharhlar |
| `product.reviews.empty` | Пока нет отзывов. Будьте первым после получения заказа. | Hali sharh yoʻq. Buyurtmani olgandan keyin birinchi boʻling. |
| `product.reviews.ratingLabel` | Рейтинг {rating} из 5 | Reyting {rating} dan 5 |
| `product.reviews.showMore` | Показать ещё отзывы | Yana sharhlarni koʻrsatish |
| `product.defaultCategory` | Товар | Mahsulot |
| `catalog.all` | Все | Barchasi |
| `catalog.sort.new` | Новые | Yangi |
| `catalog.sort.priceAsc` | Дешевле | Arzonroq |
| `catalog.sort.priceDesc` | Дороже | Qimmatroq |
| `catalog.sort.top` | Популярные | Mashhur |
| `catalog.sort.rating` | По рейтингу | Reyting boʻyicha |
| `catalog.sort.label` | Сортировка | Saralash |
| `catalog.sort.option` | Сортировка: {label} | Saralash: {label} |
| `catalog.stores.allCities` | Все города | Barcha shaharlar |
| `catalog.stores.cityLabel` | Город | Shahar |
| `catalog.stores.verifiedOnly` | ✓ Только проверенные | ✓ Faqat tasdiqlanganlar |
| `catalog.loadMore` | Загрузить ещё | Koʻproq yuklash |
| `orders.title` | Заказы | Buyurtmalar |
| `orders.filter.all` | Все | Barchasi |
| `orders.filter.pending` | Ожидают | Kutilmoqda |
| `orders.filter.confirmed` | Подтвержд. | Tasdiqlandi |
| `orders.filter.shipped` | В пути | Yoʻlda |
| `orders.filter.delivered` | Доставлены | Yetkazildi |
| `orders.filter.cancelled` | Отменённые | Bekor qilingan |
| `orders.search.placeholder` | Поиск по № заказа или адресу | Buyurtma raqami yoki manzil boʻyicha qidiruv |
| `orders.search.clearLabel` | Очистить | Tozalash |
| `orders.error` | Не удалось загрузить заказы. Обновите страницу. | Buyurtmalarni yuklashda xato. Sahifani yangilang. |
| `orders.empty.label` | — Пусто | — Boʻsh |
| `orders.empty.noResults` | Ничего по «{query}» | «{query}» boʻyicha hech narsa topilmadi |
| `orders.empty.noCancelled` | Нет отменённых заказов | Bekor qilingan buyurtmalar yoʻq |
| `orders.empty.noOrders` | Заказов пока нет | Hozircha buyurtmalar yoʻq |
| `orders.empty.noStatus` | Нет заказов: «{label}» | Buyurtmalar yoʻq: «{label}» |
| `orders.empty.hint` | Попробуйте другой запрос | Boshqa soʻrov bilan urinib koʻring |
| `orders.empty.hintFirst` | Когда оформите заказ — он появится здесь | Buyurtma rasmiylashtirilgach — bu yerda paydo boʻladi |
| `orders.empty.toStores` | К магазинам | Doʻkonlarga oʻtish |
| `orders.card.number` | Заказ #{number} | Buyurtma #{number} |
| `orders.card.loadMore` | Загрузить ещё | Koʻproq yuklash |
| `orders.loginTitle` | Войдите чтобы видеть заказы | Buyurtmalarni koʻrish uchun kiring |
| `orders.sellerAccountTitle` | Это аккаунт продавца | Bu sotuvchi hisobi |
| `orders.sellerAccountDesc` | История покупок доступна только покупателям. Войдите с другим номером, чтобы делать заказы здесь. | Xaridlar tarixi faqat xaridorlar uchun mavjud. Buyurtma berish uchun boshqa raqam bilan kiring. |
| `orders.status.PENDING` | Ожидает | Kutilmoqda |
| `orders.status.CONFIRMED` | Подтверждён | Tasdiqlandi |
| `orders.status.PROCESSING` | Обработка | Ishlov berilmoqda |
| `orders.status.SHIPPED` | В пути | Yoʻlda |
| `orders.status.DELIVERED` | Доставлен | Yetkazildi |
| `orders.status.CANCELLED` | Отменён | Bekor qilindi |
| `orders.detail.backLabel` | Назад | Orqaga |
| `orders.detail.orderNumber` | Заказ #{number} | Buyurtma #{number} |
| `orders.detail.loadError` | Не удалось загрузить заказ | Buyurtmani yuklashda xato |
| `orders.detail.backToOrders` | ← Назад к заказам | ← Buyurtmalarga qaytish |
| `orders.detail.statusLabel` | — Статус | — Holat |
| `orders.detail.timelineLabel` | — Этапы | — Bosqichlar |
| `orders.detail.seller` | Продавец | Sotuvchi |
| `orders.detail.write` | Написать | Yozish |
| `orders.detail.itemsLabel` | — Товары · {qty} шт | — Mahsulotlar · {qty} dona |
| `orders.detail.deliveryLabel` | — Доставка | — Yetkazib berish |
| `orders.detail.pickup` | Самовывоз | Oʻzim olib ketaman |
| `orders.detail.buyerNote` | Комментарий покупателя | Xaridor izohi |
| `orders.detail.totalsLabel` | — Итого | — Jami |
| `orders.detail.goodsLine` | Товары · {qty} шт | Mahsulotlar · {qty} dona |
| `orders.detail.deliveryLine` | Доставка | Yetkazib berish |
| `orders.detail.toPay` | К оплате | Toʻlov summasi |
| `orders.detail.chatBtn` | Чат по заказу | Buyurtma boʻyicha chat |
| `orders.detail.toStores` | К магазинам | Doʻkonlarga oʻtish |
| `orders.detail.openTelegram` | Открыть в Telegram | Telegramda ochish |
| `orders.detail.cancelBtn` | Отменить заказ | Buyurtmani bekor qilish |
| `orders.detail.confirmCancelQuestion` | Отменить заказ #{number}? | Buyurtma #{number} ni bekor qilasizmi? |
| `orders.detail.confirmCancelYes` | Да, отменить | Ha, bekor qilish |
| `orders.detail.storeFallback` | Магазин | Doʻkon |
| `orders.meta.PENDING.label` | Ожидает подтверждения | Tasdiqlash kutilmoqda |
| `orders.meta.PENDING.eta` | Продавец скоро рассмотрит заказ | Sotuvchi tez orada buyurtmani koʻrib chiqadi |
| `orders.meta.CONFIRMED.label` | Подтверждён | Tasdiqlandi |
| `orders.meta.CONFIRMED.eta` | Магазин готовит ваш заказ | Doʻkon buyurtmangizni tayyorlamoqda |
| `orders.meta.PROCESSING.label` | В обработке | Ishlov berilmoqda |
| `orders.meta.PROCESSING.eta` | Идёт сборка заказа | Buyurtma yigʻilmoqda |
| `orders.meta.SHIPPED.label` | В пути | Yoʻlda |
| `orders.meta.SHIPPED.eta` | Курьер скоро привезёт | Kuryer tez orada yetkazib beradi |
| `orders.meta.DELIVERED.label` | Доставлен | Yetkazildi |
| `orders.meta.DELIVERED.eta` | Спасибо за покупку | Xarid uchun rahmat |
| `orders.meta.CANCELLED.label` | Отменён | Bekor qilindi |
| `orders.meta.CANCELLED.eta` | Заказ был отменён | Buyurtma bekor qilindi |
| `orders.timeline.placed` | Заказ оформлен | Buyurtma rasmiylashtirildi |
| `orders.timeline.confirmed` | Подтверждён продавцом | Sotuvchi tasdiqladi |
| `orders.timeline.processing` | Сборка заказа | Buyurtma yigʻilmoqda |
| `orders.timeline.shipped` | Передан курьеру | Kuryerga topshirildi |
| `orders.timeline.delivered` | Доставлен | Yetkazildi |
| `orders.itemCountUz` | {count} ta mahsulot | {count} ta mahsulot |
| `profile.ordersCountUz` | {count} ta buyurtma | {count} ta buyurtma |
| `profile.wishlistCountUz` | {count} ta mahsulot | {count} ta mahsulot |
| `notifications.countUz` | {count} ta bildirishnoma | {count} ta bildirishnoma |
| `common.emptyFallback` | Пусто | Boʻsh |
| `chat.time.yesterday` | вчера | kecha |
| `chat.date.today` | Сегодня | Bugun |
| `chat.date.yesterday` | Вчера | Kecha |
| `notifications.time.justNow` | только что | hozirgina |
| `notifications.time.mins` | {count} мин | {count} daq |
| `notifications.time.hrs` | {count} ч | {count} soat |
| `notifications.time.days` | {count} дн | {count} kun |
| `chat.title` | Чаты | Chatlar |
| `chat.search.placeholder` | Поиск магазинов | Doʻkonlarni qidirish |
| `chat.filter.all` | Все · {count} | Barchasi · {count} |
| `chat.filter.unread` | Непрочитанные · {count} | Oʻqilmagan · {count} |
| `chat.threadFallback` | Магазин | Doʻkon |
| `chat.noMessages` | Нет сообщений | Xabarlar yoʻq |
| `chat.loadError` | Ошибка загрузки | Yuklashda xato |
| `chat.empty.title` | Чатов пока нет | Hozircha chatlar yoʻq |
| `chat.empty.hint` | Откройте магазин или заказ и нажмите кнопку чата | Doʻkon yoki buyurtmani oching va chat tugmasini bosing |
| `chat.empty.toStores` | Перейти к магазинам | Doʻkonlarga oʻtish |
| `chat.noMatches` | Нет совпадений | Mos natijalar topilmadi |
| `chat.placeholder.title` | Здесь появятся ваши диалоги | Bu yerda suhbatlaringiz paydo boʻladi |
| `chat.placeholder.hint` | Зайдите в любой магазин, откройте товар и нажмите кнопку чата. | Istalgan doʻkonga kiring, mahsulotni oching va chat tugmasini bosing. |
| `chat.placeholder.select` | Выберите чат | Chatni tanlang |
| `chat.loginTitle` | Войдите для доступа к чатам | Chatlarga kirish uchun tizimga kiring |
| `chat.threadStatus.open` | Открыт | Ochiq |
| `chat.threadStatus.closed` | Закрыт | Yopiq |
| `chat.deleteThreadLabel` | Удалить чат | Chatni oʻchirish |
| `chat.backLabel` | Назад | Orqaga |
| `chat.sendLabel` | Отправить | Yuborish |
| `chat.messageDeleted` | Сообщение удалено | Xabar oʻchirildi |
| `chat.edited` | изменено ·  | tahrirlangan ·  |
| `chat.actionsLabel` | Действия с сообщением | Xabar amallari |
| `chat.editAction` | Редактировать | Tahrirlash |
| `chat.deleteAction` | Удалить | Oʻchirish |
| `chat.composerPlaceholder` | Сообщение... | Xabar... |
| `chat.closedBySeller` | Чат закрыт продавцом | Chat sotuvchi tomonidan yopildi |
| `chat.confirmDeleteMsg.title` | Удалить сообщение? | Xabarni oʻchirasizmi? |
| `chat.confirmDeleteMsg.hint` | Продавец увидит «Сообщение удалено» вместо текста. | Sotuvchi matn oʻrnida «Xabar oʻchirildi» ni koʻradi. |
| `chat.confirmDeleteThread.title` | Удалить этот чат? | Bu chatni oʻchirasizmi? |
| `chat.confirmDeleteThread.hint` | Чат исчезнет из вашего списка. Продавец продолжит видеть историю. | Chat roʻyxatingizdan yoʻqoladi. Sotuvchi tarixni koʻrishda davom etadi. |
| `chat.pinnedProduct.label` | Обсуждение товара | Mahsulot muhokamasi |
| `chat.pinnedProduct.open` | Открыть | Ochish |
| `chat.composer.title` | Написать продавцу | Sotuvchiga yozish |
| `chat.composer.placeholder` | Здравствуйте! Есть вопрос... | Assalomu alaykum! Savolim bor... |
| `chat.composer.sendError` | Не удалось отправить сообщение. Попробуйте ещё раз. | Xabar yuborishda xato. Qayta urinib koʻring. |
| `chat.composer.sending` | Отправка... | Yuborilmoqda... |
| `chat.composer.send` | Отправить | Yuborish |
| `chat.composer.closeLabel` | Закрыть | Yopish |
| `chat.composer.loginTitle` | Войдите чтобы написать | Yozish uchun tizimga kiring |
| `chat.composer.loginSubtitle` | Подтвердите номер телефона — после этого сможете написать продавцу про «{title}» | Telefon raqamingizni tasdiqlang — shundan soʻng «{title}» haqida sotuvchiga yoza olasiz |
| `profile.title` | Профиль | Profil |
| `profile.loginTitle` | Войдите в аккаунт | Hisobga kiring |
| `profile.changePhoto` | Изменить фото | Rasmni oʻzgartirish |
| `profile.addPhoto` | Добавить фото | Rasm qoʻshish |
| `profile.photoAlt` | Фото профиля | Profil rasmi |
| `profile.changePhotoLabel` | Изменить фото профиля | Profil rasmini oʻzgartirish |
| `profile.avatarErrorType` | Только JPEG, PNG или WebP | Faqat JPEG, PNG yoki WebP |
| `profile.avatarErrorSize` | Файл больше 10 МБ | Fayl 10 MB dan katta |
| `profile.avatarErrorUpload` | Не удалось загрузить фото | Rasmni yuklashda xato |
| `profile.stat.orders` | Заказов | Buyurtmalar |
| `profile.stat.wishlist` | В избранном | Sevimlilar |
| `profile.stat.cart` | Корзина | Savat |
| `profile.section.activity` | Активность | Faollik |
| `profile.section.growth` | Развитие | Rivojlanish |
| `profile.menu.orders` | Мои заказы | Mening buyurtmalarim |
| `profile.menu.wishlist` | Избранное | Sevimlilar |
| `profile.menu.notifications` | Уведомления | Bildirishnomalar |
| `profile.menu.notificationsSub` | История событий | Hodisalar tarixi |
| `profile.becomeSeller.title` | Откройте свой магазин | Oʻz doʻkoningizni oching |
| `profile.becomeSeller.desc` | Запустите Telegram-storefront за 5 минут. Свой каталог, корзина, заказы — без сайта. | 5 daqiqada Telegram-storefront ishga tushiring. Oʻz katalogi, savat, buyurtmalar — saytisiz. |
| `profile.becomeSeller.btn` | Стать продавцом | Sotuvchi boʻlish |
| `profile.becomeSeller.ariaLabel` | Стать продавцом — продолжить в Telegram-боте | Sotuvchi boʻlish — Telegram-botda davom etish |
| `profile.logout.btn` | Выйти из аккаунта | Hisobdan chiqish |
| `profile.logout.confirm` | Выйти из аккаунта? | Hisobdan chiqasizmi? |
| `profile.logout.yes` | Выйти | Chiqish |
| `notifications.title` | Уведомления | Bildirishnomalar |
| `notifications.readAll` | Прочитать все | Barchasini oʻqish |
| `notifications.filter.all` | Все · {count} | Barchasi · {count} |
| `notifications.filter.unread` | Непрочитанные · {count} | Oʻqilmagan · {count} |
| `notifications.filter.unreadNoCount` | Непрочитанные | Oʻqilmagan |
| `notifications.error` | Не удалось загрузить уведомления | Bildirishnomalarni yuklashda xato |
| `notifications.empty.label` | — Пусто | — Boʻsh |
| `notifications.empty.noUnread` | Нет непрочитанных | Oʻqilmagan bildirishnomalar yoʻq |
| `notifications.empty.noNotifications` | Уведомлений пока нет | Hozircha bildirishnomalar yoʻq |
| `notifications.empty.hint` | Когда что-то случится с заказом — появится здесь | Buyurtmada biror narsa boʻlganda — bu yerda paydo boʻladi |
| `notifications.bucket.today` | Сегодня | Bugun |
| `notifications.bucket.yesterday` | Вчера | Kecha |
| `notifications.bucket.week` | На прошлой неделе | Oʻtgan haftada |
| `notifications.bucket.earlier` | Ранее | Oldinroq |
| `notifications.authGate.label` | — Уведомления | — Bildirishnomalar |
| `notifications.authGate.title` | Войдите чтобы видеть уведомления | Bildirishnomalarni koʻrish uchun kiring |
| `notifications.authGate.hint` | Уведомления об изменении статуса заказов и другие важные события | Buyurtma holati oʻzgarishi va boshqa muhim voqealar haqida bildirishnomalar |
| `notifications.authGate.login` | Войти | Kirish |
| `cart.title` | Корзина | Savat |
| `cart.backLabel` | Назад | Orqaga |
| `cart.outOfStock` | Нет в наличии | Mavjud emas |
| `cart.notify` | Уведомить | Xabardor qilish |
| `cart.storeFallback` | Магазин | Doʻkon |
| `cart.productFallback` | Товар | Mahsulot |
| `cart.itemCountUz` | {count} ta mahsulot | {count} ta mahsulot |
| `cart.writeSeller` | написать продавцу | sotuvchiga yozish |
| `cart.chat` | 💬 Чат | 💬 Chat |
| `cart.freeDeliveryRemaining` | До бесплатной доставки {amount} сум | Bepul yetkazib berishga {amount} soʻm qoldi |
| `cart.freeDeliveryIncluded` | ✓ Бесплатная доставка включена | ✓ Bepul yetkazib berish kiritilgan |
| `cart.summaryLabel` | — Итого | — Jami |
| `cart.subtotal` | Подытог | Oraliq jami |
| `cart.delivery` | Доставка | Yetkazib berish |
| `cart.deliveryFree` | Бесплатно | Bepul |
| `cart.deliveryAtCheckout` | при оформлении | rasmiylashtirishda |
| `cart.total` | К оплате | Toʻlov summasi |
| `cart.checkout` | Оформить заказ → | Buyurtma rasmiylashtirish → |
| `cart.continueShopping` | ← Продолжить покупки | ← Xaridni davom ettirish |
| `cart.checkoutWithAmount` | Оформить заказ · {amount} сум | Buyurtma rasmiylashtirish · {amount} soʻm |
| `cart.emptyLabel` | — Пусто | — Boʻsh |
| `cart.emptyTitle` | В корзине пока пусто | Savat hozircha boʻsh |
| `cart.emptyHint` | Добавьте товар в корзину чтобы оформить заказ | Buyurtma berish uchun mahsulotni savatga qoʻshing |
| `cart.toStores` | К магазинам | Doʻkonlarga oʻtish |
| `cart.loadError` | Не удалось загрузить корзину | Savatni yuklashda xato |
| `cart.chatTitle` | Корзина · {items} | Savat · {items} |
| `cart.chatInitialText` | Хочу уточнить по товарам из корзины:\n{items} | Savat mahsulotlari boʻyicha aniqlashtirmoqchiman:\n{items} |
| `checkout.title` | Оформление заказа | Buyurtma rasmiylashtirish |
| `checkout.otp.enterPhone` | Введите телефон | Telefon raqamini kiriting |
| `checkout.otp.enterCode` | Введите код | Kodni kiriting |
| `checkout.otp.phoneHint` | Для оформления заказа нужно подтвердить номер | Buyurtma berish uchun raqamni tasdiqlash kerak |
| `checkout.otp.codeHint` | Код отправлен в Telegram на {phone} | Kod Telegramga {phone} raqamiga yuborildi |
| `checkout.otp.phoneLabel` | Телефон | Telefon |
| `checkout.otp.sending` | Отправка... | Yuborilmoqda... |
| `checkout.otp.getCode` | Получить код | Kodni olish |
| `checkout.otp.codeLabel` | Код из сообщения | Xabardagi kod |
| `checkout.otp.verifying` | Проверка... | Tekshirilmoqda... |
| `checkout.otp.confirm` | Подтвердить | Tasdiqlash |
| `checkout.otp.changePhone` | ← Изменить номер | ← Raqamni oʻzgartirish |
| `checkout.step.contacts` | Контакты | Kontaktlar |
| `checkout.step.delivery` | Доставка | Yetkazib berish |
| `checkout.step.payment` | Оплата | Toʻlov |
| `checkout.done` | Готово | Tayyor |
| `checkout.nameLabel` | Имя | Ism |
| `checkout.namePlaceholder` | Ваше имя | Ismingiz |
| `checkout.phoneLabel` | Телефон | Telefon |
| `checkout.delivery.modeDelivery` | Доставка | Yetkazib berish |
| `checkout.delivery.modePickup` | Самовывоз | Oʻzim olib ketaman |
| `checkout.delivery.streetLabel` | Улица, дом, квартира * | Koʻcha, uy, xonadon * |
| `checkout.delivery.streetPlaceholder` | ул. Навои 15, кв. 3 | Navoiy koʻchasi 15, xonadon 3 |
| `checkout.delivery.cityLabel` | Город * | Shahar * |
| `checkout.delivery.cityPlaceholder` | Ташкент | Toshkent |
| `checkout.delivery.pickupTitle` | Адрес уточните у продавца | Manzilni sotuvchidan aniqlang |
| `checkout.delivery.pickupHint` | Свяжитесь через Telegram для согласования | Kelishish uchun Telegram orqali murojaat qiling |
| `checkout.payment.cashLabel` | Наличные курьеру | Kuryerga naqd |
| `checkout.payment.cashSub` | оплата при получении | qabul qilishda toʻlov |
| `checkout.payment.cardLabel` | Картой курьеру | Kuryerga karta bilan |
| `checkout.payment.cardSub` | UzCard / Humo POS-терминал | UzCard / Humo POS-terminal |
| `checkout.payment.onlineLabel` | Online | Online |
| `checkout.payment.onlineSub` | Payme / Click | Payme / Click |
| `checkout.payment.comingSoon` | Скоро | Tez orada |
| `checkout.commentLabel` | Комментарий курьеру (необязательно) | Kuryerga izoh (ixtiyoriy) |
| `checkout.commentPlaceholder` | Например: позвонить за 10 минут | Masalan: 10 daqiqa oldin qoʻngʻiroq qiling |
| `checkout.stockWarning` | Некоторые товары заканчиваются. Вернитесь в корзину и скорректируйте количество. | Baʼzi mahsulotlar tugayapti. Savatga qaytib miqdorni sozlang. |
| `checkout.orderSummaryLabel` | — Ваш заказ | — Buyurtmangiz |
| `checkout.submitting` | Оформляем... | Rasmiylashtirilmoqda... |
| `checkout.placeOrder` | Подтвердить заказ → | Buyurtmani tasdiqlash → |
| `checkout.placeOrderWithAmount` | Подтвердить заказ · {amount} сум | Buyurtmani tasdiqlash · {amount} soʻm |
| `checkout.legalPrefix` | Нажимая «Подтвердить», вы соглашаетесь с | «Tasdiqlash» tugmasini bosib, siz |
| `checkout.legalOffer` | публичной офертой | ommaviy ofertaga |
| `checkout.legalAnd` | и | va |
| `checkout.legalPrivacy` | политикой | maxfiylik siyosatiga rozi boʻlasiz |
| `checkout.previewError` | Не удалось загрузить заказ | Buyurtmani yuklashda xato |
| `checkout.previewErrorDesc` | Проверьте соединение и попробуйте снова. Если корзина пуста — вернитесь и добавьте товары. | Aloqani tekshirib, qayta urinib koʻring. Savat boʻsh boʻlsa — qaytib mahsulot qoʻshing. |
| `checkout.previewLoading` | Загрузка… | Yuklanmoqda… |
| `checkout.toCart` | В корзину | Savatga |
| `checkout.submitError` | Не удалось оформить заказ. Попробуйте ещё раз. | Buyurtmani rasmiylashtirib boʻlmadi. Qayta urinib koʻring. |
| `wishlist.header` | — Избранное | — Sevimlilar |
| `wishlist.headerWithCount` | — Избранное · {count} | — Sevimlilar · {count} |
| `wishlist.error` | Не удалось загрузить избранное. Попробуйте обновить страницу. | Sevimlilarni yuklashda xato. Sahifani yangilashga urinib koʻring. |
| `wishlist.empty.label` | — Пока пусто | — Hozircha boʻsh |
| `wishlist.empty.title` | Избранное пустое | Sevimlilar boʻsh |
| `wishlist.empty.hint` | Нажимайте на сердечко на карточке товара — товар появится здесь. | Mahsulot kartasidagi yurakchani bosing — mahsulot bu yerda paydo boʻladi. |
| `wishlist.empty.toStores` | К магазинам | Doʻkonlarga oʻtish |
| `wishlist.loginTitle` | Войдите чтобы видеть избранное | Sevimlilarni koʻrish uchun kiring |
| `wishlist.loginSubtitle` | Подтвердите номер телефона — после этого сможете сохранять товары и видеть их здесь. | Telefon raqamingizni tasdiqlang — shundan soʻng mahsulotlarni saqlash va bu yerda koʻrish mumkin. |
| `wishlist.removeLabel` | Убрать из избранного | Sevimlilardan olib tashlash |
| `wishlist.outOfStock` | Нет в наличии | Mavjud emas |
| `nav.store` | Магазин | Doʻkon |
| `nav.cart` | Корзина | Savat |
| `nav.chats` | Чаты | Chatlar |
| `nav.orders` | Заказы | Buyurtmalar |
| `nav.profile` | Профиль | Profil |
| `nav.unreadBadge` | {count} непрочитанных | {count} ta oʻqilmagan |
| `header.stores` | Магазины | Doʻkonlar |
| `header.products` | Товары | Mahsulotlar |
| `header.chats` | Чаты | Chatlar |
| `header.orders` | Заказы | Buyurtmalar |
| `header.wishlist` | Избранное | Sevimlilar |
| `header.cart` | Корзина | Savat |
| `header.notifications` | Уведомления | Bildirishnomalar |
| `header.profile` | Профиль | Profil |
| `search.placeholder` | Поиск магазинов и товаров... | Doʻkonlar va mahsulotlarni qidiring... |
| `search.ariaLabel` | Поиск | Qidiruv |
| `search.minLen` | Введите минимум {n} символа | Kamida {n} ta belgi kiriting |
| `search.searching` | Ищем… | Qidirmoqda… |
| `search.noResults` | Ничего не нашли по «{query}» | «{query}» boʻyicha hech narsa topilmadi |
| `search.storesSection` | — Магазины · {count} | — Doʻkonlar · {count} |
| `search.productsSection` | — Товары · {count} | — Mahsulotlar · {count} |
| `auth.phoneFallbackSubtitle` | Введите номер телефона для входа | Kirish uchun telefon raqamingizni kiriting |
| `auth.codeSentTo` | Код отправлен в Telegram на {phone} | Kod Telegramga {phone} raqamiga yuborildi |
| `auth.sendError` | Не удалось отправить код. Попробуйте ещё раз. | Kodni yuborib boʻlmadi. Qayta urinib koʻring. |
| `auth.wrongCode` | Неверный код. Попробуйте ещё раз. | Notoʻgʻri kod. Qayta urinib koʻring. |
| `auth.sending` | Отправка... | Yuborilmoqda... |
| `auth.getCode` | Получить код | Kodni olish |
| `auth.verifying` | Проверка... | Tekshirilmoqda... |
| `auth.signIn` | Войти | Kirish |
| `auth.changePhone` | Изменить номер | Raqamni oʻzgartirish |
| `auth.phoneAriaLabel` | Телефон | Telefon |
| `theme.enableLight` | Включить светлую тему | Yorugʻ mavzuni yoqish |
| `theme.enableDark` | Включить тёмную тему | Qorongʻu mavzuni yoqish |
| `theme.light` | Светлая | Yorugʻ |
| `theme.dark` | Тёмная | Qorongʻu |
| `theme.system` | Как в системе | Tizim sozlamasi |
| `emoji.ariaLabel` | Эмодзи | Emoji |
| `emoji.cat.smiles` | Смайлы | Tabassum |
| `emoji.cat.gestures` | Жесты | Imo-ishoralar |
| `emoji.cat.hearts` | Сердца | Yuraklar |
| `emoji.cat.animals` | Животные | Hayvonlar |
| `emoji.cat.food` | Еда | Oziq-ovqat |
| `emoji.cat.money` | Деньги | Pul |
| `emoji.cat.objects` | Объекты | Buyumlar |
| `emoji.cat.symbols` | Символы | Belgilar |
| `catalog.backToHome` | ← На главную | ← Bosh sahifaga |
| `catalog.products.title` | Товары | Mahsulotlar |
| `catalog.products.loading` | Загружаем… | Yuklanmoqda… |
| `catalog.products.countUz` | {count} ta mahsulot | {count} ta mahsulot |
| `catalog.products.loadError` | Не удалось загрузить товары | Mahsulotlarni yuklashda xato |
| `catalog.products.loadErrorDesc` | Проверьте соединение и попробуйте снова | Ulanishni tekshirib, qayta urinib koʻring |
| `catalog.products.emptyCategory` | В этой категории пока нет товаров | Bu kategoriyada hozircha mahsulot yoʻq |
| `catalog.products.empty` | Товаров пока нет | Hozircha mahsulotlar yoʻq |
| `catalog.toHome` | На главную | Bosh sahifaga |
| `catalog.stores.title` | Магазины Узбекистана | Oʻzbekiston doʻkonlari |
| `catalog.stores.loading` | Загружаем… | Yuklanmoqda… |
| `catalog.stores.countUz` | {count} ta doʻkon | {count} ta doʻkon |
| `catalog.stores.loadError` | Не удалось загрузить магазины | Doʻkonlarni yuklashda xato |
| `catalog.stores.loadErrorDesc` | Проверьте соединение и попробуйте снова | Ulanishni tekshirib, qayta urinib koʻring |
| `catalog.stores.emptyFilters` | По фильтрам ничего не нашлось | Filtrlar boʻyicha hech narsa topilmadi |
| `catalog.stores.emptyFiltersDesc` | Сбросьте фильтры или вернитесь на главную | Filtrlarni tozalab yoki bosh sahifaga qayting |
| `legal.backToHome` | На главную | Bosh sahifaga |
| `legal.effectiveDate` | Вступает в силу | Kuchga kiradi |
| `legal.offer.title` | Публичная оферта | Ommaviy oferta |
| `legal.offer.effectiveDate` | 11 мая 2026 г. | 2026-yil 11-may |
| `legal.offer.s1.heading` | 1. Предмет оферты | 1. Oferta predmeti |
| `legal.offer.s1.p1` | Настоящий документ является публичной офертой (далее — «Оферта») платформы maxsavdo (далее — «Платформа») и определяет условия предоставления Платформой услуг по информационному и техническому обеспечению взаимодействия Покупателей и Продавцов товаров на территории Республики Узбекистан. | Ushbu hujjat maxsavdo platformasining (bundan keyin — «Platforma») ommaviy ofertasi (bundan keyin — «Oferta») boʻlib, Oʻzbekiston Respublikasi hududida Xaridorlar va Sotuvchilar oʻrtasidagi munosabatlarni axborot va texnik jihatdan taʼminlash boʻyicha xizmatlar koʻrsatish shartlarini belgilaydi. |
| `legal.offer.s2.heading` | 2. Акцепт оферты | 2. Ofertani qabul qilish |
| `legal.offer.s2.p1` | Акцептом настоящей Оферты является совершение Пользователем любого из следующих действий: | Foydalanuvchi quyidagi harakatlardan birini bajargan taqdirda Oferta qabul qilingan hisoblanadi: |
| `legal.offer.s2.li1` | регистрация в качестве Продавца и создание магазина; | Sotuvchi sifatida roʻyxatdan oʻtish va doʻkon ochish; |
| `legal.offer.s2.li2` | оформление первого заказа в качестве Покупателя; | Xaridor sifatida birinchi buyurtmani rasmiylashtirish; |
| `legal.offer.s2.li3` | подтверждение номера телефона через одноразовый код (OTP). | Telegram orqali bir martalik kod (OTP) yordamida telefon raqamini tasdiqlash. |
| `legal.offer.s3.heading` | 3. Стороны сделки купли-продажи | 3. Oldi-sotdi bitimining tomonlari |
| `legal.offer.s3.p1` | Договор купли-продажи товара заключается напрямую между Покупателем и Продавцом. Платформа выступает информационным посредником и не является стороной указанного договора, если иное не указано прямо в карточке товара или в отдельных соглашениях. | Tovar oldi-sotdi shartnomasi Xaridor va Sotuvchi oʻrtasida bevosita tuziladi. Platforma axborot vositachisi sifatida ishlaydi va mazkur shartnomaning tomoni hisoblanmaydi, agar tovar kartochkasida yoki alohida kelishuvlarda boshqacha koʻrsatilmagan boʻlsa. |
| `legal.offer.s4.heading` | 4. Стоимость услуг | 4. Xizmatlar narxi |
| `legal.offer.s4.p1` | Использование Платформы для Покупателей является бесплатным. Условия использования Платформы для Продавцов определяются отдельным соглашением (тарифным планом), размещаемым в личном кабинете продавца. | Xaridorlar uchun Platformadan foydalanish bepul. Sotuvchilar uchun foydalanish shartlari alohida kelishuv (tarif rejasi) bilan belgilanadi va sotuvchining shaxsiy kabinetida joylashtiriladi. |
| `legal.offer.s5.heading` | 5. Порядок оформления заказа | 5. Buyurtma rasmiylashtirish tartibi |
| `legal.offer.s5.li1` | Покупатель выбирает товары и оформляет заказ через Платформу; | Xaridor tovarlarni tanlaydi va Platforma orqali buyurtma beradi; |
| `legal.offer.s5.li2` | Продавец подтверждает заказ и согласовывает с Покупателем условия доставки и оплаты; | Sotuvchi buyurtmani tasdiqlaydi va Xaridor bilan yetkazib berish va toʻlov shartlarini kelishadi; |
| `legal.offer.s5.li3` | Платформа фиксирует ход выполнения заказа и направляет уведомления через Telegram. | Platforma buyurtmaning bajarilishini kuzatib boradi va Telegram orqali bildirishnomalar yuboradi. |
| `legal.offer.s6.heading` | 6. Оплата | 6. Toʻlov |
| `legal.offer.s6.p1` | Оплата заказа производится способом, выбранным Покупателем при оформлении: наличными при получении, переводом или иным способом, поддерживаемым Продавцом. Платежи через онлайн-сервисы проходят через аккредитованных провайдеров и регулируются их собственными условиями. | Buyurtma uchun toʻlov Xaridor tomonidan rasmiylashtirish chogʻida tanlangan usul bilan amalga oshiriladi: yetkazib berishda naqd pul, oʻtkazma yoki Sotuvchi qoʻllab-quvvatlaydigan boshqa usul. Onlayn xizmatlar orqali toʻlovlar akkreditatsiya qilingan provayderlar vositasida oʻtadi va ularning oʻz shartlari bilan tartibga solinadi. |
| `legal.offer.s7.heading` | 7. Срок действия и расторжение | 7. Amal qilish muddati va bekor qilish |
| `legal.offer.s7.p1` | Оферта действует бессрочно до её отзыва Платформой. Пользователь вправе прекратить использование сервиса в любой момент, удалив свой аккаунт. | Oferta Platforma tomonidan qaytarib olinmaguncha muddatsiz amal qiladi. Foydalanuvchi istalgan vaqtda hisobini oʻchirib, xizmatdan foydalanishni toʻxtatishi mumkin. |
| `legal.offer.s8.heading` | 8. Применимое право | 8. Qoʻllaniladigan qonunchilik |
| `legal.offer.s8.p1` | К отношениям сторон применяется законодательство Республики Узбекистан. Споры разрешаются путём переговоров; в случае невозможности — в судебном порядке по месту регистрации Платформы. | Tomonlar oʻrtasidagi munosabatlarga Oʻzbekiston Respublikasi qonunchiligi qoʻllaniladi. Nizolar muzokaralar yoʻli bilan hal etiladi; imkoniyat boʻlmaganda — Platforma roʻyxatdan oʻtgan joyning sudida koʻrib chiqiladi. |
| `legal.offer.s9.heading` | 9. Реквизиты Платформы | 9. Platforma rekvizitlari |
| `legal.offer.s9.p1` | Реквизиты юридического лица, оператора платформы maxsavdo, будут размещены после завершения регистрационных процедур. Для запросов и претензий: legal@maxsavdo.uz. | maxsavdo platformasi operatorining yuridik shaxs rekvizitlari roʻyxatdan oʻtish tartib-taomillari yakunlangandan soʻng joylashtiriladi. Soʻrov va shikoyatlar uchun: legal@maxsavdo.uz. |
| `legal.privacy.title` | Политика конфиденциальности | Maxfiylik siyosati |
| `legal.privacy.effectiveDate` | 11 мая 2026 г. | 2026-yil 11-may |
| `legal.privacy.s1.heading` | 1. Какие данные мы собираем | 1. Biz qanday maʼlumotlarni yigʻamiz |
| `legal.privacy.s1.p1` | Платформа maxsavdo обрабатывает следующие категории данных: | maxsavdo platformasi quyidagi maʼlumotlar toifalarini qayta ishlaydi: |
| `legal.privacy.s1.li1` | номер телефона и Telegram-идентификатор (для входа и связи); | telefon raqami va Telegram identifikatori (kirish va muloqot uchun); |
| `legal.privacy.s1.li2` | имя получателя и адрес доставки (для оформления заказа); | oluvchining ismi va yetkazib berish manzili (buyurtma uchun); |
| `legal.privacy.s1.li3` | состав заказов и история покупок (для работы сервиса и поддержки); | buyurtmalar tarkibi va xaridlar tarixi (xizmat va qoʻllab-quvvatlash uchun); |
| `legal.privacy.s1.li4` | технические данные: IP-адрес, тип устройства, cookies (для безопасности и аналитики). | texnik maʼlumotlar: IP-manzil, qurilma turi, cookies (xavfsizlik va tahlil uchun). |
| `legal.privacy.s2.heading` | 2. Цели обработки | 2. Qayta ishlash maqsadlari |
| `legal.privacy.s2.li1` | идентификация пользователя через OTP; | OTP orqali foydalanuvchini identifikatsiya qilish; |
| `legal.privacy.s2.li2` | оформление и доставка заказов; | buyurtmalarni rasmiylashtirish va yetkazib berish; |
| `legal.privacy.s2.li3` | связь между Продавцом и Покупателем по поводу заказа; | Sotuvchi va Xaridor oʻrtasida buyurtma yuzasidan muloqot; |
| `legal.privacy.s2.li4` | рассылка уведомлений о статусе заказа через Telegram; | Telegram orqali buyurtma holati haqida bildirishnomalar yuborish; |
| `legal.privacy.s2.li5` | предотвращение мошенничества и злоупотреблений. | firibgarlik va suisteʼmolliklarning oldini olish. |
| `legal.privacy.s3.heading` | 3. Передача данных третьим лицам | 3. Uchinchi shaxslarga maʼlumot uzatish |
| `legal.privacy.s3.p1` | Данные Покупателя передаются Продавцу в объёме, необходимом для исполнения заказа (имя, телефон, адрес доставки, состав заказа). Платежные данные обрабатываются платёжными провайдерами (Click, Payme и др.) согласно их политикам конфиденциальности. В иных случаях передача данных третьим лицам осуществляется только по требованию уполномоченных органов в соответствии с законодательством Республики Узбекистан. | Xaridor maʼlumotlari Sotuvchiga buyurtmani bajarish uchun zarur hajmda (ism, telefon, yetkazib berish manzili, buyurtma tarkibi) uzatiladi. Toʻlov maʼlumotlari toʻlov provayderlari (Click, Payme va boshq.) tomonidan ularning maxfiylik siyosatiga muvofiq qayta ishlanadi. Boshqa hollarda maʼlumotlar uchinchi shaxslarga faqat Oʻzbekiston Respublikasi qonunchiligi asosida vakolatli organlarning talabiga binoan uzatiladi. |
| `legal.privacy.s4.heading` | 4. Сроки хранения | 4. Saqlash muddatlari |
| `legal.privacy.s4.p1` | Данные заказов хранятся в течение срока, установленного законодательством для документов первичного учёта. Технические логи хранятся до 90 дней. Вы можете запросить удаление учётной записи, обратившись в поддержку. | Buyurtmalar maʼlumotlari birlamchi hujjatlar uchun qonunchilikda belgilangan muddat davomida saqlanadi. Texnik jurnallar 90 kungacha saqlanadi. Hisobingizni oʻchirishni qoʻllab-quvvatlash xizmatiga murojaat qilib soʻrashingiz mumkin. |
| `legal.privacy.s5.heading` | 5. Безопасность | 5. Xavfsizlik |
| `legal.privacy.s5.p1` | Передача данных между браузером и серверами Платформы осуществляется по защищённому соединению (HTTPS, TLS). Доступ к персональным данным внутри компании ограничен сотрудниками, непосредственно работающими с заказами и поддержкой. | Brauzer va Platforma serverlari oʻrtasida maʼlumotlar himoyalangan ulanish (HTTPS, TLS) orqali uzatiladi. Kompaniya ichida shaxsiy maʼlumotlarga kirish faqat buyurtmalar va qoʻllab-quvvatlash bilan bevosita shugʻullanadigan xodimlar uchun cheklangan. |
| `legal.privacy.s6.heading` | 6. Права пользователя | 6. Foydalanuvchi huquqlari |
| `legal.privacy.s6.p1` | Вы вправе запросить доступ к своим данным, их исправление или удаление, направив запрос на privacy@maxsavdo.uz. | Siz maʼlumotlaringizga kirish, ularni toʻgʻrilash yoki oʻchirish huquqiga egasiz — buning uchun privacy@maxsavdo.uz manziliga murojaat qiling. |
| `legal.privacy.s7.heading` | 7. Cookies | 7. Cookies |
| `legal.privacy.s7.p1` | Платформа использует технические cookies для авторизации и сохранения корзины. Аналитические cookies не передают идентифицирующую информацию третьим лицам без вашего согласия. | Platforma avtorizatsiya va savatni saqlash uchun texnik cookies foydalanadi. Tahliliy cookies sizning roziligingizisiz identifikatsiyalovchi maʼlumotlarni uchinchi shaxslarga uzatmaydi. |
| `legal.privacy.s8.heading` | 8. Контакты | 8. Aloqa |
| `legal.privacy.s8.p1` | По вопросам обработки персональных данных: privacy@maxsavdo.uz. | Shaxsiy maʼlumotlarni qayta ishlash masalalari boʻyicha: privacy@maxsavdo.uz. |
| `legal.terms.title` | Условия использования | Foydalanish shartlari |
| `legal.terms.effectiveDate` | 11 мая 2026 г. | 2026-yil 11-may |
| `legal.terms.s1.heading` | 1. Общие положения | 1. Umumiy qoidalar |
| `legal.terms.s1.p1` | Настоящие Условия использования регулируют отношения между платформой maxsavdo (далее — «Платформа») и пользователями, размещающими товары или совершающими покупки через сайт maxsavdo.uz и связанные Telegram-боты. Используя Платформу, вы соглашаетесь с настоящими Условиями. | Ushbu Foydalanish shartlari maxsavdo platformasi (bundan keyin — «Platforma») va maxsavdo.uz sayti hamda bogʻliq Telegram-botlar orqali tovar joylashtiradigan yoki xarid qiladigan foydalanuvchilar oʻrtasidagi munosabatlarni tartibga soladi. Platformadan foydalanish orqali siz ushbu Shartlarga roziligingizni bildirasiz. |
| `legal.terms.s2.heading` | 2. Регистрация и аккаунт | 2. Roʻyxatdan oʻtish va hisob |
| `legal.terms.s2.p1` | Покупатели могут совершать заказы без регистрации, подтверждая номер телефона через одноразовый код (OTP), отправляемый Telegram-ботом. Продавцы проходят процедуру верификации с предоставлением документов согласно законодательству Республики Узбекистан. | Xaridorlar Telegram-bot yuboradigan bir martalik kod (OTP) orqali telefon raqamini tasdiqlab, roʻyxatdan oʻtmasdan buyurtma bera oladi. Sotuvchilar Oʻzbekiston Respublikasi qonunchiligiga muvofiq hujjatlar taqdim etgan holda tekshiruv tartib-taomilini oʻtadilar. |
| `legal.terms.s2.p2` | Пользователь обязан предоставлять достоверную информацию и несёт ответственность за сохранность учётных данных и доступа к Telegram-аккаунту, привязанному к профилю. | Foydalanuvchi haqqoniy maʼlumot taqdim etishga majbur boʻlib, profilga bogʻlangan Telegram-hisobi va kirish maʼlumotlarini saqlab qolish uchun oʻzi masʼul hisoblanadi. |
| `legal.terms.s3.heading` | 3. Размещение товаров | 3. Tovarlarni joylashtirish |
| `legal.terms.s3.p1` | Продавец самостоятельно определяет ассортимент, цены и условия доставки. Запрещены к размещению: | Sotuvchi assortiment, narxlar va yetkazib berish shartlarini mustaqil belgilaydi. Joylashtirish taqiqlanadi: |
| `legal.terms.s3.li1` | товары, оборот которых ограничен или запрещён законодательством Республики Узбекистан; | muomalasi Oʻzbekiston Respublikasi qonunchiligi bilan cheklangan yoki taqiqlangan tovarlar; |
| `legal.terms.s3.li2` | контрафактная продукция, поддельные товары и услуги; | kontrafakt mahsulotlar, soxta tovarlar va xizmatlar; |
| `legal.terms.s3.li3` | товары с недостоверным описанием, вводящие покупателя в заблуждение; | xaridorni yanglishtiradigan notoʻgʻri tavsifli tovarlar; |
| `legal.terms.s3.li4` | оружие, наркотические и психотропные вещества, объекты культурного наследия. | qurol, narkotik va psixotrop moddalar, madaniy meros obʼektlari. |
| `legal.terms.s4.heading` | 4. Заказы и расчёты | 4. Buyurtmalar va hisob-kitoblar |
| `legal.terms.s4.p1` | Договор купли-продажи заключается между Покупателем и Продавцом напрямую. Платформа не является стороной сделки и не несёт ответственности за качество товара, сроки доставки и иные обязательства Продавца перед Покупателем, если иное прямо не указано в отдельных соглашениях. | Oldi-sotdi shartnomasi Xaridor va Sotuvchi oʻrtasida bevosita tuziladi. Platforma bitim tomoni hisoblanmaydi va alohida kelishuvlarda boshqacha koʻrsatilmagan boʻlsa, tovar sifati, yetkazib berish muddatlari va Sotuvchining Xaridor oldidagi boshqa majburiyatlari uchun javobgar emas. |
| `legal.terms.s5.heading` | 5. Ответственность | 5. Javobgarlik |
| `legal.terms.s5.p1` | Платформа предоставляется «как есть». Мы стремимся обеспечить непрерывную работу сервиса, но не гарантируем отсутствие технических сбоев и не несём ответственности за упущенную выгоду пользователей. | Platforma «boricha» taqdim etiladi. Biz xizmatning uzluksiz ishlashini taʼminlashga intilamiz, ammo texnik uzilishlar boʻlmasligini kafolatlamaymiz va foydalanuvchilarning boy berilgan foydasiga javob bermaymiz. |
| `legal.terms.s6.heading` | 6. Изменение условий | 6. Shartlarning oʻzgarishi |
| `legal.terms.s6.p1` | Платформа вправе обновлять настоящие Условия. Актуальная версия размещается по адресу maxsavdo.uz/terms. Продолжение использования сервиса после публикации изменений означает согласие с новой редакцией. | Platforma ushbu Shartlarni yangilash huquqiga ega. Joriy versiya maxsavdo.uz/terms manzilida joylashtiriladi. Oʻzgartirishlar eʼlon qilingandan keyin xizmatdan foydalanishni davom ettirish yangi tahrirga rozilikni bildiradi. |
| `legal.terms.s7.heading` | 7. Контакты | 7. Aloqa |
| `legal.terms.s7.p1` | Вопросы и обращения: support@maxsavdo.uz, Telegram-бот @savdo_builderBOT. | Savol va murojaatlar: support@maxsavdo.uz, Telegram-bot @savdo_builderBOT. |
| `legal.refund.title` | Возврат и обмен товаров | Tovarni qaytarish va almashtirish |
| `legal.refund.effectiveDate` | 11 мая 2026 г. | 2026-yil 11-may |
| `legal.refund.s1.heading` | 1. Право на возврат | 1. Qaytarish huquqi |
| `legal.refund.s1.p1` | Покупатель имеет право отказаться от товара надлежащего качества в течение 14 (четырнадцати) календарных дней с момента получения, если товар не был в употреблении, сохранены его товарный вид, потребительские свойства, упаковка и документ, подтверждающий покупку. Право возврата не распространяется на товары, указанные в действующем законодательстве Республики Узбекистан, в том числе товары личной гигиены, парфюмерно-косметические товары, бельё, носки, изделия из драгоценных металлов и др. | Xaridor toʻgʻri sifatli tovardan olgan kunidan boshlab 14 (oʻn toʻrt) kalendar kun ichida voz kechish huquqiga ega, agar tovar ishlatilmagan boʻlsa, uning tovar koʻrinishi, isteʼmol xossalari, qadogʻi va xaridni tasdiqlovchi hujjat saqlangan boʻlsa. Qaytarish huquqi Oʻzbekiston Respublikasining amaldagi qonunchiligida koʻrsatilgan tovarlar (shaxsiy gigiyena mollari, parfyumeriya-kosmetika tovarlari, ichki kiyim-bosh, paypoq, qimmatbaho metallardan yasalgan buyumlar va boshq.) ga tatbiq etilmaydi. |
| `legal.refund.s2.heading` | 2. Возврат товара ненадлежащего качества | 2. Sifatsiz tovarni qaytarish |
| `legal.refund.s2.p1` | При обнаружении в товаре недостатков Покупатель вправе в течение гарантийного срока (а при его отсутствии — в течение 2 лет с момента получения) потребовать по своему выбору: | Tovarda nuqsonlar aniqlanganda Xaridor kafolat muddati ichida (kafolat muddati boʻlmasa — olgan kunidan boshlab 2 yil ichida) oʻz tanloviga koʻra quyidagilarni talab qilishga haqli: |
| `legal.refund.s2.li1` | замены товара на аналогичный или иной с пересчётом цены; | tovarni oʻxshash yoki boshqasiga narxini qayta hisoblagan holda almashtirish; |
| `legal.refund.s2.li2` | уменьшения цены товара; | tovar narxini kamaytirish; |
| `legal.refund.s2.li3` | безвозмездного устранения недостатков; | nuqsonlarni bepul bartaraf etish; |
| `legal.refund.s2.li4` | возврата уплаченной суммы и расторжения договора. | toʻlangan summani qaytarish va shartnomani bekor qilish. |
| `legal.refund.s3.heading` | 3. Порядок возврата | 3. Qaytarish tartibi |
| `legal.refund.s3.p1` | Для возврата товара необходимо: | Tovarni qaytarish uchun quyidagilar zarur: |
| `legal.refund.s3.li1` | связаться с Продавцом через чат на Платформе или указанный им контакт; | Platforma chat yoki Sotuvchi koʻrsatgan aloqa orqali u bilan bogʻlanish; |
| `legal.refund.s3.li2` | оформить заявление с указанием причины возврата; | qaytarish sababini koʻrsatgan holda ariza rasmiylashtirish; |
| `legal.refund.s3.li3` | передать товар Продавцу способом, согласованным с ним. | tovarni Sotuvchi bilan kelishilgan usulda topshirish. |
| `legal.refund.s4.heading` | 4. Возврат денежных средств | 4. Pul mablagʻlarini qaytarish |
| `legal.refund.s4.p1` | Денежные средства возвращаются Покупателю тем же способом, которым была произведена оплата, в срок не более 10 (десяти) рабочих дней с момента получения товара Продавцом, если иной срок не установлен законодательством или соглашением сторон. | Pul mablagʻlari Xaridorga toʻlov amalga oshirilgan usulda, Sotuvchi tovarni olgandan boshlab 10 (oʻn) ish kuni ichida qaytariladi, agar qonunchilik yoki tomonlar kelishuvi bilan boshqa muddat belgilanmagan boʻlsa. |
| `legal.refund.s5.heading` | 5. Расходы на доставку при возврате | 5. Qaytarish chogʻidagi yetkazib berish xarajatlari |
| `legal.refund.s5.p1` | Расходы на возврат товара надлежащего качества несёт Покупатель. При возврате товара ненадлежащего качества расходы несёт Продавец. | Toʻgʻri sifatli tovarni qaytarish xarajatlarini Xaridor koʻtaradi. Sifatsiz tovarni qaytarish xarajatlarini Sotuvchi koʻtaradi. |
| `legal.refund.s6.heading` | 6. Роль Платформы | 6. Platforma roli |
| `legal.refund.s6.p1` | Платформа maxsavdo не является стороной договора купли-продажи и не осуществляет возврат денежных средств от своего имени. При возникновении спора между Покупателем и Продавцом Платформа может выступить посредником, но окончательное решение принимается сторонами или в судебном порядке. | maxsavdo platformasi oldi-sotdi shartnomasining tomoni emas va oʻz nomidan pul mablagʻlarini qaytarmaydi. Xaridor va Sotuvchi oʻrtasida nizo yuzaga kelganda Platforma vositachi vazifasini bajarishi mumkin, ammo yakuniy qaror tomonlar yoki sud tomonidan qabul qilinadi. |
| `legal.refund.s7.heading` | 7. Контакты для жалоб | 7. Shikoyat uchun aloqa |
| `legal.refund.s7.p1` | Если Продавец не отвечает на обращение или отказывает в законном возврате, направьте жалобу в поддержку Платформы: support@maxsavdo.uz. | Agar Sotuvchi murojaatingizga javob bermasa yoki qonuniy qaytarishdan bosh tortsa, Platforma qoʻllab-quvvatlash xizmatiga shikoyat yuboring: support@maxsavdo.uz. |
| `legal.help.title` | Помощь и частые вопросы | Yordam va tez-tez beriladigan savollar |
| `legal.help.effectiveDate` | 21 мая 2026 г. | 21-may, 2026-yil |
| `legal.help.intro` | Короткие ответы на самые частые вопросы. Если ответа на ваш вопрос здесь нет — напишите нам на support@maxsavdo.uz, мы поможем. | Eng koʻp beriladigan savollarga qisqa javoblar. Agar savolingizga javob bu yerda boʻlmasa — support@maxsavdo.uz manziliga yozing, yordam beramiz. |
| `legal.help.s1.q` | Как сделать заказ? | Buyurtma qanday qilinadi? |
| `legal.help.s1.a` | Откройте магазин по ссылке maxsavdo.uz/<магазин> или из чата в Telegram. Добавьте товары в корзину, нажмите «Оформить заказ», укажите имя, телефон и адрес доставки. Подтвердите номер кодом из бота @savdo_builderBOT. Оплата — наличными при получении или переводом продавцу. | Magazinni maxsavdo.uz/<magazin> manzili boʻyicha yoki Telegram-chatdan oching. Mahsulotlarni savatga qoʻshing, "Buyurtma berish" tugmasini bosing, ism, telefon va yetkazib berish manzilini koʻrsating. Raqamingizni @savdo_builderBOT botidan kelgan kod bilan tasdiqlang. Toʻlov — qabul qilishda naqd pul yoki sotuvchiga oʻtkazma. |
| `legal.help.s2.q` | Какие способы оплаты доступны? | Qanday toʻlov usullari mavjud? |
| `legal.help.s2.a` | Сейчас доступна оплата наличными при получении и переводом продавцу по согласованию (на его Click/Payme-кошелёк). Полная онлайн-оплата картой и через Click/Payme прямо на платформе появится позднее. | Hozir naqd toʻlov (mahsulotni qoʻlga olishda) va sotuvchining Click/Payme hisobiga oʻtkazma orqali toʻlov mavjud. Karta bilan toʻliq onlayn toʻlov va Click/Payme orqali platforma ichida toʻgʻridan-toʻgʻri toʻlov keyinroq paydo boʻladi. |
| `legal.help.s3.q` | Как происходит доставка? | Yetkazib berish qanday amalga oshiriladi? |
| `legal.help.s3.a` | Условия определяет сам продавец и указывает в карточке магазина: курьер, самовывоз или другая логистика. При оформлении заказа вы выбираете режим «Доставка» или «Самовывоз»; стоимость, если есть, отображается в корзине до подтверждения. | Shartlarni sotuvchining oʻzi belgilaydi va magazin kartasida koʻrsatadi: kuryer, oʻzi olib ketish yoki boshqa logistika. Buyurtma berishda siz "Yetkazib berish" yoki "Oʻzi olib ketish" rejimini tanlaysiz; narxi, agar bor boʻlsa, tasdiqlashdan oldin savatda koʻrsatiladi. |
| `legal.help.s4.q` | Что делать, если товар не пришёл или не подходит? | Agar mahsulot kelmasa yoki mos kelmasa, nima qilish kerak? |
| `legal.help.s4.a` | Сначала свяжитесь с продавцом через чат в карточке заказа («Мои заказы» → конкретный заказ). Большинство вопросов решается напрямую. Полные правила — на странице «Возврат и обмен». Если продавец не отвечает или отказывает в законном возврате, напишите нам: support@maxsavdo.uz. | Avval buyurtma kartasidagi chat orqali sotuvchi bilan bogʻlaning ("Mening buyurtmalarim" → aniq buyurtma). Koʻpchilik savollar shu yoʻl bilan hal boʻladi. Toʻliq qoidalar — "Qaytarish va almashtirish" sahifasida. Agar sotuvchi javob bermasa yoki qonuniy qaytarishdan bosh tortsa — bizga yozing: support@maxsavdo.uz. |
| `legal.help.s5.q` | Как связаться с продавцом? | Sotuvchi bilan qanday bogʻlanish mumkin? |
| `legal.help.s5.a` | Из карточки товара или магазина нажмите «Чат с продавцом» — откроется встроенный чат на платформе. После оформления заказа можно обсудить детали по конкретному заказу из раздела «Мои заказы». Чат работает в реальном времени. | Mahsulot yoki magazin kartasidan "Sotuvchi bilan chat" tugmasini bosing — platforma ichidagi chat ochiladi. Buyurtma berilgandan keyin "Mening buyurtmalarim" boʻlimida aniq buyurtma boʻyicha tafsilotlarni muhokama qilishingiz mumkin. Chat real vaqt rejimida ishlaydi. |
| `legal.help.s6.q` | Как стать продавцом? | Qanday qilib sotuvchi boʻlish mumkin? |
| `legal.help.s6.a` | В разделе «Профиль» нажмите «Стать продавцом» — мы перенесём вас в Telegram-бот @savdo_builderBOT, где за несколько минут вы заведёте магазин, добавите первые товары и получите ссылку maxsavdo.uz/<ваш-магазин>. Регистрация бесплатная, комиссий и подписки на этапе MVP нет. | "Profil" boʻlimida "Sotuvchi boʻlish" tugmasini bosing — sizni @savdo_builderBOT botiga olib oʻtamiz, u yerda bir necha daqiqada oʻz magazinni ochasiz, dastlabki mahsulotlarni qoʻshasiz va maxsavdo.uz/<sizning-magazin> havolasini olasiz. Roʻyxatdan oʻtish bepul, MVP bosqichida komissiya yoki obuna toʻlovi yoʻq. |
| `legal.help.s7.q` | Что делать, если код подтверждения не приходит? | Agar tasdiqlash kodi kelmasa, nima qilish kerak? |
| `legal.help.s7.a` | OTP-код отправляется через нашего Telegram-бота @savdo_builderBOT. Убедитесь, что вы открывали бота хотя бы один раз (нажали «Старт»); номер телефона указан в формате +998 XX XXX XX XX; Telegram открыт и есть интернет. Если код всё равно не приходит — напишите в поддержку support@maxsavdo.uz. | OTP-kod @savdo_builderBOT Telegram bot orqali yuboriladi. Quyidagilarni tekshiring: botni kamida bir marta ochgan boʻlsangiz ("Start" bosgan); telefon raqamingiz +998 XX XXX XX XX formatida koʻrsatilgan; Telegram ochiq va internet bor. Agar kod baribir kelmasa — support@maxsavdo.uz ga yozing. |
| `legal.help.s8.q` | Как изменить язык интерфейса? | Interfeys tilini qanday oʻzgartirish mumkin? |
| `legal.help.s8.a` | В разделе «Профиль» переключите язык RU/UZ. Изменение применяется сразу и сохраняется на этом устройстве. | "Profil" boʻlimida tilni RU/UZ ga almashtiring. Oʻzgarish darhol qoʻllaniladi va shu qurilmada saqlanadi. |
| `profile.menu.help` | Помощь | Yordam |
| `profile.menu.helpSub` | Частые вопросы | Tez-tez beriladigan savollar |
| `profile.menu.support` | Поддержка | Qoʻllab-quvvatlash |
| `profile.menu.supportSub` | Написать в Telegram | Telegramda yozish |

</details>

---

## web-seller

**Итого ключей:** 536 · 🔴 кириллица: **0** · ❌ нет uz: **0** · 🟡 = ru: **0** · 🟠 апостроф-вариативность: **0**

### ⚑ Строки с флагами (0) — смотреть первыми

_нет_

<details><summary>### Полный список (536) — для прогона на естественность</summary>

| Ключ | ru | uz |
|---|---|---|
| `common.save` | Сохранить | Saqlash |
| `common.cancel` | Отмена | Bekor qilish |
| `common.back` | Назад | Orqaga |
| `common.close` | Закрыть | Yopish |
| `common.delete` | Удалить | Oʻchirish |
| `common.edit` | Изменить | Tahrirlash |
| `common.loading` | Загрузка… | Yuklanmoqda… |
| `common.retry` | Повторить | Qayta urinish |
| `common.error` | Что-то пошло не так | Nimadir xato ketdi |
| `common.empty` | Ничего не найдено | Hech narsa topilmadi |
| `common.yesterday` | вчера | kecha |
| `settings.title` | Настройки | Sozlamalar |
| `settings.language` | Язык интерфейса | Interfeys tili |
| `auth.sellerPanel` | Панель продавца | Sotuvchi paneli |
| `auth.loginTitle` | Войти | Kirish |
| `auth.loginSubtitle` | Введите номер телефона — отправим код | Telefon raqamingizni kiriting — kod yuboramiz |
| `auth.phoneLabel` | Телефон | Telefon |
| `auth.sendingOtp` | Отправка... | Yuborilmoqda... |
| `auth.getCode` | Получить код | Kodni olish |
| `auth.enterCodeTitle` | Введите код | Kodni kiriting |
| `auth.codeSentToTelegram` | Код отправлен в Telegram-бот @savdo_builderBOT | Kod Telegram-bot @savdo_builderBOT ga yuborildi |
| `auth.telegramCodeLabel` | Код из Telegram | Telegram kodi |
| `auth.verifying` | Проверка... | Tekshirilmoqda... |
| `auth.loginButton` | Войти | Kirish |
| `auth.codeNotReceived` | Не пришёл код? | Kod kelmadimi? |
| `auth.resendCode` | Отправить снова | Qayta yuborish |
| `onboarding.stepStore` | Магазин | Doʻkon |
| `onboarding.stepContacts` | Контакты | Kontaktlar |
| `onboarding.stepDone` | Готово | Tayyor |
| `onboarding.createStoreTitle` | Создайте магазин | Doʻkon oching |
| `onboarding.createStoreSubtitle` | Придумайте название — покупатели увидят его первым | Nom oʻylab toping — xaridorlar avval uni koʻradi |
| `onboarding.storeNameLabel` | Название магазина | Doʻkon nomi |
| `onboarding.storeAddressLabel` | Адрес магазина | Doʻkon manzili |
| `onboarding.nextButton` | Далее → | Keyingi → |
| `onboarding.storeNameRequired` | Введите название магазина | Doʻkon nomini kiriting |
| `onboarding.minTwoChars` | Минимум 2 символа | Kamida 2 ta belgi |
| `onboarding.maxNameChars` | Максимум 255 символов | Koʻpi bilan 255 ta belgi |
| `onboarding.slugRequired` | Укажите адрес | Manzilni kiriting |
| `onboarding.slugPattern` | Только строчные буквы, цифры и дефис | Faqat kichik harflar, raqamlar va chiziqcha |
| `onboarding.maxSlugChars` | Максимум 60 символов | Koʻpi bilan 60 ta belgi |
| `onboarding.contactsTitle` | Контакты | Kontaktlar |
| `onboarding.contactsSubtitle` | Покупатели свяжутся с вами через Telegram | Xaridorlar siz bilan Telegram orqali bogʻlanadi |
| `onboarding.telegramLinkLabel` | Telegram-ссылка для покупателей | Xaridorlar uchun Telegram-havola |
| `onboarding.telegramLinkHint` | Ссылка на ваш канал, группу или личный чат | Kanal, guruh yoki shaxsiy chatga havola |
| `onboarding.cityLabel` | Город | Shahar |
| `onboarding.cityPlaceholder` | Ташкент | Toshkent |
| `onboarding.telegramUsernameLabel` | Telegram username | Telegram username |
| `onboarding.backButton` | ← Назад | ← Orqaga |
| `onboarding.creatingStore` | Создание... | Yaratilmoqda... |
| `onboarding.telegramUsernameRequired` | Введите Telegram username | Telegram username kiriting |
| `onboarding.telegramUsernamePattern` | Только буквы, цифры и _. От 3 до 32 символов | Faqat harflar, raqamlar va _. 3 dan 32 ta belgi |
| `onboarding.telegramLinkRequired` | Введите ссылку | Havolani kiriting |
| `onboarding.telegramLinkPattern` | Должна начинаться с https://t.me/ | https://t.me/ bilan boshlanishi kerak |
| `onboarding.cityRequired` | Укажите город | Shaharni kiriting |
| `onboarding.almostReadyTitle` | Почти готово! | Deyarli tayyor! |
| `onboarding.almostReadySubtitle` | Отправьте магазин {storeName} на проверку — после одобрения он станет доступен покупателям | {storeName} doʻkonini koʻrib chiqishga yuboring — tasdiqlangandan soʻng xaridorlarga koʻrinadi |
| `onboarding.checklistAccountCreated` | Аккаунт создан | Hisob yaratildi |
| `onboarding.checklistStoreConfigured` | Магазин настроен | Doʻkon sozlandi |
| `onboarding.checklistContactsAdded` | Контакты добавлены | Kontaktlar qoʻshildi |
| `onboarding.submitting` | Отправка... | Yuborilmoqda... |
| `onboarding.submitForReview` | Отправить на проверку | Koʻrib chiqishga yuborish |
| `onboarding.skipToDashboard` | Сделаю позже, перейти в дашборд | Keyinroq, boshqaruv paneliga oʻtish |
| `onboarding.errorApplySeller` | Не удалось оформить продавца. Попробуйте ещё раз. | Sotuvchini rasmiylashtirib boʻlmadi. Qayta urinib koʻring. |
| `onboarding.errorCreateStore` | Не удалось создать магазин. Попробуйте ещё раз. | Doʻkon yaratib boʻlmadi. Qayta urinib koʻring. |
| `onboarding.errorSubmitStore` | Не удалось отправить на проверку. | Yuborib boʻlmadi. |
| `onboarding.noStoreTitle` | У вас ещё нет магазина | Sizda hali doʻkon yoʻq |
| `onboarding.noStoreSubtitle` | Откройте свой магазин в maxsavdo — принимайте заказы прямо в Telegram, без сайта и без посредников. | maxsavdoda oʻz doʻkoningizni oching — buyurtmalarni toʻgʻridan-toʻgʻri Telegramda qabul qiling, sayt va vositachilarsiz. |
| `onboarding.openStore` | Открыть магазин | Doʻkon ochish |
| `onboarding.goShopping` | Перейти к покупкам | Xaridga oʻtish |
| `onboarding.logout` | Выйти из аккаунта | Hisobdan chiqish |
| `common.storeStatus.DRAFT` | Черновик | Qoralama |
| `common.storeStatus.PENDING_REVIEW` | На проверке | Tekshiruvda |
| `common.storeStatus.APPROVED` | Активен | Faol |
| `common.storeStatus.REJECTED` | Отклонён | Rad etildi |
| `common.storeStatus.SUSPENDED` | Приостановлен | Toʻxtatildi |
| `common.storeStatus.ARCHIVED` | Архивирован | Arxivlandi |
| `dashboard.greeting` | Добро пожаловать | Xush kelibsiz |
| `dashboard.storeLabel` | Магазин | Doʻkon |
| `dashboard.storeNotFound` | Магазин не найден | Doʻkon topilmadi |
| `dashboard.storeOnReview` | Магазин на проверке | Doʻkon tekshiruvda |
| `dashboard.addFirstProduct` | Добавьте первый товар | Birinchi mahsulotni qoʻshing |
| `dashboard.addProductCta` | Покупатели уже могут зайти в ваш магазин. Добавьте товары чтобы они появились в каталоге. | Xaridorlar doʻkoningizga kirishi mumkin. Katalogda koʻrinishi uchun mahsulot qoʻshing. |
| `dashboard.addProductCtaPending` | Пока ждём одобрения — добавьте свой первый товар. После одобрения он сразу будет доступен покупателям. | Tasdiqlash kutilmoqda — birinchi mahsulotingizni qoʻshing. Tasdiqlangandan soʻng darhol koʻrinadi. |
| `dashboard.addProductBtn` | Добавить товар | Mahsulot qoʻshish |
| `dashboard.totalOrders` | Всего заказов | Jami buyurtmalar |
| `dashboard.viewsMonth` | Просмотров за 30 дней | 30 kunlik koʻrishlar |
| `dashboard.copyLink` | Нажми чтобы скопировать | Nusxa olish uchun bosing |
| `dashboard.copied` | Скопировано | Nusxalandi |
| `dashboard.pendingOrders` | Ожидают обработки | Jarayonda |
| `dashboard.recentOrders` | Последние заказы | Soʻnggi buyurtmalar |
| `dashboard.allOrders` | Все заказы → | Barcha buyurtmalar → |
| `dashboard.noOrders` | Заказов пока нет | Hozircha buyurtma yoʻq |
| `dashboard.quickAddProduct` | Добавить товар | Mahsulot qoʻshish |
| `dashboard.quickProcessOrders` | Обработать заказы | Buyurtmalarni qayta ishlash |
| `dashboard.quickAnalytics` | Аналитика | Tahlil |
| `orders.title` | Заказы | Buyurtmalar |
| `orders.loadingCount` | Загрузка... | Yuklanmoqda... |
| `orders.searchResultCount` | Найдено: {found} из {total} загруженных | Topildi: {found} ta, {total} tadan |
| `orders.totalCount` | {count} заказов | {count} ta buyurtma |
| `orders.filterAll` | Все | Barchasi |
| `orders.filterPending` | Ожидают | Kutilmoqda |
| `orders.filterConfirmed` | Подтвержд. | Tasdiqlangan |
| `orders.filterProcessing` | Обработка | Jarayonda |
| `orders.filterShipped` | В пути | Yoʻlda |
| `orders.filterDelivered` | Доставлены | Yetkazilgan |
| `orders.hideCompleted` | Скрыть завершённые | Yakunlanganlarni yashirish |
| `orders.hideCompletedActive` | ✓ Скрыть завершённые | ✓ Yakunlanganlarni yashirish |
| `orders.searchPlaceholder` | Поиск по № заказа, городу, адресу, товару | Buyurtma №, shahar, manzil, mahsulot boʻyicha qidiruv |
| `orders.searchClear` | Очистить | Tozalash |
| `orders.colNum` | # | # |
| `orders.colOrder` | Заказ | Buyurtma |
| `orders.colAmount` | Сумма | Summa |
| `orders.colStatus` | Статус | Holat |
| `orders.colActions` | Действия | Amallar |
| `orders.noItems` | Заказов пока нет | Hozircha buyurtma yoʻq |
| `orders.noSearchResults` | Ничего не найдено по запросу «{query}». Попробуйте загрузить больше заказов. | «{query}» boʻyicha hech narsa topilmadi. Koʻproq buyurtma yuklashga urinib koʻring. |
| `orders.noStatusResults` | Нет заказов со статусом "{status}" | "{status}" holatidagi buyurtmalar yoʻq |
| `orders.loadError` | Не удалось загрузить заказы. Попробуйте обновить страницу. | Buyurtmalarni yuklab boʻlmadi. Sahifani yangilang. |
| `orders.loadMore` | Загрузить ещё | Koʻproq yuklash |
| `orders.loadingMore` | Загрузка... | Yuklanmoqda... |
| `orders.noProductTitle` | Без товаров | Mahsulotsiz |
| `orders.cancelBtn` | Отмена | Bekor qilish |
| `orders.cancelModalTitle` | Отменить заказ {orderNumber} | {orderNumber} buyurtmani bekor qilish |
| `orders.cancelReasonLabel` | Причина отмены | Bekor qilish sababi |
| `orders.cancelReasonPlaceholder` | Нет в наличии, покупатель не отвечает... | Mavjud emas, xaridor javob bermayapti... |
| `orders.cancelBack` | Назад | Orqaga |
| `orders.cancelPending` | Отмена... | Bekor qilinmoqda... |
| `orders.cancelConfirm` | Отменить заказ | Buyurtmani bekor qilish |
| `orders.nextConfirm` | Подтвердить | Tasdiqlash |
| `orders.nextProcess` | В обработку | Jarayonga olish |
| `orders.nextShip` | Отправить | Yuborish |
| `orders.nextDeliver` | Доставлено | Yetkazildi |
| `orders.status.PENDING` | Ожидает | Kutilmoqda |
| `orders.status.CONFIRMED` | Подтверждён | Tasdiqlangan |
| `orders.status.PROCESSING` | Обработка | Jarayonda |
| `orders.status.SHIPPED` | В пути | Yoʻlda |
| `orders.status.DELIVERED` | Доставлен | Yetkazildi |
| `orders.status.CANCELLED` | Отменён | Bekor qilindi |
| `orders.detail.backAriaLabel` | Назад | Orqaga |
| `orders.detail.orderTitle` | Заказ {orderNumber} | {orderNumber} buyurtma |
| `orders.detail.notFound` | Заказ не найден. | Buyurtma topilmadi. |
| `orders.detail.backToList` | Вернуться к списку | Roʻyxatga qaytish |
| `orders.detail.nextStep` | Следующий шаг | Keyingi qadam |
| `orders.detail.cancelBtn` | Отменить | Bekor qilish |
| `orders.detail.cancelModalTitle` | Отменить заказ | Buyurtmani bekor qilish |
| `orders.detail.cancelReasonLabel` | Причина отмены | Bekor qilish sababi |
| `orders.detail.cancelReasonPlaceholder` | Нет в наличии, покупатель не отвечает... | Mavjud emas, xaridor javob bermayapti... |
| `orders.detail.cancelBack` | Назад | Orqaga |
| `orders.detail.cancelPending` | Отмена... | Bekor qilinmoqda... |
| `orders.detail.cancelConfirm` | Отменить заказ | Buyurtmani bekor qilish |
| `orders.detail.nextConfirm` | Подтвердить заказ | Buyurtmani tasdiqlash |
| `orders.detail.nextProcess` | Взять в обработку | Jarayonga olish |
| `orders.detail.nextShip` | Отправить | Yuborish |
| `orders.detail.nextDeliver` | Отметить доставленным | Yetkazilganligini belgilash |
| `orders.detail.itemsSection` | Товары ({count}) | Mahsulotlar ({count}) |
| `orders.detail.deliveryFree` | Бесплатно | Bepul |
| `orders.detail.deliveryLabel` | Доставка | Yetkazib berish |
| `orders.detail.totalLabel` | Итого | Jami |
| `orders.detail.deliveryAndPayment` | Доставка и оплата | Yetkazib berish va toʻlov |
| `orders.detail.addressLabel` | Адрес | Manzil |
| `orders.detail.paymentLabel` | Оплата | Toʻlov |
| `orders.detail.paymentNotSet` | Не указан | Koʻrsatilmagan |
| `orders.detail.accountPhone` | Номер аккаунта | Hisob raqami |
| `orders.detail.backupPhone` | Резервный номер | Zaxira raqam |
| `orders.detail.buyerNote` | Комментарий покупателя | Xaridor izohi |
| `orders.detail.paymentStatus.UNPAID` | Ожидает оплаты | Toʻlov kutilmoqda |
| `orders.detail.paymentStatus.PAID` | Оплачен | Toʻlandi |
| `orders.detail.paymentStatus.REFUNDED` | Возврат | Qaytarildi |
| `analytics.title` | Аналитика | Tahlil |
| `analytics.subtitle` | Заказы и выручка магазина | Doʻkon buyurtmalari va daromadi |
| `analytics.periodLabel` | Период | Davr |
| `analytics.period7` | 7 дней | 7 kun |
| `analytics.period30` | 30 дней | 30 kun |
| `analytics.period90` | 90 дней | 90 kun |
| `analytics.loadError` | Не удалось загрузить аналитику. Попробуйте обновить страницу. | Tahlilni yuklab boʻlmadi. Sahifani yangilang. |
| `analytics.kpiRevenue` | Выручка | Daromad |
| `analytics.kpiRevenueUnit` | сум | soʻm |
| `analytics.kpiRevenueSub` | Доставленные заказы | Yetkazilgan buyurtmalar |
| `analytics.kpiOrders` | Заказы | Buyurtmalar |
| `analytics.kpiOrdersSub` | {count} доставлено | {count} ta yetkazildi |
| `analytics.kpiPending` | В работе | Jarayonda |
| `analytics.kpiPendingSub` | Confirmed + Processing + Shipped | Confirmed + Processing + Shipped |
| `analytics.sparklineTitle` | Выручка по дням | Kunlik daromad |
| `analytics.sparklineSum` | {sum} сум суммарно | {sum} soʻm jami |
| `analytics.topProductsTitle` | Топ товары · по выручке | Top mahsulotlar · daromad boʻyicha |
| `analytics.topByViewsTitle` | Самый просматриваемый · 30 дней | Eng koʻp koʻrilgan · 30 kun |
| `analytics.topByViewsCount` | {count} просмотров | {count} ta koʻrish |
| `analytics.topByViewsNoData` | Недостаточно данных | Yetarli maʼlumot yoʻq |
| `analytics.emptyTitle` | За {period} ещё нет заказов | {period} ichida hali buyurtma yoʻq |
| `analytics.emptySub` | Поделитесь ссылкой на магазин и продвигайте товары — статистика появится здесь | Doʻkon havolasini ulashing va mahsulotlarni targʻib qiling — statistika shu yerda paydo boʻladi |
| `analytics.viewsSectionTitle` | Просмотры и конверсия (за 30 дней) | Koʻrishlar va konversiya (30 kunlik) |
| `analytics.kpiViews` | Просмотры | Koʻrishlar |
| `analytics.kpiViewsSub` | товаров и магазина | mahsulotlar va doʻkon |
| `analytics.kpiConversion` | Конверсия | Konversiya |
| `analytics.kpiConversionSub` | просмотр → заказ | koʻrish → buyurtma |
| `chat.title` | Чаты | Chatlar |
| `chat.noMessages` | Нет сообщений | Xabar yoʻq |
| `chat.noChats` | Чатов пока нет | Hozircha chat yoʻq |
| `chat.noChatsHint` | Покупатели первыми пишут вам\nсо страницы товара или заказа | Xaridorlar avval siz bilan bogʻlanadi\nmahsulot yoki buyurtma sahifasidan |
| `chat.loadError` | Не удалось загрузить чаты | Chatlarni yuklab boʻlmadi |
| `chat.emptyTitle` | Здесь появятся диалоги с покупателями | Bu yerda xaridorlar bilan suhbatlar paydo boʻladi |
| `chat.emptyHint` | Продавец не может начать чат первым. Покупатель напишет вам со страницы товара или заказа — диалог сразу появится в списке слева. | Sotuvchi avval chat boshlay olmaydi. Xaridor mahsulot yoki buyurtma sahifasidan yozadi — suhbat darhol chapda paydo boʻladi. |
| `chat.selectChat` | Выберите чат | Chat tanlang |
| `chat.threadTypeOrder` | Заказ | Buyurtma |
| `chat.threadTypeProduct` | Товар | Mahsulot |
| `chat.closeChat` | Закрыть чат | Chatni yopish |
| `chat.deleteChatAriaLabel` | Удалить чат | Chatni oʻchirish |
| `chat.deleteChatTitle` | Удалить чат | Chatni oʻchirish |
| `chat.deleteMsgTitle` | Удалить сообщение? | Xabarni oʻchirasizmi? |
| `chat.deleteMsgHint` | Покупатель увидит «Сообщение удалено» вместо текста. | Xaridor matn oʻrnida «Xabar oʻchirildi» ni koʻradi. |
| `chat.deleteChatHint` | Чат исчезнет из вашего списка. Покупатель продолжит видеть историю. | Chat roʻyxatingizdan yoʻqoladi. Xaridor tarixni koʻrishda davom etadi. |
| `chat.deleteError` | Не удалось удалить чат | Chatni oʻchirib boʻlmadi |
| `chat.deleteMsgError` | Не удалось удалить сообщение | Xabarni oʻchirib boʻlmadi |
| `chat.deletedMessage` | Сообщение удалено | Xabar oʻchirildi |
| `chat.msgEdited` | изменено ·  | tahrirlangan ·  |
| `chat.actionMenuAriaLabel` | Действия с сообщением | Xabar amallari |
| `chat.editAction` | Редактировать | Tahrirlash |
| `chat.deleteAction` | Удалить | Oʻchirish |
| `chat.cancelEdit` | Отмена | Bekor qilish |
| `chat.saveEdit` | Сохранить | Saqlash |
| `chat.saveEditError` | Не удалось сохранить | Saqlab boʻlmadi |
| `chat.inputPlaceholder` | Написать сообщение... | Xabar yozish... |
| `chat.inputClosedPlaceholder` | Чат закрыт | Chat yopiq |
| `chat.sendAriaLabel` | Отправить | Yuborish |
| `chat.backAriaLabel` | Назад к списку | Roʻyxatga qaytish |
| `chat.statusClosed` | закрыт | yopildi |
| `chat.threadNoMessages` | Нет сообщений | Xabar yoʻq |
| `notifications.title` | Уведомления | Bildirishnomalar |
| `notifications.lastCount` | Последние {count} уведомлений | Soʻnggi {count} ta bildirishnoma |
| `notifications.readAll` | Прочитать все | Barchasini oʻqish |
| `notifications.tabAll` | Все | Barchasi |
| `notifications.tabUnread` | Непрочитанные | Oʻqilmaganlar |
| `notifications.empty` | Уведомлений пока нет | Hozircha bildirishnoma yoʻq |
| `notifications.loadError` | Не удалось загрузить уведомления. Попробуйте обновить страницу. | Bildirishnomalarni yuklab boʻlmadi. Sahifani yangilang. |
| `notifications.timeJustNow` | только что | hozir |
| `notifications.timeMinsAgo` | {mins} мин назад | {mins} daqiqa oldin |
| `notifications.timeHoursAgo` | {hrs} ч назад | {hrs} soat oldin |
| `notifications.timeDaysAgo` | {days} дн назад | {days} kun oldin |
| `products.title` | Товары | Mahsulotlar |
| `products.countSuffix` | товаров | ta mahsulot |
| `products.addBtn` | + Добавить | + Qoʻshish |
| `products.searchPlaceholder` | Поиск по названию... | Nomi boʻyicha qidiruv... |
| `products.filterAll` | Все | Barchasi |
| `products.filterActive` | Активные | Faollar |
| `products.filterDraft` | Черновики | Qoralamalar |
| `products.filterArchived` | Архив | Arxiv |
| `products.colProduct` | Товар | Mahsulot |
| `products.colPrice` | Цена | Narx |
| `products.colStatus` | Статус | Holat |
| `products.status.ACTIVE` | Активен | Faol |
| `products.status.DRAFT` | Черновик | Qoralama |
| `products.status.ARCHIVED` | Архив | Arxiv |
| `products.status.HIDDEN_BY_ADMIN` | Скрыт | Yashirilgan |
| `products.variantCountTitle` | {count} активных вариантов | {count} ta faol variant |
| `products.empty` | Товаров пока нет.  | Hozircha mahsulot yoʻq.  |
| `products.emptyAddLink` | Добавить первый → | Birinchisini qoʻshish → |
| `products.notFound` | Ничего не найдено | Hech narsa topilmadi |
| `products.hide` | Скрыть | Yashirish |
| `products.publish` | Опубликовать | Chop etish |
| `products.edit` | Изменить | Tahrirlash |
| `products.copyWebLink` | Скопировать веб-ссылку | Veb-havolani nusxalash |
| `products.copyTgLink` | Скопировать Telegram-ссылку (открывает TMA) | Telegram-havolani nusxalash (TMA ochadi) |
| `products.copyTgLinkAria` | Скопировать Telegram-ссылку | Telegram-havolani nusxalash |
| `products.create.title` | Новый товар | Yangi mahsulot |
| `products.create.subtitle` | Заполните основную информацию | Asosiy maʼlumotlarni toʻldiring |
| `products.create.labelName` | Название | Nomi |
| `products.create.labelPrice` | Цена (сум) | Narxi (soʻm) |
| `products.create.labelSku` | Артикул (SKU) | Artikul (SKU) |
| `products.create.labelPhotos` | Фото товара | Mahsulot rasmlari |
| `products.create.labelDisplayType` | Как показывать товар на витрине | Vitrinada qanday koʻrsatish |
| `products.create.labelGlobalCategory` | Категория товара | Mahsulot kategoriyasi |
| `products.create.labelDescription` | Описание | Tavsif |
| `products.create.labelAttributes` | Характеристики | Xususiyatlar |
| `products.create.labelVariants` | Варианты товара (опц.) | Mahsulot variantlari (ixtiyoriy) |
| `products.create.labelStoreSection` | Раздел магазина | Doʻkon boʻlimi |
| `products.create.labelVisibility` | Показывать в магазине | Doʻkonda koʻrsatish |
| `products.create.visibilityHint` | Покупатели смогут видеть товар | Xaridorlar mahsulotni koʻra oladi |
| `products.create.categorySearchPlaceholder` | Поиск категории… | Kategoriya qidiruvi… |
| `products.create.categoryPlaceholder` | — Выберите категорию — | — Kategoriya tanlang — |
| `products.create.sectionSearchPlaceholder` | Поиск раздела… | Boʻlim qidiruvi… |
| `products.create.sectionPlaceholder` | — Без раздела — | — Boʻlimsiz — |
| `products.create.categoryConfirmMsg` | Товар появится у покупателей в категории | Mahsulot xaridorlarga kategoriyada koʻrinadi |
| `products.create.categoryHint` | Можно выбрать любую — одежда, обувь, электроника, мебель, книги и т.д. От выбора зависит, где товар увидят покупатели. | Istalganini tanlang — kiyim, poyabzal, elektronika, mebel, kitoblar va boshqalar. Tanlov mahsulot qayerda koʻrinishini belgilaydi. |
| `products.create.categoryFiltersLoading` | Загружаем характеристики категории… | Kategoriya xususiyatlari yuklanmoqda… |
| `products.create.submitBtn` | Создать товар | Mahsulot yaratish |
| `products.create.creating` | Создание... | Yaratilmoqda... |
| `products.create.cancelBtn` | Отмена | Bekor qilish |
| `products.create.errorCreate` | Не удалось создать товар. Попробуйте ещё раз. | Mahsulot yaratib boʻlmadi. Qayta urinib koʻring. |
| `products.create.requiredName` | Введите название товара | Mahsulot nomini kiriting |
| `products.create.requiredPrice` | Укажите цену | Narxni kiriting |
| `products.create.priceMin` | Цена должна быть больше 0 | Narx 0 dan katta boʻlishi kerak |
| `products.create.partialTitle` | Товар создан | Mahsulot yaratildi |
| `products.create.partialToProducts` | К товарам | Mahsulotlarga |
| `products.create.partialOpenProduct` | Открыть товар | Mahsulotni ochish |
| `products.create.partialPhotos` | фото | rasmlar |
| `products.create.partialAttrs` | характеристики | xususiyatlar |
| `products.create.partialVariants` | варианты | variantlar |
| `products.create.partialMsg` | Товар создан, но не сохранилось — {parts}. Откройте товар и добавьте недостающее. | Mahsulot yaratildi, lekin saqlanmadi — {parts}. Mahsulotni oching va yetishmayotganlarni qoʻshing. |
| `products.edit.title` | Редактировать товар | Mahsulotni tahrirlash |
| `products.edit.labelPhotos` | Фото товара | Mahsulot rasmlari |
| `products.edit.labelDisplayType` | Как показывать товар на витрине | Vitrinada qanday koʻrsatish |
| `products.edit.labelGlobalCategory` | Категория товара | Mahsulot kategoriyasi |
| `products.edit.labelStoreSection` | Раздел магазина | Doʻkon boʻlimi |
| `products.edit.labelName` | Название | Nomi |
| `products.edit.labelDescription` | Описание | Tavsif |
| `products.edit.labelPrice` | Цена (сум) | Narxi (soʻm) |
| `products.edit.labelSku` | Артикул (SKU) | Artikul (SKU) |
| `products.edit.labelVisibility` | Показывать в магазине | Doʻkonda koʻrsatish |
| `products.edit.visibilityHint` | Покупатели смогут видеть товар | Xaridorlar mahsulotni koʻra oladi |
| `products.edit.labelAttributes` | Характеристики | Xususiyatlar |
| `products.edit.labelStatus` | Статус товара | Mahsulot holati |
| `products.edit.categorySearchPlaceholder` | Поиск категории… | Kategoriya qidiruvi… |
| `products.edit.categoryPlaceholder` | — Выберите категорию — | — Kategoriya tanlang — |
| `products.edit.sectionSearchPlaceholder` | Поиск раздела… | Boʻlim qidiruvi… |
| `products.edit.sectionPlaceholder` | — Без раздела — | — Boʻlimsiz — |
| `products.edit.categoryWithHint` | Товар покажется в этой категории и попадёт под её фильтры. | Mahsulot ushbu kategoriyada koʻrinadi va uning filtrlari ostiga tushadi. |
| `products.edit.categoryWithoutHint` | Выберите что продаёте: одежда, обувь, электроника, мебель, книги и т.д. | Nima sotishingizni tanlang: kiyim, poyabzal, elektronika, mebel, kitoblar va boshqalar. |
| `products.edit.saveBtn` | Сохранить | Saqlash |
| `products.edit.saving` | Сохранение... | Saqlanmoqda... |
| `products.edit.cancelBtn` | Отмена | Bekor qilish |
| `products.edit.errorSave` | Не удалось сохранить изменения. Попробуйте ещё раз. | Oʻzgarishlarni saqlab boʻlmadi. Qayta urinib koʻring. |
| `products.edit.errorImages` | Не все фото удалось сохранить — список обновлён, попробуйте ещё раз. | Barcha rasmlarni saqlab boʻlmadi — roʻyxat yangilandi, qayta urinib koʻring. |
| `products.edit.notFound` | Товар не найден. | Mahsulot topilmadi. |
| `products.edit.backToList` | Вернуться к списку | Roʻyxatga qaytish |
| `products.edit.requiredName` | Введите название товара | Mahsulot nomini kiriting |
| `products.edit.requiredPrice` | Укажите цену | Narxni kiriting |
| `products.edit.priceMin` | Цена не может быть отрицательной | Narx manfiy boʻlishi mumkin emas |
| `products.edit.hiddenByAdmin` | Этот товар скрыт администратором. Обратитесь в поддержку для разъяснений. | Bu mahsulot administrator tomonidan yashirilgan. Tushuntirish uchun qoʻllab-quvvatlash xizmatiga murojaat qiling. |
| `products.edit.makeActive` | Сделать активным | Faol qilish |
| `products.edit.toDraft` | В черновик | Qoralamaga |
| `products.edit.toArchive` | В архив | Arxivga |
| `products.edit.deleteBtn` | Удалить товар | Mahsulotni oʻchirish |
| `products.edit.deleting` | Удаление... | Oʻchirilmoqda... |
| `products.edit.deleteConfirmTitle` | Удалить товар? | Mahsulotni oʻchirasizmi? |
| `products.edit.deleteConfirmMsg` | Это действие нельзя отменить. | Bu amalni bekor qilib boʻlmaydi. |
| `products.edit.deleteConfirmLabel` | Удалить | Oʻchirish |
| `profile.title` | Профиль | Profil |
| `profile.seller` | Продавец | Sotuvchi |
| `profile.typeBusiness` | Бизнес | Biznes |
| `profile.typeIndividual` | Физ. лицо | Jismoniy shaxs |
| `profile.statusDraft` | Черновик | Qoralama |
| `profile.statusSubmitted` | На проверке | Tekshiruvda |
| `profile.statusApproved` | Одобрен | Tasdiqlandi |
| `profile.statusRejected` | Отклонён | Rad etildi |
| `profile.statusSuspended` | Заблокирован | Bloklangan |
| `profile.statusPublished` | Опубликован | Chop etilgan |
| `profile.avatarChangeLabel` | Изменить фото | Rasmni almashtirish |
| `profile.avatarAddLabel` | Добавить фото | Rasm qoʻshish |
| `profile.avatarAlt` | Аватар | Avatar |
| `profile.errorAvatarType` | Только JPEG, PNG или WebP | Faqat JPEG, PNG yoki WebP |
| `profile.errorAvatarSize` | Файл больше 10 МБ | Fayl 10 MB dan katta |
| `profile.errorAvatarUpload` | Не удалось загрузить фото | Rasmni yuklab boʻlmadi |
| `profile.yourStore` | Ваш магазин | Sizning doʻkoningiz |
| `profile.copyStoreLink` | Копировать | Nusxalash |
| `profile.openStore` | Открыть | Ochish |
| `profile.settings` | Настройки | Sozlamalar |
| `profile.settingsHint` | Магазин, доставка, профиль, уведомления | Doʻkon, yetkazib berish, profil, bildirishnomalar |
| `profile.loggingOut` | Выход… | Chiqilmoqda… |
| `profile.logout` | Выйти из аккаунта | Hisobdan chiqish |
| `profile.logoutHint` | Завершить сессию на этом устройстве | Ushbu qurilmadagi seansni tugatish |
| `settings.sectionStore` | Магазин | Doʻkon |
| `settings.sectionDelivery` | Доставка | Yetkazib berish |
| `settings.sectionProfile` | Профиль продавца | Sotuvchi profili |
| `settings.sectionNotif` | Уведомления | Bildirishnomalar |
| `settings.sectionSupport` | Поддержка | Qoʻllab-quvvatlash |
| `settings.supportLink` | Написать в поддержку | Qoʻllab-quvvatlashga yozish |
| `settings.supportHint` | Вопросы по магазину, заказам, оплате — мы на связи в Telegram | Doʻkon, buyurtmalar, toʻlov boʻyicha savollar — Telegramda bogʻlanamiz |
| `settings.sectionCategories` | Категории магазина | Doʻkon kategoriyalari |
| `settings.manageCategoriesLink` | Управление категориями | Kategoriyalarni boshqarish |
| `settings.categoriesLoading` | Загрузка… | Yuklanmoqda… |
| `settings.categoriesEmpty` | Группируйте товары на витрине магазина | Doʻkon vitrinasida mahsulotlarni guruhlang |
| `settings.categoriesCount1` | категория | kategoriya |
| `settings.categoriesCountFew` | категории | ta kategoriya |
| `settings.categoriesCountMany` | категорий | ta kategoriya |
| `settings.categoriesEditSuffix` | — открыть для редактирования | — tahrirlash uchun oching |
| `settings.saved` | Сохранено | Saqlandi |
| `settings.saving` | Сохранение... | Saqlanmoqda... |
| `settings.saveBtn` | Сохранить | Saqlash |
| `settings.saveError` | Ошибка сохранения | Saqlashda xato |
| `settings.labelStoreCover` | Обложка магазина | Doʻkon muqovasi |
| `settings.labelStoreLogo` | Логотип | Logotip |
| `settings.labelStoreName` | Название магазина | Doʻkon nomi |
| `settings.labelDescription` | Описание | Tavsif |
| `settings.labelCity` | Город | Shahar |
| `settings.labelRegion` | Регион | Viloyat |
| `settings.labelTelegramContact` | Telegram-контакт | Telegram-kontakt |
| `settings.labelDeliveryCost` | Стоимость доставки | Yetkazib berish narxi |
| `settings.labelDeliveryAmount` | Сумма доставки (сум) | Yetkazib berish summasi (soʻm) |
| `settings.deliveryAmountPattern` | Только целые числа | Faqat butun sonlar |
| `settings.deliveryManualHint` | Сумма доставки обсуждается с покупателем индивидуально. | Yetkazib berish summasi xaridor bilan alohida kelishiladi. |
| `settings.deliveryFeeNone` | Бесплатно | Bepul |
| `settings.deliveryFeeFixed` | Фиксированная сумма | Belgilangan summa |
| `settings.deliveryFeeManual` | Договорная | Kelishuvga koʻra |
| `settings.deliveryTypeAriaLabel` | Тип стоимости доставки | Yetkazib berish narxi turi |
| `settings.labelFullName` | Имя / название компании | Ism / kompaniya nomi |
| `settings.labelTgUsername` | Telegram username | Telegram username |
| `settings.tgUsernamePattern` | Формат: @username (3–32 символа) | Format: @username (3–32 ta belgi) |
| `settings.requiredField` | Обязательное поле | Majburiy maydon |
| `settings.minTwoChars` | Минимум 2 символа | Kamida 2 ta belgi |
| `settings.max255Chars` | Максимум 255 символов | Koʻpi bilan 255 ta belgi |
| `settings.max2000Chars` | Максимум 2000 символов | Koʻpi bilan 2000 ta belgi |
| `settings.max100Chars` | Максимум 100 символов | Koʻpi bilan 100 ta belgi |
| `settings.storeCityPlaceholder` | Ташкент | Toshkent |
| `settings.storeRegionPlaceholder` | Ташкентская область | Toshkent viloyati |
| `settings.storeDescriptionPlaceholder` | Расскажите о вашем магазине... | Doʻkoningiz haqida gapirib bering... |
| `settings.profileNamePlaceholder` | Алишер Каримов | Alisher Karimov |
| `settings.profileTgPlaceholder` | @yourhandle | @yourhandle |
| `settings.notifTelegram` | Telegram-уведомления | Telegram-bildirishnomalar |
| `settings.notifTelegramHint` | Новые заказы и изменения статусов — в ваш Telegram | Yangi buyurtmalar va holat oʻzgarishlari — Telegramingizga |
| `settings.notifBrowserPush` | Push в браузере | Brauzer push |
| `settings.notifBrowserPushHint` | Уведомления на этом устройстве даже если вкладка закрыта | Yorliq yopiq boʻlsa ham ushbu qurilmada bildirishnomalar |
| `settings.notifMobilePush` | Push в мобильном | Mobil push |
| `settings.notifMobilePushHint` | Уведомления в Telegram-приложении продавца | Sotuvchi Telegram ilovasidagi bildirishnomalar |
| `categories.title` | Категории магазина | Doʻkon kategoriyalari |
| `categories.subtitle` | Группируйте товары на витрине — покупатели смогут фильтровать по категориям. | Vitrinada mahsulotlarni guruhlang — xaridorlar kategoriyalar boʻyicha filtrlashi mumkin. |
| `categories.addLabel` | Добавить категорию | Kategoriya qoʻshish |
| `categories.addPlaceholder` | Например: Одежда, Электроника | Masalan: Kiyim, Elektronika |
| `categories.addBtn` | Добавить | Qoʻshish |
| `categories.adding` | Добавление… | Qoʻshilmoqda… |
| `categories.apiError` | Не удалось выполнить операцию | Amalni bajarib boʻlmadi |
| `categories.loading` | Загрузка… | Yuklanmoqda… |
| `categories.loadError` | Не удалось загрузить категории. | Kategoriyalarni yuklab boʻlmadi. |
| `categories.emptyHint` | Пока нет категорий. Добавьте первую — она появится в фильтре магазина. | Hozircha kategoriya yoʻq. Birinchisini qoʻshing — doʻkon filtrida paydo boʻladi. |
| `categories.moveUpAria` | Поднять выше | Yuqoriga koʻtarish |
| `categories.moveDownAria` | Опустить ниже | Pastga tushirish |
| `categories.saveAria` | Сохранить | Saqlash |
| `categories.cancelAria` | Отмена | Bekor qilish |
| `categories.editAria` | Редактировать {name} | {name} ni tahrirlash |
| `categories.deleteAria` | Удалить {name} | {name} ni oʻchirish |
| `categories.deleteTitle` | Удалить категорию «{name}»? | «{name}» kategoriyasini oʻchirasizmi? |
| `categories.deleteMsg` | Товары останутся, но потеряют принадлежность к этой категории. | Mahsulotlar qoladi, lekin ushbu kategoriyadan ajraladi. |
| `categories.deleteConfirmLabel` | Удалить | Oʻchirish |
| `nav.dashboard` | Дашборд | Boshqaruv paneli |
| `nav.products` | Товары | Mahsulotlar |
| `nav.orders` | Заказы | Buyurtmalar |
| `nav.chats` | Чаты | Chatlar |
| `nav.analytics` | Аналитика | Tahlil |
| `nav.settings` | Настройки | Sozlamalar |
| `nav.yourStore` | Ваш магазин | Sizning doʻkoningiz |
| `nav.copyLink` | Копировать | Nusxalash |
| `nav.personalCabinet` | Личный кабинет | Shaxsiy kabinet |
| `nav.logout` | Выйти | Chiqish |
| `nav.openMenu` | Открыть меню | Menyuni ochish |
| `nav.notifications` | Уведомления | Bildirishnomalar |
| `theme.enableLight` | Включить светлую тему | Yorugʻ mavzuni yoqish |
| `theme.enableDark` | Включить тёмную тему | Qorongʻu mavzuni yoqish |
| `theme.light` | Светлая | Yorugʻ |
| `theme.dark` | Тёмная | Qorongʻu |
| `theme.system` | Как в системе | Tizim kabi |
| `confirm.defaultConfirm` | Подтвердить | Tasdiqlash |
| `confirm.defaultCancel` | Отмена | Bekor qilish |
| `uploader.sessionExpired` | Сессия истекла. Войдите заново. | Sessiya tugadi. Qayta kiring. |
| `uploader.noPermission` | Нет прав на загрузку фото. | Rasm yuklash uchun ruxsat yoʻq. |
| `uploader.fileTooLarge` | Файл слишком большой для сервера. | Fayl server uchun juda katta. |
| `uploader.formatNotSupported` | Формат не поддерживается сервером. | Format server tomonidan qoʻllab-quvvatlanmaydi. |
| `uploader.storageDisabled` | Хранилище фото отключено на сервере. | Rasm ombori serverda oʻchirilgan. |
| `uploader.serverError` | Сервер вернул {status}. Попробуйте позже. | Server {status} qaytardi. Keyinroq urinib koʻring. |
| `uploader.noConnection` | Нет связи с сервером. | Server bilan aloqa yoʻq. |
| `uploader.genericError` | Не удалось загрузить фото. Попробуйте снова. | Rasmni yuklab boʻlmadi. Qayta urinib koʻring. |
| `uploader.uploadFailed` | Ошибка загрузки ({status}). | Yuklash xatosi ({status}). |
| `uploader.invalidFormat` | Формат не поддерживается. Используйте JPG, PNG или WebP. | Format qoʻllab-quvvatlanmaydi. JPG, PNG yoki WebP ishlating. |
| `uploader.fileTooLargeLocal` | Файл слишком большой. Максимум 10 МБ. | Fayl juda katta. Maksimum 10 MB. |
| `uploader.retry` | Попробовать снова | Qayta urinib koʻring |
| `uploader.removePhoto` | Удалить фото | Rasmni oʻchirish |
| `uploader.addPhoto` | Добавить\nфото | Rasm\nqoʻshish |
| `uploader.addPhotoBtn` | Добавить фото | Rasm qoʻshish |
| `uploader.maxPhotos` | Максимум {max} фото | Maksimum {max} ta rasm |
| `uploader.onlyFormats` | Только JPG / PNG / WebP | Faqat JPG / PNG / WebP |
| `uploader.fileTooLargeNamed` | Файл «{name}» больше 10 MB | «{name}» fayli 10 MB dan katta |
| `uploader.makePrimary` | Сделать главным | Asosiy qilish |
| `uploader.primaryLabel` | Главное | Asosiy |
| `uploader.uploading` | Загрузка… | Yuklanmoqda… |
| `uploader.addBtn` | + Добавить | + Qoʻshish |
| `uploader.multiError.sessionExpired` | Сессия истекла | Sessiya tugadi |
| `uploader.multiError.fileTooLarge` | Файл слишком большой | Fayl juda katta |
| `uploader.multiError.formatNotSupported` | Формат не поддерживается | Format qoʻllab-quvvatlanmaydi |
| `uploader.multiError.storageUnavailable` | Хранилище недоступно | Ombor mavjud emas |
| `uploader.multiError.serverError` | Ошибка сервера {status} | Server xatosi {status} |
| `uploader.multiError.uploadFailed` | Не удалось загрузить | Yuklab boʻlmadi |
| `uploader.hint` | До {max} фото · Первое — главное | {max} tagacha rasm · Birinchisi — asosiy |
| `uploader.hintReorder` | До {max} фото · Первое — главное · Перетащи чтобы поменять порядок | {max} tagacha rasm · Birinchisi — asosiy · Tartibni oʻzgartirish uchun torting |
| `variants.title` | Варианты товара | Mahsulot variantlari |
| `variants.count` | {count} шт. | {count} ta. |
| `variants.loading` | Загрузка... | Yuklanmoqda... |
| `variants.empty` | Нет вариантов. Добавьте, если товар продаётся в разных размерах, цветах и т.д. | Variant yoʻq. Mahsulot turli oʻlcham, rang va boshqalarda sotilsa qoʻshing. |
| `variants.addBtn` | + Добавить вариант | + Variant qoʻshish |
| `variants.duplicate` | Вариант с такой комбинацией опций уже есть. | Bu variant kombinatsiyasi allaqachon mavjud. |
| `variants.noGroupValues` | Добавьте значения в эту группу перед созданием варианта | Variant yaratishdan oldin bu guruhga qiymat qoʻshing |
| `variants.cannotAdd` | Сначала добавьте значения в группы опций | Avval optsiya guruhlariga qiymat qoʻshing |
| `variants.deleteTitle` | Удалить вариант? | Variantni oʻchirasizmi? |
| `variants.stockAriaLabel` | Склад | Ombor |
| `variants.saveStockAriaLabel` | Сохранить склад | Omborni saqlash |
| `variants.formLabelName` | Название | Nomi |
| `variants.formLabelSku` | Артикул (SKU) | Artikul (SKU) |
| `variants.formLabelPrice` | Цена (сум, пусто = базовая) | Narxi (soʻm, boʻsh = asosiy) |
| `variants.formLabelStock` | Остаток | Qoldiq |
| `variants.formPlaceholderName` | Красный / XL | Qizil / XL |
| `variants.formActiveToggle` | Активен | Faol |
| `variants.formSelectDefault` | — выберите — | — tanlang — |
| `variants.saveTooltipMissing` | Выберите значение для каждой группы опций | Har bir optsiya guruhi uchun qiymat tanlang |
| `attributes.empty` | Добавьте характеристики товара: Гарантия, Производитель, Материал и т.д. | Mahsulot xususiyatlarini qoʻshing: Kafolat, Ishlab chiqaruvchi, Material va h.k. |
| `attributes.namePlaceholder` | Название (Гарантия) | Nomi (Kafolat) |
| `attributes.valuePlaceholder` | Значение (12 месяцев) | Qiymati (12 oy) |
| `attributes.deleteAria` | Удалить характеристику | Xususiyatni oʻchirish |
| `attributes.addBtn` | Добавить характеристику | Xususiyat qoʻshish |
| `optionGroups.title` | Опции товара | Mahsulot optsiyalari |
| `optionGroups.groupCount` | {count} гр. | {count} ta guruh. |
| `optionGroups.empty` | Добавьте группы опций (например «Размер», «Цвет»), чтобы товар продавался в нескольких вариантах. | Optsiya guruhlari qoʻshing (masalan «Oʻlcham», «Rang»), mahsulot bir necha variantda sotilishi uchun. |
| `optionGroups.addGroupBtn` | + Добавить группу опций | + Optsiya guruhi qoʻshish |
| `optionGroups.addValueBtn` | + значение | + qiymat |
| `optionGroups.newValuePlaceholder` | Новое значение | Yangi qiymat |
| `optionGroups.groupNamePlaceholder` | Название группы (например: Размер) | Guruh nomi (masalan: Oʻlcham) |
| `optionGroups.valuePlaceholder` | Например: XL | Masalan: XL |
| `optionGroups.groupNameEdit` | Например: Размер | Masalan: Oʻlcham |
| `optionGroups.deleteValueTitle` | Удалить значение «{value}»? | «{value}» qiymatini oʻchirasizmi? |
| `optionGroups.deleteValueMsg` | Варианты, использующие его, будут деактивированы. | Undan foydalanadigan variantlar deaktiv boʻladi. |
| `optionGroups.deleteGroupTitle` | Удалить группу «{name}»? | «{name}» guruhini oʻchirasizmi? |
| `optionGroups.deleteGroupMsg` | Все её значения будут удалены, а связанные варианты деактивированы. | Uning barcha qiymatlari oʻchiriladi va bogʻliq variantlar deaktiv boʻladi. |
| `categoryFilters.selectPlaceholder` | — Выберите — | — Tanlang — |
| `categoryFilters.booleanYes` | Да | Ha |
| `displayType.singleLabel` | Одно фото | Bitta rasm |
| `displayType.singleHint` | Главное фото товара. Подходит когда фотография одна или достаточно одной. | Mahsulotning asosiy rasmi. Faqat bitta rasm boʻlsa yoki bittasi yetarli boʻlsa mos keladi. |
| `displayType.sliderLabel` | Слайдер | Slayder |
| `displayType.sliderHint` | Несколько фото — покупатель листает свайпом. Точки-индикаторы внизу карточки. | Bir necha rasm — xaridor svayplab koʻradi. Pastda nuqtalar koʻrsatiladi. |
| `displayType.collageLabel` | Сетка 2×2 | 2×2 toʻr |
| `displayType.collageHint` | Сразу 4 фото в карточке — для одежды, аксессуаров, наборов. Загрузите минимум 2 фото. | Kartochkada 4 ta rasm — kiyim, aksessuarlar, toʻplamlar uchun. Kamida 2 ta rasm yuklang. |
| `select.defaultPlaceholder` | — Выберите — | — Tanlang — |
| `select.defaultSearchPlaceholder` | Поиск… | Qidiruv… |
| `select.defaultEmpty` | Ничего не найдено | Hech narsa topilmadi |
| `select.clearAria` | Сбросить | Tozalash |
| `select.clearSearchAria` | Очистить поиск | Qidiruvni tozalash |
| `emoji.ariaLabel` | Эмодзи | Emoji |
| `variants.matrixTitle` | Варианты ({count}) | Variantlar ({count}) |
| `variants.matrixStockPlaceholder` | Склад | Ombor |
| `variants.matrixPricePlaceholder` | Цена опц. | Narx (ixtiyoriy) |
| `variants.matrixHint` | Склад — сколько штук в наличии. Цена опц. — переопределяет базовую цену для этого варианта (оставь пусто чтобы использовать базовую). | Ombor — mavjud miqdor. Ixtiyoriy narx — bu variant uchun asosiy narxni almashtiradi (boʻsh qoldiring asosiy ishlatish uchun). |

</details>
