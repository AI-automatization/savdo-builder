# Stage 1: build
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./package.json
COPY apps/tma/package.json ./apps/tma/package.json

RUN pnpm install --filter tma --frozen-lockfile

COPY apps/tma/ ./apps/tma/

ARG VITE_API_URL=https://savdo-api-production.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter tma build

# Stage 2: serve
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/tma/dist /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "PORT=${PORT:-80}; echo \"server { listen $PORT; server_name _; root /usr/share/nginx/html; index index.html; location / { try_files \\$uri \\$uri/ /index.html; } gzip on; gzip_types text/plain text/css application/javascript application/json; }\" > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
