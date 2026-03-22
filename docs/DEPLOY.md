# Деплой на Render.com

## Требования
- Аккаунт на [render.com](https://render.com)
- Репозиторий запушен в GitHub (в организации)
- Аккаунт на [Cloudflare R2](https://cloudflare.com) для хранения медиа
- Аккаунт на [Eskiz.uz](https://eskiz.uz) для OTP SMS
- Telegram Bot Token (от @BotFather)

---

## Шаг 1 — Подключить GitHub репозиторий

1. Зайти на [dashboard.render.com](https://dashboard.render.com)
2. **New** → **Blueprint**
3. Выбрать репозиторий организации (например `savdo-org/savdo`)
4. Render найдёт `render.yaml` в корне и предложит создать все сервисы автоматически

> CI/CD настроится сам: каждый push в ветку `main` → автоматический деплой.

---

## Шаг 2 — Заполнить секреты

После создания Blueprint Render попросит заполнить переменные с `sync: false`.
Открыть каждый сервис → **Environment** и ввести:

| Переменная | Где взять |
|---|---|
| `JWT_ACCESS_SECRET` | Сгенерировать: `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | Сгенерировать: `openssl rand -base64 48` (другое значение!) |
| `APP_URL` | URL сервиса после создания, например `https://savdo-api.onrender.com` |
| `STORAGE_ENDPOINT` | Cloudflare R2 → Account → R2 → Manage API Tokens → endpoint |
| `STORAGE_ACCESS_KEY_ID` | Cloudflare R2 → API Token (R2 permission) |
| `STORAGE_SECRET_ACCESS_KEY` | Cloudflare R2 → API Token |
| `STORAGE_PUBLIC_URL` | Cloudflare R2 → Bucket → Settings → Public URL |
| `ESKIZ_EMAIL` | Eskiz.uz аккаунт — email |
| `ESKIZ_PASSWORD` | Eskiz.uz аккаунт — пароль |
| `TELEGRAM_BOT_TOKEN` | @BotFather в Telegram → `/newbot` |

> `DATABASE_URL` и `REDIS_URL` заполняются автоматически из `render.yaml` — не трогать.

---

## Шаг 3 — Настроить Cloudflare R2

1. Cloudflare Dashboard → **R2** → **Create bucket**
   - Создать два bucket: `savdo-public` и `savdo-private`
2. `savdo-public` → **Settings** → **Public access** → включить
   - Скопировать Public URL вида `https://pub-HASH.r2.dev`
3. **Manage R2 API Tokens** → **Create API Token**
   - Permissions: `Object Read & Write`
   - Scope: обоих bucket
   - Скопировать `Access Key ID` и `Secret Access Key`

---

## Шаг 4 — Первый деплой

После заполнения всех секретов нажать **Manual Deploy** → **Deploy latest commit**.

Render выполнит build command:
```
pnpm install
pnpm db:generate
pnpm db:migrate:deploy   ← применяет все миграции
pnpm --filter api build
```

Затем запустит:
```
node apps/api/dist/main.js
```

Проверить что API живой:
```
GET https://savdo-api.onrender.com/health
```
Ответ должен быть:
```json
{ "status": "ok", "info": { "database": { "status": "up" } } }
```

---

## Шаг 5 — Запустить seed (один раз)

После первого деплоя нужно заполнить глобальные категории.

В Render Dashboard → **savdo-api** → **Shell**:
```bash
DATABASE_URL=$DATABASE_URL NODE_ENV=production pnpm db:seed
```

> В production seed **не создаёт** тестового admin пользователя (guard по NODE_ENV).
> Создать admin вручную через Prisma Studio или прямым SQL если нужно.

---

## CI/CD — как работает

```
git push origin main
       ↓
Render webhook
       ↓
Build: pnpm install → db:generate → db:migrate:deploy → build
       ↓
Zero-downtime deploy (новый инстанс поднимается, старый гасится после /health OK)
       ↓
Автоматический откат если health check не прошёл
```

**Важно:** `db:migrate:deploy` запускается при каждом деплое — это безопасно, Prisma применяет только новые миграции.

---

## Переключение feature flags

Не нужно деплоить заново — изменить в Render Dashboard → **Environment**:

| Флаг | По умолчанию | Когда включать |
|---|---|---|
| `STORE_APPROVAL_REQUIRED` | `false` | Когда готова команда модерации |
| `TELEGRAM_NOTIFICATIONS_ENABLED` | `false` | После настройки Telegram Bot |
| `CHAT_ENABLED` | `true` | Сейчас включён |
| `OTP_REQUIRED_FOR_CHECKOUT` | `false` | После стабилизации OTP |
| `ANALYTICS_ENABLED` | `true` | Сейчас включён |

После изменения ENV Render автоматически перезапустит сервис.

---

## Мониторинг

- **Logs**: Render Dashboard → savdo-api → **Logs**
- **Health**: `GET /health` — проверяет PostgreSQL
- **Метрики**: Render Dashboard → **Metrics** (CPU, RAM, latency)

---

## Частые проблемы

**Build падает на `db:migrate:deploy`**
→ Проверить что `DATABASE_URL` правильно привязан к `savdo-db` в render.yaml

**API стартует но падает сразу**
→ Проверить Logs — скорее всего не заполнен один из обязательных ENV (JWT_ACCESS_SECRET и т.д.)

**OTP не приходят**
→ Проверить `ESKIZ_EMAIL` / `ESKIZ_PASSWORD`, убедиться что `DEV_OTP_ENABLED=false`

**Медиа не загружаются**
→ Проверить R2 credentials и что `savdo-public` bucket имеет публичный доступ
