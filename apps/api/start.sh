#!/bin/sh
set -e

echo "=== Migration status before deploy ==="
pnpm --filter db exec prisma migrate status || true

# 09.05.2026 (Polat) HOTFIX P3009: cart_refund_status_enums упала в проде,
# заблокировав все последующие миграции. Файл переписан идемпотентным —
# но Prisma не перезапустит её пока row в _prisma_migrations в failed-state.
# Этот блок один раз сбрасывает запись, потом noop (resolve idempotent).
echo "=== One-shot resolve of known-failed migrations (P3009 recovery) ==="
for FAILED_MIG in 20260509233000_cart_refund_status_enums; do
  pnpm --filter db exec prisma migrate resolve --rolled-back "$FAILED_MIG" 2>&1 \
    | grep -v -E "is not in a failed state|No migration to roll back" \
    || echo "  (noop) $FAILED_MIG не в failed-state"
done

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
