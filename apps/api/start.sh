#!/bin/sh
set -e

echo "=== Running Prisma migrations ==="
pnpm --filter db exec prisma migrate deploy || true

echo "=== dist contents ==="
ls apps/api/dist/

echo "=== dist/src contents ==="
ls apps/api/dist/src/

echo "=== Starting NestJS API ==="
exec node apps/api/dist/src/main.js
