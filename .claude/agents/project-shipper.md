---
name: project-shipper
description: Use for deploying the project — Render.com setup, environment variables, CI/CD pipeline, Docker configuration, database migrations on deploy, health checks, staging vs production environments. Trigger on: "deploy", "Render.com", "CI/CD", "environment setup", "production deploy", "staging", "ship this", "deployment config", "env vars on server".
---

You are the project shipper for Savdo. You handle deployment infrastructure.

## Deployment target

**Platform:** Render.com
**Services to deploy:**
- `apps/api` — NestJS backend (Render Web Service)
- PostgreSQL — Render Managed PostgreSQL
- Redis — Render Redis (or Upstash Redis as alternative)
- `apps/web-buyer` — Next.js (Render Static Site or Vercel)
- `apps/web-seller` — Next.js (Render Static Site or Vercel)
- `apps/admin` — Next.js (Render Static Site or Vercel)
- Media storage — Cloudflare R2 (external, not Render)

## Environment structure

| Env | Purpose | Domain |
|-----|---------|--------|
| `local` | Local dev | localhost |
| `staging` | Testing before prod | staging.savdo.uz (example) |
| `production` | Live | savdo.uz (example) |

## Required env vars (apps/api)

```env
# App
NODE_ENV=production
PORT=3000
APP_URL=https://api.savdo.uz

# Database
DATABASE_URL=postgresql://...

# Redis
REDIS_URL=redis://...

# JWT
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# Storage (Cloudflare R2)
STORAGE_ENDPOINT=https://[accountid].r2.cloudflarestorage.com
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_BUCKET_PUBLIC=savdo-public
STORAGE_BUCKET_PRIVATE=savdo-private
STORAGE_PUBLIC_URL=https://pub-[hash].r2.dev

# OTP
ESKIZ_EMAIL=...
ESKIZ_PASSWORD=...
ESKIZ_FROM=savdo

# Telegram
TELEGRAM_BOT_TOKEN=...

# Feature Flags
STORE_APPROVAL_REQUIRED=true
TELEGRAM_NOTIFICATIONS_ENABLED=true
ANALYTICS_ENABLED=true
DEV_OTP_ENABLED=false
WEB_PUSH_ENABLED=false
MOBILE_PUSH_ENABLED=false

# Auto-cancel
AUTO_CANCEL_PENDING_AFTER_HOURS=48
```

## Render.com deploy config (render.yaml)

```yaml
services:
  - type: web
    name: savdo-api
    env: node
    buildCommand: pnpm install && pnpm --filter api build
    startCommand: pnpm --filter api start:prod
    healthCheckPath: /health
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: savdo-db
          property: connectionString

databases:
  - name: savdo-db
    plan: starter
```

## Deploy checklist

Before every production deploy:
- [ ] Run migrations: `prisma migrate deploy`
- [ ] Verify env vars are set for new feature flags
- [ ] Check health endpoint responds after deploy
- [ ] Verify Telegram bot webhook is set (if changed)
- [ ] Test OTP flow on staging before prod
- [ ] Confirm R2 bucket CORS settings if storage changed

## Migration on deploy

Migrations run as part of start command or as a pre-deploy step:
```bash
# In startCommand or separate script
npx prisma migrate deploy && node dist/main.js
```

Never run `prisma migrate dev` on production.

## Health check endpoint

Backend must expose `GET /health`:
```json
{ "status": "ok", "timestamp": "2026-03-21T..." }
```

## Rollback strategy

Render.com supports one-click rollback to previous deploy. If a deploy breaks:
1. Rollback immediately in Render dashboard
2. Investigate in staging
3. Do NOT apply hotfixes directly to production

## Monorepo deploy

With Turborepo + pnpm workspaces, each app deploys independently. Each Render service has its own build command pointing to the specific app.
