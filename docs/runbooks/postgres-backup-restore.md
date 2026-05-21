# Runbook — PostgreSQL Backup & Restore (savdo-builder)

> **ID:** `INFRA-BACKUP-RUNBOOK-001`
> **Owner:** Полат (SRE / DBA)
> **Source of truth:** `docs/V1.1/08_operations_model.md` декларирует daily PG
> dumps + monthly drill. Этот runbook — операционная реализация: что, как часто,
> кем и как проверяется.
> **Закрывает блокер:** `Backups / restore drill` из
> `docs/readiness/launch-readiness-2026-05-20.md` (Data integrity 7 → 8).

---

## 0. TL;DR

| Параметр | Значение |
|----------|----------|
| **Стратегия** | Defense-in-depth: Railway managed snapshots (platform-native) + еженедельный logical `pg_dump` в off-platform хранилище (R2 / Supabase / GitHub Release) |
| **RPO (Recovery Point Objective)** | **≤ 1 неделя** (худший случай: и Railway snapshot, и последний weekly dump → откат к предыдущему weekly dump) |
| **RTO (Recovery Time Objective)** | **30 минут** из Railway snapshot · **2 часа** из off-platform dump |
| **Daily** | Автоматический Railway Volume Snapshot (passive — мы только проверяем retention) |
| **Weekly** | Пятница 18:00 UZT (Asia/Tashkent) — `scripts/db/backup.sh` → off-platform |
| **Monthly drill** | Последняя пятница месяца — `scripts/db/restore-drill.sh` против локального `postgres:16-alpine` |
| **Off-platform target** | Cloudflare R2 bucket `savdo-backups` (region `auto`), bucket-lifecycle: 12 weeks |
| **Encryption at rest** | R2 SSE-S3 (managed) — `pg_dump` дополнительно gzip'ed внутри `--format=custom` |
| **Эскалация** | Полат → Азим → Railway Support (`support@railway.app`) |

---

## 1. Стратегия

### 1.1. Почему два слоя

Railway Postgres делает **Volume Snapshots** (managed). В Activity видно
строки вида `postgres-volume Backup created on schedule`. Это быстрый
recovery (минуты, in-place), **но**:

- Retention контролируется Railway, **не нами** (зависит от плана; по
  состоянию на 2026-05-20 — последние ~7 точек на проекте).
- Снапшоты живут в той же инфраструктуре Railway. Сценарий «аккаунт
  Railway скомпрометирован / billing-suspension / провайдер исчезает» —
  не покрыт.
- Снапшоты неdebuggable: нельзя «открыть и посмотреть до restore».

Поэтому добавляем **off-platform logical dump** через `pg_dump --format=custom`:

- Текстово/портативно: восстанавливается в любой Postgres 14+ (мы на 16).
- Хранится вне Railway → защита от platform-loss.
- Дёшево (R2: $0.015 / GB-месяц, без egress fees).
- Можно открыть `pg_restore --list` локально и посмотреть состав без
  восстановления.

### 1.2. Что НЕ делаем (явно)

- **Не** делаем continuous WAL archiving / PITR. RPO 24 часа достаточен
  для MVP с COD-платежами. После подключения Click/Payme (`MARKETING-PAYMENT-CLICK-PAYME-001`)
  — пересмотреть в сторону PITR.
- **Не** реплицируем read-replica. Railway PG plugin сейчас single-instance.
- **Не** держим backup-файлы в git (бинари + размер).

---

## 2. Backup procedures

### 2.1. Railway native snapshots (daily, automatic)

Не требует наших действий, но раз в неделю **проверяем**:

1. Open <https://railway.app> → проект **savdo-builder** → сервис **Postgres**.
2. Tab **Backups** (или **Activity** → фильтр `Backup`).
3. Убедиться, что **сегодняшняя дата** есть в списке. Если нет за >24 часа —
   эскалация (см. §6).
4. Зафиксировать **retention window** (сколько точек видно). На текущий
   план — обычно 7. Если сократилось — проверить тариф в Settings →
   Plan.

> **Куда смотреть в UI:** Postgres service → Settings → Backups (или
> «Volume snapshots» в зависимости от версии Railway UI). Retention здесь
> же.

### 2.2. Weekly logical dump (пятница 18:00 UZT)

**Кто:** Полат вручную (пока нет CI-cron — см. §8 «Календарь»).
**Скрипт:** `scripts/db/backup.sh`.

```bash
# Production dump → локальный .dump файл
DATABASE_URL='postgresql://postgres:***@<host>.railway.app:5432/railway' \
  bash scripts/db/backup.sh

# С автозагрузкой в R2 (если AWS_ACCESS_KEY_ID / R2_BACKUP_BUCKET выставлены):
DATABASE_URL='postgresql://postgres:***@<host>.railway.app:5432/railway' \
R2_BACKUP_BUCKET=savdo-backups \
R2_ENDPOINT_URL=https://<account>.r2.cloudflarestorage.com \
AWS_ACCESS_KEY_ID=*** AWS_SECRET_ACCESS_KEY=*** \
  bash scripts/db/backup.sh --upload
```

Команда внутри (как делается):

```bash
pg_dump \
  --no-owner --no-privileges \
  --format=custom \
  --file=savdo-YYYYMMDD-HHMMSS.dump \
  "$DATABASE_URL"
```

**Где брать `DATABASE_URL`:** Railway → сервис `savdo-api` → **Variables**
→ скопировать `DATABASE_URL` (это reference на `${{Postgres.DATABASE_URL}}`).
Для прямого доступа к Postgres снаружи нужен **public TCP endpoint** —
Railway → Postgres → **Networking** → **Public Networking → Enable**.
Если public networking отключён, дамп снимается с машины, имеющей доступ
в Railway internal network (например, через `railway shell`).

**Куда складывается:**

- Локально: `backups/savdo-YYYYMMDD-HHMMSS.dump` (gitignored).
- R2 (опционально): `s3://savdo-backups/weekly/savdo-YYYYMMDD-HHMMSS.dump`.

**Verification (после dump):**

```bash
pg_restore --list backups/savdo-YYYYMMDD-HHMMSS.dump | head -50
ls -lh backups/savdo-*.dump
```

Размер не должен внезапно упасть на >50% от предыдущего (детектор
повреждённого dump'а).

### 2.3. Альтернативные off-platform targets

Если R2 недоступен / не настроен — приемлемые альтернативы:

| Target | Команда | Плюсы | Минусы |
|--------|---------|-------|--------|
| **Cloudflare R2** (рекомендация) | `aws s3 cp ... --endpoint-url https://...r2.cloudflarestorage.com` | $0 egress, дёшево | требует AWS CLI |
| **Supabase Storage** | через `supabase-js` SDK | уже используется проектом для media | bucket overhead, 50MB API limit на upload (нужен chunked) |
| **GitHub Release (приватный)** | `gh release create v-backup-YYYYMMDD ./savdo-*.dump` | бесплатно для приватных репо, версионирование «из коробки» | 2GB file limit, GH API rate-limit |
| **Local cold storage** | `cp savdo-*.dump /Volumes/Backup/savdo/` | zero-cost | человеческий фактор |

Скрипт `backup.sh` поддерживает только R2 «из коробки» (через
`AWS_ACCESS_KEY_ID`). Остальные target'ы — manual в первую очередь.

---

## 3. Restore procedures

### 3.1. Из Railway snapshot (rollback, RTO ~30 мин)

> Используем, когда нужно откатить **всю прод-БД** на N часов назад
> (схема + данные). Все сервисы, читающие БД, увидят откат немедленно.

1. **Объявить maintenance**:
   - Включить maintenance-баннер на web-buyer / web-seller (если есть)
     или поставить `MAINTENANCE_MODE=true` env var.
   - Сообщить в `@savdo_support` Telegram-чат: «Технические работы 30 мин».
2. **Остановить writers**:
   - Railway → `savdo-api` → **Settings → Stop** (предотвращает запись
     во время restore).
   - Опционально — `telegram-app`, `savdo-builder_ADMIN` тоже остановить,
     чтобы не было ошибок 502 на пользователях.
3. **Восстановить snapshot**:
   - Railway → Postgres → **Backups** → выбрать нужную точку → **Restore**.
   - Подтвердить (Railway создаёт новый volume и переключает Postgres).
   - Дождаться `Restoring → Online` (обычно 2-5 минут).
4. **Запустить writers**:
   - `savdo-api` → **Restart** (или **Redeploy** последнего деплоя).
   - Проверить `/api/v1/health` → `ok`.
   - Включить `telegram-app`, admin обратно.
5. **Smoke check**:
   - `curl https://savdo-api-production.up.railway.app/api/v1/health`
   - `curl https://savdo-api-production.up.railway.app/api/v1/storefront/featured`
   - Открыть admin → Dashboard → убедиться что метрики разумные.
6. **Снять maintenance**, написать post-mortem в `analiz/logs.md`.

### 3.2. Из off-platform dump (`pg_restore`, RTO ~2 часа)

> Используем, когда **Railway snapshot недоступен** (platform outage,
> account locked) или нужно восстановить в **другую инфраструктуру**.

**Целевая БД** должна быть пустой (или с `--clean --if-exists` мы дропнем
её содержимое).

```bash
# Восстановление в свежий Postgres
TARGET_DB='postgresql://savdo:savdo@new-host:5432/savdo' \
DUMP=backups/savdo-20260516-180000.dump \
  pg_restore \
    --clean --if-exists \
    --no-owner --no-privileges \
    --exit-on-error \
    --jobs=4 \
    -d "$TARGET_DB" \
    "$DUMP"

# Проверка
psql "$TARGET_DB" -c "SELECT COUNT(*) FROM users;"
psql "$TARGET_DB" -c "SELECT COUNT(*) FROM orders;"
```

**Шаги:**

1. Поднять новый Postgres (Railway: new project → add Postgres plugin; или
   локально: `docker run -d -p 5432:5432 postgres:16-alpine`).
2. Применить миграции **не нужно** — `pg_dump --format=custom` хранит
   полную схему + данные.
3. `pg_restore` (команда выше).
4. Прогнать integrity check (см. §4).
5. Переключить `DATABASE_URL` в Railway-сервисах api / admin / TMA на новый
   адрес. **Это последний шаг** — до этого все сервисы пишут в старую БД.
6. `savdo-api` → **Redeploy** (подхватит новый `DATABASE_URL`).

### 3.3. Восстановление в локальный staging

См. §4 «Restore drill» ниже — это и есть процедура с extra integrity-check.

---

## 4. Restore drill (monthly)

> **Цель:** убедиться, что dump'ы реально восстанавливаются и данные
> целостны. **Без drill'а backup-стратегия — это бумажка.**

**Когда:** последняя пятница месяца, после 20:00 UZT (пик нагрузки спал).
**Кто:** Полат.
**Длительность:** ~30 минут.

### 4.1. Pre-conditions

- Установлены `pg_dump`, `pg_restore`, `psql` локально (`brew install
  postgresql@16` / `apt install postgresql-client-16` / WSL2 на Windows).
- Docker запущен.
- Свежий dump (с предыдущей пятницы) на руках в `backups/`.

### 4.2. Полная процедура (autopilot через `restore-drill.sh`)

```bash
# 1. Снять свежий dump из прода (если ещё не снят)
DATABASE_URL='postgresql://postgres:***@host.railway.app:5432/railway' \
  bash scripts/db/backup.sh

# 2. Поднять локальный staging Postgres
docker run -d --name savdo-staging-pg \
  -e POSTGRES_USER=savdo \
  -e POSTGRES_PASSWORD=savdo \
  -e POSTGRES_DB=savdo_staging \
  -p 55432:5432 \
  postgres:16-alpine

# 3. Запустить drill
bash scripts/db/restore-drill.sh \
  --dump backups/savdo-20260516-180000.dump \
  --target-db 'postgresql://savdo:savdo@localhost:55432/savdo_staging' \
  --source-db "$DATABASE_URL"   # опционально, для diff row counts

# 4. Cleanup
docker rm -f savdo-staging-pg
```

Скрипт `restore-drill.sh` сам:

1. Дропает целевую БД (`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`).
2. Запускает `pg_restore --clean --if-exists`.
3. Выполняет `scripts/db/integrity-check.sql`.
4. Сравнивает row counts с `--source-db` (если передан) — diff не должен
   превышать порог (`MAX_ROWCOUNT_DRIFT_PCT`, default `5%` — small drift OK,
   т.к. между dump-time и check-time пройдут секунды).
5. Печатает JSON-репорт в stdout, exit code 0 = всё ок, 1 = что-то сломалось.

### 4.3. Что проверяем (минимум)

- Все ключевые таблицы существуют и доступны: `users`, `sellers`, `stores`,
  `products`, `orders`, `order_items`, `cart_items`, `admin_users`,
  `global_categories`, `category_filters`.
- **Row counts** этих таблиц в target ≈ source (diff ≤ 5%).
- **Reference data**: `global_categories.COUNT > 0` (seed применён),
  `category_filters.COUNT > 0`.
- **FK integrity** (нет orphans): `order_items.orderId` всегда указывает на
  существующий `orders.id`; `cart_items.cartId` → `carts.id`; `orders.storeId`
  → `stores.id`; `orders.sellerId` → `sellers.id`.
- **Migrations applied**: `_prisma_migrations.COUNT >= 29` (последний
  baseline на 2026-05-20).
- **Admin users**: `admin_users.COUNT >= 1` (super_admin как минимум).

Все эти проверки запечены в `scripts/db/integrity-check.sql`.

### 4.4. Что фиксируем после drill

В `analiz/logs.md` запись:

```markdown
## YYYY-MM-DD [INFRA-BACKUP-DRILL-NNN] Restore drill — PASS|FAIL
- **Статус:** ✅ PASS / 🔴 FAIL
- **Dump:** savdo-YYYYMMDD-HHMMSS.dump (size: NN MB)
- **Restore time:** N min
- **Integrity diff:** all tables within 5% / users +1 row / orders +3 rows (live diff)
- **Issues:** (если FAIL — что сломалось, что починили)
```

И вызов Obsidian:

```
pwsh obsidian-note.ps1 todo savdo-builder \
  "Restore drill YYYY-MM-DD result" \
  "PASS|FAIL details + drift report"
```

---

## 5. RPO / RTO — точки рестора

| Сценарий | RPO (потеря данных) | RTO (время восстановления) | Источник |
|----------|---------------------|----------------------------|----------|
| Railway snapshot восстановим | до 24 ч | 30 мин | §3.1 |
| Railway snapshot НЕТ, weekly dump есть | до 7 дней | 2 ч | §3.2 |
| Weekly dump в R2 испорчен, есть предыдущий | до 14 дней | 2 ч + ручная починка | §3.2 + manual |
| Полная потеря (нет ни одного backup'а) | **навсегда** | — | — (это то, что drill предотвращает) |

**RPO 7 дней** считается приемлемым для MVP с **cash-on-delivery
платежами и без онлайн-эквайринга** (ADR-003: `PAYMENT_ONLINE_ENABLED=false`).
После подключения Click/Payme (`MARKETING-PAYMENT-CLICK-PAYME-001`) —
**пересмотреть в сторону PITR (RPO ≤ 1 час)**.

---

## 6. Календарь backup-операций

| Период | Что | Кто | Триггер |
|--------|-----|-----|---------|
| Daily (автоматически) | Railway Volume Snapshot | Railway | passive — проверяем 1×/неделя |
| Weekly **(Friday 18:00 UZT)** | `scripts/db/backup.sh --upload` | Полат | manual calendar reminder |
| Weekly **(Friday 18:30 UZT)** | проверить, что dump видно в R2 (`aws s3 ls s3://savdo-backups/weekly/`) | Полат | sanity check |
| Monthly **(last Friday)** | `scripts/db/restore-drill.sh` | Полат | manual; результат → `analiz/logs.md` |
| Quarterly | Review retention в Railway + R2 lifecycle policy | Полат | calendar |

> **План автоматизации** (post-MVP): перевести weekly dump на GitHub
> Actions cron + R2 upload. Сейчас manual — потому что `DATABASE_URL` не
> хочется коммитить в GitHub Secrets без секрет-сканера baseline'а
> (`SEC-AUDIT-04`).

---

## 7. Аварийный decision tree

```
Прод-БД недоступна / повреждена / удалена
│
├─ Railway Postgres статус == Online?
│  ├─ ДА → данные есть, но битые?
│  │       ├─ ДА → §6.A (восстановление из snapshot — outage уровня "bad query/migration")
│  │       └─ НЕТ → восстанавливать не из чего, эскалация
│  └─ НЕТ → Postgres сервис лёг
│           │
│           ├─ Railway snapshot доступен (последние 24ч)?
│           │  ├─ ДА → §3.1 (Restore from snapshot, RTO 30 мин)
│           │  └─ НЕТ → §6.B
│           │
│           └─ §6.B: off-platform dump есть?
│                    ├─ ДА → §3.2 (pg_restore в новый Postgres, RTO 2 ч)
│                    └─ НЕТ → ⛔ DATA LOSS — пишем post-mortem, эскалация
│
└─ Integrity-check после восстановления PASS?
   ├─ ДА → снимаем maintenance, post-mortem в analiz/logs.md
   └─ НЕТ → повторить с предыдущего dump'а / snapshot'а
```

**6.A. «Битые данные, инфра жива»** — типичный сценарий: ошибочная
миграция / `DELETE без WHERE` / админ нажал не туда.

1. Зафиксировать timestamp инцидента (когда **последний раз были хорошие
   данные**).
2. Restore Railway snapshot **ДО** этого timestamp'а (§3.1).
3. Если потери были в специфичной таблице — selective restore:
   `pg_restore --table=orders backups/...dump` после downgrade `savdo-api`
   до maintenance-mode.

**6.B. «Платформа лежит, нужно мигрировать»**:

1. Завести новый Postgres (Railway new project; или Supabase Pro;
   или Neon).
2. `pg_restore` из последнего dump'а (§3.2).
3. Сменить `DATABASE_URL` в Railway env всех сервисов.
4. Redeploy.

---

## 8. Эскалация / контакты

| Уровень | Кто | Канал | Когда |
|---------|-----|-------|-------|
| L1 | **Полат** | Telegram personal | Сразу при любом incident'е БД |
| L2 | **Азим** | Telegram personal | Если Полат недоступен >30 мин или incident затрагивает web-* |
| L3 | **Railway Support** | <support@railway.app> + Discord [`railway-app`](https://discord.gg/railway) | Если Railway сам залегает (Status: <https://status.railway.app>) |

**Шаблон сообщения Railway Support:**

```
Project: savdo-builder (id: <project-id из URL>)
Service: Postgres
Issue: <short description>
Impact: production down, <X> sellers / <Y> buyers affected
Timeline:
  HH:MM UTC — detected
  HH:MM UTC — attempted restore from snapshot
  HH:MM UTC — escalating
Logs: <paste relevant Deploy Logs>
What we tried: <step-by-step>
```

---

## 9. Связанные документы

- `docs/V1.1/08_operations_model.md` — декларация SLA + backup policy
- `docs/runbooks/railway-recovery.md` — восстановление упавшего API/admin/TMA
- `docs/readiness/launch-readiness-2026-05-20.md` — readiness audit (где
  данный backlog отслеживается)
- `scripts/db/backup.sh` — weekly dump script
- `scripts/db/restore-drill.sh` — monthly drill script
- `scripts/db/integrity-check.sql` — integrity queries
- `analiz/logs.md` — журнал инцидентов и drill-результатов
- `.env.example` — DATABASE_URL + R2_BACKUP_BUCKET переменные

---

## 10. Changelog runbook'а

| Дата | Автор | Изменение |
|------|-------|-----------|
| 2026-05-20 | Полат (SRE) | Initial version — закрытие блокера `Backups / restore drill` из launch-readiness 2026-05-20. |
