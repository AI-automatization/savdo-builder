# Supabase Storage — настройка для savdo-builder

> Используем Supabase Storage как primary storage для фото товаров и чатов.
> Telegram channel остаётся fallback'ом если Supabase недоступен.

## ⚠️ Чистый старт без миграции данных

Поскольку проект ещё не в проде — **не делаем pg_dump со старой Railway БД**.
Просто меняем `DATABASE_URL` на Supabase, Prisma `migrate deploy` создаст
схему с нуля, сидер засеет 60+ категорий. Старые тестовые товары/заказы/фото
из Telegram channel **потеряются** — это OK, всё начинается чисто.

Если в каких-то старых записях `primaryImageUrlSnapshot` указывает на удалённый
файл (Telegram URL истёк, R2 не настроен) — UI покажет красивый placeholder
«📷 Нет фото» / «🗑 Фото удалено» / «⚠️ Фото недоступно» (см. `ImagePlaceholder`
+ `ProductImage` компоненты), а не сломается.

---

## 0. Что выбрать в "Connect to your project" (твой скрин)

**Это окно для DB Postgres connection**, НЕ для Storage. Storage настраивается отдельно (Project Settings → Storage).

Если ты будешь подключать Postgres из Railway:

- **Direct connection** ← выбирай это. Railway держит долгоживущие connection pool'ы, и Direct лучше всего подходит. URL вида `postgresql://postgres:[YOUR-PASSWORD]@db.<ref>.supabase.co:5432/postgres`.
- **Transaction pooler** — для serverless (Vercel functions). Не наш случай.
- **Session pooler** — только если Direct не работает из-за IPv6 (у Railway такое бывает редко, но возможно).

**Type: URI** (что и стоит) — корректно, прямо в `DATABASE_URL`.

---

## 1. Создание Storage bucket

1. Зайди в проект Supabase → **Storage** (левое меню) → **New bucket**.
2. Назови: `savdo-public` (или то что задашь в `STORAGE_BUCKET_PUBLIC`).
3. **Public bucket: ON** — обязательно, иначе фото не откроются по прямой ссылке. (У нас публичные товары.)
4. **File size limit**: 10 MB (соответствует `MAX_FILE_SIZE_BYTES` в коде).
5. **Allowed MIME types**: `image/jpeg, image/png, image/webp`.
6. Нажми **Save**.

Если планируешь приватные документы продавцов (`seller_doc`) — создай ещё один bucket `savdo-private` с **Public bucket: OFF**, и используй `STORAGE_BUCKET_PRIVATE`. Сейчас `seller_doc` тоже идёт в public — проверь требования.

---

## 2. Получение S3 credentials

Supabase даёт S3-compatible API. Наш `R2StorageService` это уже понимает.

1. Project Settings → **Storage** → **S3 connection** (внизу страницы).
2. Скопируй:
   - **Endpoint**: `https://<project-ref>.supabase.co/storage/v1/s3`
   - **Region**: то что показано (обычно `eu-central-1` или другое — копируй точно)
3. Жми **New access key** → дай имя (например `savdo-railway`) → **Create**.
4. Скопируй:
   - **Access key ID**
   - **Secret access key** (показывается ОДИН раз — сохрани сразу)

---

## 3. Настройка Railway env (api сервис)

В Railway → savdo-api → Variables добавь:

```bash
# S3-compatible storage (Supabase)
STORAGE_ENDPOINT=https://<project-ref>.supabase.co/storage/v1/s3
STORAGE_ACCESS_KEY_ID=<твой access key>
STORAGE_SECRET_ACCESS_KEY=<твой secret>
STORAGE_BUCKET_PUBLIC=savdo-public
STORAGE_BUCKET_PRIVATE=savdo-private

# Public URL для отдачи фото без proxy (быстрее для CDN)
STORAGE_PUBLIC_URL=https://<project-ref>.supabase.co/storage/v1/object/public/savdo-public
```

`<project-ref>` это поддомен типа `abcd1234efgh5678` — найдёшь в URL вкладки Supabase Dashboard.

После сохранения Railway автоматически перезапустит сервис.

---

## 4. Логика работы (как всё устроено)

В [`apps/api/src/modules/media/use-cases/upload-direct.use-case.ts`](../apps/api/src/modules/media/use-cases/upload-direct.use-case.ts):

```
client (TMA) → POST /api/v1/media/upload (multipart)
  ↓
  if R2/Supabase configured (STORAGE_ENDPOINT задан):
    → R2StorageService.uploadObject(bucket, "purpose/year/uuid.ext", buffer, mimeType)
    → MediaFile.bucket = "savdo-public", objectKey = "chat_photo/2026/abc-xyz.jpg"
    → return { mediaFileId, url: "/api/v1/media/proxy/<id>" }
  else fallback:
    → TelegramStorageService.uploadFile(...) (как было)
    → MediaFile.bucket = "telegram", objectKey = "tg:<file_id>"
```

При запросе `/api/v1/media/proxy/:id`:
- bucket=telegram → редирект на короткоживущий Telegram URL (~1ч)
- bucket=savdo-public → редирект на `STORAGE_PUBLIC_URL/<objectKey>` (стабильно, кешируется CDN)

---

## 5. Проверка после деплоя

1. Railway api → Logs → должно быть `R2 Storage` без warnings.
   - Если видишь `R2 Storage not configured (STORAGE_ENDPOINT missing or invalid)` — credentials не доехали.
2. Открой TMA → загрузи фото товара или фото в чат.
3. В Supabase Storage → bucket `savdo-public` → должна появиться папка `chat_photo/2026/...` с файлом.
4. Открой ссылку из приложения (DevTools → Network → /media/proxy/...) — должно редиректить на `https://<ref>.supabase.co/storage/v1/object/public/savdo-public/...` и отдавать картинку.

---

## 6. Откат на Telegram (если что-то пойдёт не так)

Удали в Railway env переменную `STORAGE_ENDPOINT` (или поставь пустое значение) и перезапусти. Сервис автоматически вернётся к Telegram channel storage. Старые фото в Supabase останутся доступны (proxy умеет работать с обоими бакетами одновременно).

---

## 7. Лимиты Supabase Free tier

- **1 GB storage** на проект
- **2 GB bandwidth** в месяц
- **500 MB file size** (нам хватает 10 MB)

Когда упрёшься — либо Pro plan ($25/мес), либо включишь автоматическое пережатие/resize в Supabase Image Transformation (доступно на Pro), либо мигрируешь на Cloudflare R2 ($0.015/GB/мес, бесплатные egress).
