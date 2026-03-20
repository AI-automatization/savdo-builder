# 14_devops_infra.md

## 1. DevOps and Infrastructure Overview

DevOps слой в этом проекте — это не просто “запустить сервер”, а основа:

- стабильной работы backend
- быстрой разработки команды
- безопасного хранения данных
- масштабирования продукта
- контроля ошибок и логов
- доставки новых версий

На V0.1 инфраструктура должна быть:
- простой
- предсказуемой
- production-ready
- без overengineering

Главная ошибка стартапов:
либо делают слишком сложную инфраструктуру → тормозят запуск  
либо делают слишком слабую → всё падает при росте  

Нужно найти баланс.

---

## 2. Core Infrastructure Components

На V0.1 система должна включать:

- Backend API (NestJS)
- PostgreSQL database
- Redis (queues + realtime support)
- Object Storage (S3-compatible)
- Mobile/Web clients
- Admin panel
- Queue workers
- Reverse proxy / gateway
- Logging system

---

## 3. Environment Strategy

## 3.1 Required Environments

Минимум:

- local
- staging
- production

## 3.2 Local
Для разработки:
- docker-based services
- mock или dev keys
- local DB
- local Redis
- MinIO (если нужно storage)

## 3.3 Staging
- максимально похож на production
- используется для тестирования
- интеграции
- QA

## 3.4 Production
- стабильный
- защищённый
- с мониторингом
- с backup-стратегией

---

## 4. Backend Deployment

## 4.1 Recommended Approach

- Docker контейнеры
- один основной API сервис
- отдельный worker сервис

## 4.2 Services

```bash
/api
/worker

4.3 Why Separate Worker

Потому что:

очереди не должны блокировать API

можно масштабировать независимо

стабильнее при нагрузке

5. Database (PostgreSQL)
5.1 Requirements

отдельный managed instance или VPS

регулярные backups

connection pooling

индексирование с начала

5.2 Backup Strategy

daily backups

retention минимум 7–14 дней

manual snapshot before major deploys

5.3 Migration Rules

только через migrations

никакого ручного изменения схемы

version-controlled

6. Redis
6.1 Usage

Redis используется для:

BullMQ (очереди)

realtime adapter (в будущем)

кеши (ограниченно)

6.2 Deployment

отдельный instance

не shared с другими сервисами

persistence optional but recommended

7. SMS Provider (OTP)
7.1 Required

Для Узбекистана используется локальный SMS-провайдер.

**Рекомендуемый провайдер: Eskiz.uz**
- Основной локальный провайдер
- Хорошее покрытие всех операторов UZ
- REST API
- Env: `SMS_PROVIDER=eskiz`, `ESKIZ_EMAIL`, `ESKIZ_PASSWORD`

**Резервный: Playmobile**
- Второй по популярности
- Использовать как fallback если Eskiz недоступен

7.2 Integration Rules

- OTP код не логировать
- rate limit на уровне backend (не полагаться только на провайдера)
- в dev/local режиме — OTP выводить в console log, не отправлять SMS
- env `SMS_DRY_RUN=true` для dev environment

7.3 Env Variables

```
SMS_PROVIDER=eskiz
ESKIZ_EMAIL=...
ESKIZ_PASSWORD=...
SMS_DRY_RUN=false
SMS_FROM=Savdo
```

---

8. Storage (S3 Compatible)
8.1 Options

AWS S3

Cloudflare R2

MinIO (dev)

8.2 Rules

не хранить файлы в backend контейнере

разделять public и private

использовать CDN для public

8. Reverse Proxy
8.1 Required

Nginx / Cloudflare / similar

8.2 Responsibilities

HTTPS termination

routing

rate limiting

basic protection

9. Domain and SSL
9.1 Required

HTTPS всегда

SSL через Let's Encrypt или provider

9.2 Domains

api.domain.com

app.domain.com

admin.domain.com

10. CI/CD
10.1 Goals

автоматический деплой

быстрый rollback

стабильность

10.2 Recommended Stack

GitHub Actions / GitLab CI

10.3 Pipeline Steps

install deps

run lint

run tests

build

docker build

deploy

11. Deployment Strategy
11.1 Simple Strategy (V0.1)

single server or small cluster

docker compose or simple orchestrator

manual scaling

11.2 Rolling Updates

avoid downtime

deploy new container

stop old

12. Scaling Strategy
12.1 V0.1

vertical scaling first

more CPU/RAM

12.2 Later

horizontal scaling API

Redis adapter

separate services

13. Logging
13.1 Required

structured logs

request logs

error logs

queue logs

13.2 Tools

pino

winston

13.3 Storage

local files + cloud logging later

14. Monitoring
14.1 Minimum

uptime monitoring

error tracking

basic metrics

14.2 Tools

Sentry (errors)

UptimeRobot or similar

15. Alerts
15.1 Must Have

server down

API errors spike

DB connection issues

16. Security
16.1 Required

HTTPS

rate limiting

input validation

secrets in env

no secrets in code

16.2 Secrets

.env files

secret manager later

17. Rate Limiting
17.1 Needed for

auth endpoints

OTP requests

public APIs

18. Backups
18.1 Must Backup

PostgreSQL

important configs

18.2 Not Required

cache (Redis)

temporary files

19. Cron Jobs
19.1 Required Jobs

clean expired OTP

clean stale carts

retry failed jobs

cleanup media

20. Dev Workflow
20.1 Local Setup

docker compose

hot reload

shared env config

20.2 Branch Strategy

main

develop optional

feature branches

21. Versioning
21.1 API Version

/api/v1/

21.2 Release Strategy

small frequent releases

no big bang deploys

22. Failure Handling
22.1 Must Handle

DB down

Redis down

storage failure

push provider failure

22.2 Strategy

retries

fallback

logging

23. Cost Strategy
23.1 V0.1

минимальные ресурсы

не overprovision

23.2 Scale Later

only when needed

24. Observability
24.1 What to Track

requests

errors

queue jobs

latency

25. Developer Experience
25.1 Must Have

easy local setup

clear env config

simple deploy

logs readable

26. Future Improvements

Kubernetes

autoscaling

service mesh

distributed tracing

advanced monitoring

27. Final DevOps Rules

простота > сложность

стабильность > хайп технологии

логирование обязательно

очереди отдельно

бэкапы обязательны

безопасность с первого дня

Главная цель DevOps слоя:
обеспечить стабильную, безопасную и управляемую работу системы, чтобы продукт мог расти без постоянных падений и ручных фиксов.