# ─────────────────────────────────────────────────────────────────────────────
# apps/admin — Vite SPA (React + TypeScript)
# Stage 1: builder через pnpm monorepo (нужен для @savdo/types и @savdo/ui)
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Workspace files для pnpm install. Build context = repo root.
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./package.json
COPY apps/admin/package.json ./apps/admin/package.json
# packages — workspace deps (типы + опционально UI)
COPY packages/types/package.json ./packages/types/package.json
COPY packages/ui/package.json ./packages/ui/package.json

RUN pnpm install --filter admin --no-frozen-lockfile

# Source code
COPY packages/ ./packages/
COPY apps/admin/ ./apps/admin/

# Public API URL — задаётся в Railway → admin service → Variables
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter admin build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: serve (nginx)
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf.template

# Remove default nginx conf (listens on 80, conflicts with Railway $PORT)
RUN rm -f /etc/nginx/conf.d/default.conf

EXPOSE 80

# envsubst подставляет ${PORT}; quote'им чтобы nginx-vars ($uri etc.) не задело
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
