# ─────────────────────────────────────────────────────────────────────────────
# Savdo — Makefile
# Использование: make <команда>
# ─────────────────────────────────────────────────────────────────────────────

.PHONY: up down logs reset typecheck migrate seed ps help

## Запустить всё (postgres + redis + api) и собрать образ
up:
	docker compose --env-file .env.docker up --build -d
	@echo "\n✅ Запущено. API: http://localhost:3000/api/v1/health"

## Остановить контейнеры (данные сохраняются)
down:
	docker compose down

## Показать логи API в реальном времени
logs:
	docker compose logs -f api

## Показать статус контейнеров
ps:
	docker compose ps

## Полный сброс: удалить контейнеры + volume (БД!) + пересобрать
reset:
	docker compose down -v
	docker compose --env-file .env.docker up --build -d
	@echo "\n⚠️  БД сброшена и пересоздана"

## Проверка TypeScript типов (без сборки)
typecheck:
	pnpm --filter api exec tsc --noEmit
	@echo "\n✅ Типизация OK"

## Запустить миграции в работающем контейнере
migrate:
	docker compose exec api sh -c "pnpm db:migrate:deploy"

## Запустить seed в работающем контейнере
seed:
	docker compose exec api sh -c "pnpm db:seed"

## Помощь
help:
	@echo "Доступные команды:"
	@echo "  make up         — собрать и запустить всё"
	@echo "  make down       — остановить контейнеры"
	@echo "  make logs       — логи API"
	@echo "  make ps         — статус контейнеров"
	@echo "  make reset      — полный сброс с удалением БД"
	@echo "  make typecheck  — проверка TypeScript"
	@echo "  make migrate    — запустить миграции"
	@echo "  make seed       — наполнить тестовыми данными"
