# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: builder
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Копируем всё нужное для install (кешируется если lock не менялся)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

RUN pnpm install --no-frozen-lockfile

# Копируем исходники
COPY packages/ packages/
COPY apps/api/ apps/api/

# Генерируем Prisma Client через pnpm exec в контексте пакета db
RUN pnpm --filter db exec prisma generate

RUN pnpm --filter api build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: runner (только prod зависимости + собранный код)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl wget
RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/db/package.json ./packages/db/
COPY packages/types/package.json ./packages/types/
COPY apps/api/package.json ./apps/api/

# prisma в dependencies — устанавливается здесь для generate и migrate:deploy
RUN pnpm install --no-frozen-lockfile --prod

# Prisma schema + миграции
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma

# Генерируем Prisma Client в runner (не нужна DB, только schema)
RUN pnpm --filter db exec prisma generate

# Собранный код
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3000

# migrate:deploy напрямую через prisma бинарник
CMD ["sh", "-c", "pnpm --filter db exec prisma migrate deploy && node apps/api/dist/src/main.js"]
