-- API-STOREFRONT-SEARCH-PERF-001: pg_trgm GIN indexes для ILIKE поиска.
--
-- Раньше `searchPublic` использовал `contains: q, mode: 'insensitive'`
-- → Prisma генерирует ILIKE → seqscan на 100k+ products был медленным.
--
-- pg_trgm + GIN index ускоряет ILIKE в 100-1000× для substring matches.
-- Trigram-based: разбивает строку на 3-char окна, индексирует их.
-- Минусы: index размером ~30-50% от colum size, write slowdown ~5-10%.
-- Для read-heavy storefront search это приемлемо.

-- Включаем extension (idempotent — если уже есть, пропустит).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Product search index (title + description в одном запросе через OR).
-- Отдельные индексы лучше combined GIN на (title || description) — Postgres
-- query planner сам выберет какой использовать.
CREATE INDEX IF NOT EXISTS "products_title_trgm_idx"
  ON "products" USING GIN ("title" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "products_description_trgm_idx"
  ON "products" USING GIN ("description" gin_trgm_ops)
  WHERE "description" IS NOT NULL;

-- Store search index (name + description + slug).
CREATE INDEX IF NOT EXISTS "stores_name_trgm_idx"
  ON "stores" USING GIN ("name" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "stores_description_trgm_idx"
  ON "stores" USING GIN ("description" gin_trgm_ops)
  WHERE "description" IS NOT NULL;

CREATE INDEX IF NOT EXISTS "stores_slug_trgm_idx"
  ON "stores" USING GIN ("slug" gin_trgm_ops);
