-- ─────────────────────────────────────────────────────────────────────────────
-- savdo-builder — DB integrity check
--
-- Используется в:
--   - scripts/db/restore-drill.sh (monthly drill)
--   - manual `psql $URL -f scripts/db/integrity-check.sql`
--
-- Формат вывода: `metric|value` (через `psql -A -F'|' -t -X`).
-- Каждая строка независима — restore-drill.sh парсит построчно.
--
-- ВАЖНО: Prisma использует camelCase для имён колонок без @map → все ссылки
-- на колонки в кавычках ("buyerId", "storeId", ...). Имена таблиц snake_case
-- (@@map).
--
-- Convention:
--   - count_*       — row counts по ключевым таблицам (нужно >0 для reference data)
--   - orphan_*      — FK-orphans (нужно строго 0; иначе drill FAIL)
--   - migrations_*  — applied prisma migrations (>0)
-- ─────────────────────────────────────────────────────────────────────────────

\pset footer off
\pset border 0

-- ── Row counts по ключевым таблицам ───────────────────────────────────────
SELECT 'count_users'              AS metric, COUNT(*)::text AS value FROM users;
SELECT 'count_buyers'             AS metric, COUNT(*)::text AS value FROM buyers;
SELECT 'count_sellers'            AS metric, COUNT(*)::text AS value FROM sellers;
SELECT 'count_stores'             AS metric, COUNT(*)::text AS value FROM stores;
SELECT 'count_products'           AS metric, COUNT(*)::text AS value FROM products;
SELECT 'count_product_variants'   AS metric, COUNT(*)::text AS value FROM product_variants;
SELECT 'count_orders'             AS metric, COUNT(*)::text AS value FROM orders;
SELECT 'count_order_items'        AS metric, COUNT(*)::text AS value FROM order_items;
SELECT 'count_carts'              AS metric, COUNT(*)::text AS value FROM carts;
SELECT 'count_cart_items'         AS metric, COUNT(*)::text AS value FROM cart_items;
SELECT 'count_admin_users'        AS metric, COUNT(*)::text AS value FROM admin_users;
SELECT 'count_global_categories'  AS metric, COUNT(*)::text AS value FROM global_categories;
SELECT 'count_category_filters'   AS metric, COUNT(*)::text AS value FROM category_filters;
SELECT 'count_audit_logs'         AS metric, COUNT(*)::text AS value FROM audit_logs;
SELECT 'count_chat_threads'       AS metric, COUNT(*)::text AS value FROM chat_threads;
SELECT 'count_chat_messages'      AS metric, COUNT(*)::text AS value FROM chat_messages;
SELECT 'count_media_files'        AS metric, COUNT(*)::text AS value FROM media_files;
SELECT 'count_order_refunds'      AS metric, COUNT(*)::text AS value FROM order_refunds;

-- Дублированные ключи для удобства drill-скрипта (он смотрит именно на эти имена
-- как «обязательные >0» — см. restore-drill.sh INTEGRITY_FAIL conditions).
SELECT 'admin_users'              AS metric, COUNT(*)::text AS value FROM admin_users;
SELECT 'global_categories'        AS metric, COUNT(*)::text AS value FROM global_categories;

-- ── Reference data sanity ────────────────────────────────────────────────
-- category_filters должны существовать (>0) — без них фильтры на storefront не работают
SELECT 'reference_category_filters_present' AS metric,
       CASE WHEN COUNT(*) > 0 THEN '1' ELSE '0' END AS value
  FROM category_filters;

-- ── FK orphans (must be 0) ────────────────────────────────────────────────
-- order_items без существующего order
SELECT 'orphan_order_items_no_order' AS metric, COUNT(*)::text AS value
  FROM order_items oi
  LEFT JOIN orders o ON o.id = oi."orderId"
 WHERE o.id IS NULL;

-- orders без существующего store
SELECT 'orphan_orders_no_store' AS metric, COUNT(*)::text AS value
  FROM orders o
  LEFT JOIN stores s ON s.id = o."storeId"
 WHERE s.id IS NULL;

-- orders без существующего seller
SELECT 'orphan_orders_no_seller' AS metric, COUNT(*)::text AS value
  FROM orders o
  LEFT JOIN sellers se ON se.id = o."sellerId"
 WHERE se.id IS NULL;

-- orders с buyerId, но buyer не существует (NULL buyerId допустим — гостевой checkout)
SELECT 'orphan_orders_no_buyer' AS metric, COUNT(*)::text AS value
  FROM orders o
  LEFT JOIN buyers b ON b.id = o."buyerId"
 WHERE o."buyerId" IS NOT NULL AND b.id IS NULL;

-- cart_items без существующего cart
SELECT 'orphan_cart_items_no_cart' AS metric, COUNT(*)::text AS value
  FROM cart_items ci
  LEFT JOIN carts c ON c.id = ci."cartId"
 WHERE c.id IS NULL;

-- cart_items с несуществующим product
SELECT 'orphan_cart_items_no_product' AS metric, COUNT(*)::text AS value
  FROM cart_items ci
  LEFT JOIN products p ON p.id = ci."productId"
 WHERE p.id IS NULL;

-- products без существующего store
SELECT 'orphan_products_no_store' AS metric, COUNT(*)::text AS value
  FROM products p
  LEFT JOIN stores s ON s.id = p."storeId"
 WHERE s.id IS NULL;

-- stores без существующего seller (INV-S01 одновременно проверяется)
SELECT 'orphan_stores_no_seller' AS metric, COUNT(*)::text AS value
  FROM stores s
  LEFT JOIN sellers se ON se.id = s."sellerId"
 WHERE se.id IS NULL;

-- buyers без user
SELECT 'orphan_buyers_no_user' AS metric, COUNT(*)::text AS value
  FROM buyers b
  LEFT JOIN users u ON u.id = b."userId"
 WHERE u.id IS NULL;

-- sellers без user
SELECT 'orphan_sellers_no_user' AS metric, COUNT(*)::text AS value
  FROM sellers s
  LEFT JOIN users u ON u.id = s."userId"
 WHERE u.id IS NULL;

-- ── INV-S01: один seller = один store (UNIQUE constraint guard) ───────────
-- Дубликатов быть не должно (есть DB UNIQUE на stores."sellerId", но проверим)
SELECT 'orphan_inv_s01_duplicate_stores_per_seller' AS metric, COALESCE(SUM(extra), 0)::text AS value
  FROM (
    SELECT (COUNT(*) - 1) AS extra
      FROM stores
     GROUP BY "sellerId"
    HAVING COUNT(*) > 1
  ) t;

-- ── Migrations applied ────────────────────────────────────────────────────
-- Если _prisma_migrations отсутствует — это не savdo schema (катастрофа).
-- COALESCE на случай отсутствия таблицы:
SELECT 'migrations_applied' AS metric,
       COALESCE(
         (SELECT COUNT(*)::text FROM _prisma_migrations WHERE finished_at IS NOT NULL),
         '0'
       ) AS value;

-- ── Stock invariant (INV-O04: stockQuantity >= 0) ─────────────────────────
SELECT 'orphan_products_negative_stock' AS metric, COUNT(*)::text AS value
  FROM products
 WHERE "stockQuantity" < 0;

SELECT 'orphan_variants_negative_stock' AS metric, COUNT(*)::text AS value
  FROM product_variants
 WHERE "stockQuantity" < 0;

-- ── Order items snapshot present (INV-C04) ────────────────────────────────
-- Snapshot fields обязательны на не-NULL — проверка integrity старых заказов
SELECT 'orphan_order_items_missing_snapshot' AS metric, COUNT(*)::text AS value
  FROM order_items
 WHERE "productTitleSnapshot" IS NULL
    OR "unitPriceSnapshot" IS NULL;

-- ── Done ──────────────────────────────────────────────────────────────────
SELECT 'integrity_check_complete' AS metric, '1' AS value;
