FROM node:20-alpine AS builder
WORKDIR /app/apps/admin

RUN npm install -g pnpm

COPY apps/admin/package.json ./
RUN pnpm install

COPY apps/admin ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/apps/admin/dist /usr/share/nginx/html
COPY apps/admin/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
