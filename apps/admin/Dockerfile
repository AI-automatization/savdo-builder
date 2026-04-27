FROM node:20-alpine AS builder
WORKDIR /app

# Build context = repo root (Railway always uses repo root for Docker builds)
COPY apps/admin/package.json ./
COPY apps/admin/package-lock.json* ./
RUN npm install

COPY apps/admin/ .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf.template
EXPOSE 80
CMD ["/bin/sh", "-c", "envsubst '$PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
