#!/bin/sh
set -e

echo "=== Migration status before deploy ==="
pnpm --filter db exec prisma migrate status || true

echo "=== Running Prisma migrations ==="
# 07.05 (Polat): убран `|| true` — раньше при failed миграции скрипт
# продолжал запуск API с расхождением schema↔DB → 500 на /auth/telegram
# и других endpoint'ах с include. Теперь fail-loudly: pod не стартует,
# healthcheck failed, Railway перезапускает. Лучше hard restart чем тихий
# broken API в production.
if ! pnpm --filter db exec prisma migrate deploy; then
  echo "!!! Prisma migrate deploy FAILED. Aborting startup."
  echo "!!! Check Railway DB → connect → 'SELECT * FROM _prisma_migrations ORDER BY started_at DESC LIMIT 5;'"
  echo "!!! And check this log above for the SQL error."
  exit 1
fi

echo "=== Migration status after deploy ==="
pnpm --filter db exec prisma migrate status || true

echo "=== dist contents ==="
ls apps/api/dist/

echo "=== dist/src contents ==="
ls apps/api/dist/src/

echo "=== Starting NestJS API ==="
exec node apps/api/dist/src/main.js
