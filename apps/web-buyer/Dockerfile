FROM node:20-alpine AS base
RUN npm install -g pnpm

# ── deps ──────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/web-buyer/ apps/web-buyer/
RUN pnpm install --no-frozen-lockfile

# ── builder ───────────────────────────────────────────────────────────────────
FROM deps AS builder
WORKDIR /app
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BUYER_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BUYER_URL=$NEXT_PUBLIC_BUYER_URL
RUN pnpm --filter web-buyer build

# Диагностика: показать структуру standalone в build logs
RUN echo "=== standalone structure ===" && \
    find /app/apps/web-buyer/.next/standalone -maxdepth 3 -name "*.js" | head -20 && \
    echo "=== end ==="

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/web-buyer/.next/standalone ./
COPY --from=builder /app/apps/web-buyer/.next/static ./.next/static
COPY --from=builder /app/apps/web-buyer/public ./public

# PORT задаёт Railway сам через env — не хардкодим
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
