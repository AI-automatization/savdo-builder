# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: build
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY apps/tma/package.json ./apps/tma/
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN pnpm install --no-frozen-lockfile --filter tma

COPY apps/tma/ ./apps/tma/

# VITE_API_URL передаётся как build arg → запекается в бандл
ARG VITE_API_URL=https://savdo-api-production.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter tma build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: serve с nginx
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Конфиг nginx: SPA + поддержка PORT из Railway
COPY apps/tma/nginx.conf /etc/nginx/templates/default.conf.template

COPY --from=builder /app/apps/tma/dist /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
