FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/web-seller/ apps/web-seller/
RUN pnpm install --no-frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter web-seller build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web-seller/.next/standalone ./
COPY --from=builder /app/apps/web-seller/.next/static ./apps/web-seller/.next/static
COPY --from=builder /app/apps/web-seller/public ./apps/web-seller/public

# PORT задаёт Railway сам через env — не хардкодим
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web-seller/server.js"]
