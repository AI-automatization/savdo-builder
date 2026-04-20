# Stage 1: build
FROM node:20-alpine AS builder

RUN npm install -g pnpm@9.0.0

WORKDIR /app

COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./package.json
COPY apps/tma/package.json ./apps/tma/package.json

RUN pnpm install --filter tma --no-frozen-lockfile

COPY apps/tma/ ./apps/tma/

ARG VITE_API_URL=https://savdo-api-production.up.railway.app
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm --filter tma build

# Stage 2: serve
FROM nginx:1.27-alpine AS runner

COPY --from=builder /app/apps/tma/dist /usr/share/nginx/html
COPY apps/tma/nginx.conf /tmp/nginx.conf.template

# Remove default nginx conf (listens on 80, conflicts with Railway $PORT)
RUN rm /etc/nginx/conf.d/default.conf

EXPOSE 80

# envsubst substitutes only ${PORT}, leaving nginx vars ($uri etc.) intact
CMD ["/bin/sh", "-c", "envsubst '${PORT}' < /tmp/nginx.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
