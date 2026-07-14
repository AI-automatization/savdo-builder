# Partner API — выгрузка товаров (PARTNER-API-RAOS-001)

Внешняя система (RAOS) создаёт товары в привязанном магазине MaxSavdo.

## Аутентификация

Заголовок `X-Api-Key: msk_...` на каждом запросе. Ключ:
- выдаётся вручную нами (admin-панель → `POST /api/v1/admin/partner-keys`),
- привязан к **одному** магазину MaxSavdo,
- показывается один раз при выдаче (в БД только sha256-hash),
- отзывается через `DELETE /api/v1/admin/partner-keys/:id`.

## POST `https://api.maxsavdo.uz/api/v1/partner/products`

Rate limit: 30 запросов/мин на ключ (глобально 120/мин на IP).

### Запрос

```json
{
  "title": "iPhone 15 Pro 256GB",
  "description": "Новый, гарантия 1 год",
  "basePrice": 15500000,
  "currencyCode": "UZS",
  "sku": "IP15P-256-BLK",
  "imageUrls": [
    "https://cdn.raos.uz/products/abc123/main.jpg",
    "https://cdn.raos.uz/products/abc123/side.jpg"
  ],
  "publish": true
}
```

| Поле | Тип | Обяз. | Примечание |
|------|-----|-------|------------|
| `title` | string ≤200 | ✅ | |
| `basePrice` | number > 0 | ✅ | целые сумы |
| `imageUrls` | string[] 1..5 | ✅ | **https-only**, jpeg/png/webp, ≤10MB каждый. **Товар без фото не принимается** — правило «faqat rasmi bor mahsulot chiqadi». |
| `description` | string ≤4000 | — | |
| `currencyCode` | string | — | default `UZS` |
| `sku` | string ≤64 | — | |
| `publish` | boolean | — | default `true` (сразу на витрину + автопост в TG-канал, если включён у продавца). `false` = создать черновик. |

Фото скачиваются сервером MaxSavdo в момент запроса и сохраняются в наше
хранилище (R2, resize до 1280px) — URL RAOS после этого не используется.

### Ответ `201`

```json
{
  "id": "3f0e…",
  "title": "iPhone 15 Pro 256GB",
  "status": "ACTIVE",
  "storeId": "9a1b…",
  "imageCount": 2,
  "publicUrl": "https://shop.maxsavdo.uz/{store-slug}/products/3f0e…"
}
```

### Ошибки

| Код | Когда |
|-----|-------|
| `401 UNAUTHORIZED` | нет/невалидный/отозванный `X-Api-Key`, продавец заблокирован |
| `422 VALIDATION_ERROR` | фото не скачалось / не image / >10MB / плохой URL / нет фото |
| `422 PRODUCT_PRICE_INVALID` | basePrice ≤ 0 |
| `403 SUBSCRIPTION_*` | превышен лимит товаров тарифа магазина (лимиты применяются как у обычного продавца) |
| `429` | rate limit |
| `502 MEDIA_UPLOAD_FAILED` | наше хранилище недоступно — товар создан как DRAFT, фото повторить позже |

## Что нужно от RAOS

1. Публичные **https** URL фотографий товара (jpeg/png/webp, до 10MB) — доступные без авторизации в момент выгрузки.
2. Поля товара: название, цена в сумах, описание (желательно), SKU (желательно).
3. Контакт/endpoint для передачи ключа безопасным каналом.
4. Ожидаемый объём: товаров в день / пиковая частота (для настройки rate limit).
5. Нужна ли синхронизация обновлений (цена/наличие/удаление) — текущая версия покрывает только создание; update/delete — отдельная итерация.
