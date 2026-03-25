FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/ packages/
COPY apps/api/ apps/api/
RUN npm install -g pnpm && pnpm install --frozen-lockfile
RUN pnpm db:generate
RUN pnpm --filter api build
EXPOSE 3000
CMD ["sh", "-c", "pnpm db:migrate:deploy && node apps/api/dist/main.js"]
