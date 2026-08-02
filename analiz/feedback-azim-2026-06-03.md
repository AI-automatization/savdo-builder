# Просьбы к Азиму — 03.06.2026

> От: Полат. По: открытые таски из `analiz/tasks.md` + новые из ревью 02.06.

## P0 (блокеры платного launch)

### 1. BILLING-MACHINE-001 — аудит 6 вопросов §12 спеки
- `docs/business/billing-machine-spec-v1-2026-05-31.md` § 12
- Полат сделал backend MVP, ждёт твоего фронт-аудита и согласия по 6 открытым вопросам
- Расхождение тарифов: код = 99k/299k/899k, бизнес-план v2 = 200k/500k/1.5M — выровнять

### 2. LEGAL-OFFER-REQUISITES-001 — реквизиты юр.лица — НА ТЕБЕ (lead)
- По CLAUDE.md (с 02.06.2026): бизнес/монетизация/legal — твоя зона как lead.
  Полат — инженерия (не owns бизнес-решения).
- Юр.лицо нужно зарегистрировать на тебя (ИП через my.gov.uz, ОКЭД 62.01
  или 47.91, ЭЦП через e-imzo.uz).
- Потом расчётный счёт в банке (UZS) — это обязательно для Click/Payme
  Phase 2 (см. п.7 архитектурных вопросов).
- Когда будут реквизиты — пришли их, Полат за 5 минут вставит в
  `apps/web-buyer/src/app/(legal)/offer/page.tsx` (или эквивалент).
- Phase 2 платежей заморожен пока ИП не открыт — это блокер платного launch.

## P1 (внешние setup)

### 3. INFRA-BACKUP-R2-SETUP-001 — Cloudflare R2
- Аккаунт Cloudflare у тебя. Создать bucket `savdo-backups` (Standard, auto region)
- API Token: scope только этому bucket, R/W
- Lifecycle: `weekly/*` → 84 дня retention
- Передать Полату 4 credentials: Access Key, Secret, Endpoint URL, bucket name
- Полат вставит в Railway env savdo-api: R2_BACKUP_BUCKET, R2_ENDPOINT_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY

### 4. BRAND-LOGO-SVG-CREATE-001 — SVG-исходники лого
- JPG есть в `docs/brand/assets/maxsavdo/`. Нужны SVG.
- Варианты: Vectorizer.ai → почистить в Figma; либо freelancer на Kwork
- Файлы нужны: `logo-mark.svg`, `logo-wordmark.svg`, `logo-lockup.svg`, `logo-app-icon.svg`
- Положить в `docs/brand/assets/maxsavdo/`, JPG в `originals/`

## Информация для тебя

### 5. Полат закрыл за эту сессию (главное)
- Все 4 BRAND series (TG-bot copy, admin Dark Luxury, API metadata, email N/A)
- DRY-аудит + все 8 DUP-рефакторов (~700 строк дубля убрано)
- packages/types оживили — теперь admin импортирует DTO напрямую (не дублирует)
- Hidden DoS fix в moderation.repository (limit cap missing — pre-existing bug)
- DomainException.httpStatus добавлен — extend-trial.spec теперь зелёный (835/835)
- TMA design-v2 миграция запущена параллельно (другая сессия)
- Checkout-500 расследование в работе (workflow с adversarial verify)

### 6. Что НЕ закрыто и кто отвечает
- INFRA-BACKUP-DRILL-FIRST-RUN-001 — Полат (нужен Docker + DATABASE_PUBLIC_URL)
- TMA pickup/totalStock/light-theme — Полат (после P0 checkout-500)
- UptimeRobot + Sentry alerts setup — Полат, потом Sentry DSN ему

### 7. Открытые архитектурные вопросы
- Тарифный mix Year 2 (расчёт vs план расходятся ~9%) — нужно сверить с тобой
- $5k MRR цель — расчёт говорит 180 sellers, план говорит 50 — уточнить
- Phase 2 (Click+Payme) — заморожено до открытия счёта (cм. п.2)
