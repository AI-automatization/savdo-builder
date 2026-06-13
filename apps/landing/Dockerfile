# syntax=docker/dockerfile:1.6
# Build context = repo root (Railway reads from monorepo root, same as api/tma)

# ── Stage 1: deps ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app/apps/landing

COPY apps/landing/package.json apps/landing/package-lock.json* ./
RUN npm install --legacy-peer-deps

# ── Stage 2: builder ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app/apps/landing

ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_BOT_USERNAME
ARG NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_BOT_USERNAME=$NEXT_PUBLIC_BOT_USERNAME
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/apps/landing/node_modules ./node_modules
COPY apps/landing/ .

RUN npm run build

# ── Stage 3: runner ───────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN apk add --no-cache curl

COPY --from=builder --chown=node:node /app/apps/landing/.next/standalone ./
COPY --from=builder --chown=node:node /app/apps/landing/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/apps/landing/public ./public

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3000/ || exit 1

CMD ["node", "server.js"]
