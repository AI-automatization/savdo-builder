# ADR-005 — Cloudflare R2 для хранения медиа

**Дата:** 2026-03-21
**Статус:** Accepted

## Контекст

Нужно хранить: фото товаров, логотипы магазинов, обложки, документы продавцов, изображения в чате (future).

## Решение

**Cloudflare R2** как основное хранилище. AWS S3 как альтернатива если R2 недоступен или потребуется миграция.

Код должен работать с **S3-compatible API** — нет vendor lock-in.

## Причины

1. **Цена.** R2 не берёт плату за egress (исходящий трафик) в отличие от AWS S3. Критично для медиа.
2. **Скорость.** Cloudflare CDN глобально, включая Central Asia.
3. **S3-compatible API.** Можно использовать AWS SDK (`@aws-sdk/client-s3`) без изменений.
4. **Простота.** Нет сложной IAM-настройки как в AWS.

## Реализация

```typescript
// Использовать @aws-sdk/client-s3 с endpoint на R2
const client = new S3Client({
  region: 'auto',
  endpoint: `https://${CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
  },
});
```

## Visibility policy

| Тип файла | Bucket visibility | Access |
|-----------|-----------------|--------|
| Product images | Public | Direct CDN URL |
| Store logo / cover | Public | Direct CDN URL |
| Chat images (future) | Private | Signed URL (TTL 1h) |
| Seller verification docs | Private | Signed URL (admin only) |

## Последствия

- `media_files.bucket` — разные бакеты для public и private контента
- `media_files.visibility` = `public` | `protected` | `private`
- Protected/private → backend генерирует presigned URL при запросе
- Public → URL хранится напрямую в DB, отдаётся клиенту

## Альтернативы

- **AWS S3** — дороже из-за egress, но проверен. Можно использовать если R2 не устраивает.
- **Backblaze B2** — дёшево, S3-compatible, но менее популярен.
- **Self-hosted MinIO** — контроль, но операционная нагрузка. Не для MVP.
