#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# savdo-builder — Monthly restore drill
#
# Runbook: docs/runbooks/postgres-backup-restore.md §4
# Closes:  INFRA-BACKUP-RUNBOOK-001 (drill automation)
#
# Что делает:
#   1. Дропает целевую staging-БД (DROP SCHEMA public CASCADE).
#   2. Запускает pg_restore --clean --if-exists.
#   3. Гонит integrity-check (scripts/db/integrity-check.sql).
#   4. (опционально) Сравнивает row-counts с source-БД, проверяет drift <= 5%.
#   5. Печатает JSON-репорт в stdout (parseable for CI).
#
# Usage:
#   bash scripts/db/restore-drill.sh \
#     --dump backups/savdo-20260516-180000.dump \
#     --target-db 'postgresql://savdo:savdo@localhost:55432/savdo_staging' \
#     [--source-db "$DATABASE_URL"] \
#     [--keep-data]            # не делать cleanup target DB после
#
# Env vars (optional):
#   MAX_ROWCOUNT_DRIFT_PCT — допустимый % разницы row count source vs target (default: 5)
#   PG_RESTORE_BIN         — путь к pg_restore (default: pg_restore in PATH)
#   PSQL_BIN               — путь к psql (default: psql in PATH)
#
# Exit codes: 0 PASS, 1 args/prereq fail, 2 restore failed, 3 integrity failed,
# 4 drift exceeded.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── defaults ────────────────────────────────────────────────────────────────
MAX_ROWCOUNT_DRIFT_PCT="${MAX_ROWCOUNT_DRIFT_PCT:-5}"
PG_RESTORE_BIN="${PG_RESTORE_BIN:-pg_restore}"
PSQL_BIN="${PSQL_BIN:-psql}"
KEEP_DATA=0

DUMP=""
TARGET_DB=""
SOURCE_DB=""

# ── parse args ──────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dump)         DUMP="$2"; shift 2 ;;
    --target-db)    TARGET_DB="$2"; shift 2 ;;
    --source-db)    SOURCE_DB="$2"; shift 2 ;;
    --keep-data)    KEEP_DATA=1; shift ;;
    --help|-h)
      sed -n '/^# /,/^$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "ERROR: unknown arg: $1" >&2
      exit 1
      ;;
  esac
done

# ── validate args ───────────────────────────────────────────────────────────
if [[ -z "$DUMP" || -z "$TARGET_DB" ]]; then
  echo "ERROR: --dump and --target-db are required." >&2
  echo "Run with --help for usage." >&2
  exit 1
fi

if [[ ! -f "$DUMP" ]]; then
  echo "ERROR: dump file not found: $DUMP" >&2
  exit 1
fi

for bin in "$PG_RESTORE_BIN" "$PSQL_BIN"; do
  if ! command -v "$bin" >/dev/null 2>&1; then
    echo "ERROR: '$bin' not found in PATH." >&2
    exit 1
  fi
done

INTEGRITY_SQL="$(cd "$(dirname "$0")" && pwd)/integrity-check.sql"
if [[ ! -f "$INTEGRITY_SQL" ]]; then
  echo "ERROR: integrity SQL not found: $INTEGRITY_SQL" >&2
  exit 1
fi

# ── helpers ─────────────────────────────────────────────────────────────────
mask_url() {
  echo "$1" | sed -E 's#://[^:]+:[^@]+@#://***:***@#'
}

run_psql() {
  local url="$1"; shift
  "$PSQL_BIN" "$url" -v ON_ERROR_STOP=1 -q -X "$@"
}

# Get single-value query result (whitespace-trimmed)
psql_scalar() {
  local url="$1"
  local sql="$2"
  "$PSQL_BIN" "$url" -X -A -t -c "$sql" 2>/dev/null | tr -d '[:space:]'
}

# ── 1. wipe target ──────────────────────────────────────────────────────────
echo "[drill] step 1/4 — wipe target schema"
echo "[drill]   target: $(mask_url "$TARGET_DB")"

if ! run_psql "$TARGET_DB" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" 2>&1; then
  echo "ERROR: failed to reset target schema. Is target DB reachable?" >&2
  exit 2
fi

# ── 2. restore ──────────────────────────────────────────────────────────────
echo "[drill] step 2/4 — pg_restore"
echo "[drill]   dump: $DUMP ($(du -h "$DUMP" | awk '{print $1}'))"
RESTORE_START=$(date +%s)

# --exit-on-error → drill fails fast если есть проблемы
# --jobs=4 → параллельно (custom format supports it)
# --no-owner / --no-privileges → restore-side roles могут отличаться
if ! "$PG_RESTORE_BIN" \
    --clean --if-exists \
    --no-owner --no-privileges \
    --exit-on-error \
    --jobs=4 \
    -d "$TARGET_DB" \
    "$DUMP" 2>/tmp/pg_restore_err.$$ ; then
  echo "ERROR: pg_restore failed." >&2
  cat /tmp/pg_restore_err.$$ >&2
  rm -f /tmp/pg_restore_err.$$
  exit 2
fi
rm -f /tmp/pg_restore_err.$$

RESTORE_END=$(date +%s)
RESTORE_ELAPSED=$((RESTORE_END - RESTORE_START))
echo "[drill]   restore OK in ${RESTORE_ELAPSED}s"

# ── 3. integrity check ─────────────────────────────────────────────────────
echo "[drill] step 3/4 — integrity check"

INTEGRITY_OUT="$(mktemp)"
if ! "$PSQL_BIN" "$TARGET_DB" -X -A -F'|' -t \
     -v ON_ERROR_STOP=1 \
     -f "$INTEGRITY_SQL" > "$INTEGRITY_OUT" 2>&1; then
  echo "ERROR: integrity check SQL failed:" >&2
  cat "$INTEGRITY_OUT" >&2
  rm -f "$INTEGRITY_OUT"
  exit 3
fi

# Parse integrity output into a small JSON object
# Each non-empty line is: metric|value
INTEGRITY_JSON="{"
FIRST=1
INTEGRITY_FAIL=0
while IFS='|' read -r metric value; do
  metric="$(echo "$metric" | tr -d '[:space:]')"
  value="$(echo "$value" | tr -d '[:space:]')"
  [[ -z "$metric" ]] && continue
  if [[ "$FIRST" -eq 1 ]]; then
    FIRST=0
  else
    INTEGRITY_JSON+=","
  fi
  INTEGRITY_JSON+="\"$metric\":\"$value\""

  # Fail conditions:
  # - any orphan_* metric must be 0
  # - migrations_applied must be > 0
  # - admin_users must be > 0
  # - global_categories must be > 0
  case "$metric" in
    orphan_*)
      if [[ "$value" != "0" ]]; then
        echo "[drill]   FAIL: $metric = $value (expected 0)" >&2
        INTEGRITY_FAIL=1
      fi
      ;;
    migrations_applied|admin_users|global_categories)
      if [[ "$value" == "0" || -z "$value" ]]; then
        echo "[drill]   FAIL: $metric = $value (expected > 0)" >&2
        INTEGRITY_FAIL=1
      fi
      ;;
  esac
done < "$INTEGRITY_OUT"
INTEGRITY_JSON+="}"
rm -f "$INTEGRITY_OUT"

if [[ "$INTEGRITY_FAIL" -ne 0 ]]; then
  echo "[drill]   integrity: FAIL"
  echo "$INTEGRITY_JSON"
  exit 3
fi
echo "[drill]   integrity: OK"

# ── 4. (optional) row-count diff against source ─────────────────────────────
DRIFT_JSON="{}"
DRIFT_FAIL=0
if [[ -n "$SOURCE_DB" ]]; then
  echo "[drill] step 4/4 — row count diff vs source"

  TABLES=("users" "sellers" "stores" "products" "orders" "order_items" "cart_items" "admin_users" "global_categories" "category_filters")
  DRIFT_JSON="{"
  DFIRST=1

  for tbl in "${TABLES[@]}"; do
    SRC=$(psql_scalar "$SOURCE_DB" "SELECT COUNT(*) FROM \"$tbl\";" || echo "ERR")
    TGT=$(psql_scalar "$TARGET_DB" "SELECT COUNT(*) FROM \"$tbl\";" || echo "ERR")

    if [[ "$SRC" == "ERR" || "$TGT" == "ERR" ]]; then
      echo "[drill]   $tbl: source=$SRC target=$TGT (skip)"
      continue
    fi

    # drift = |src - tgt| / max(src, 1) * 100
    if [[ "$SRC" -eq 0 ]]; then
      DRIFT=0
    else
      DIFF=$((TGT - SRC))
      DIFF_ABS=${DIFF#-}
      DRIFT=$(( DIFF_ABS * 100 / SRC ))
    fi

    STATUS="ok"
    if [[ "$DRIFT" -gt "$MAX_ROWCOUNT_DRIFT_PCT" ]]; then
      STATUS="DRIFT"
      DRIFT_FAIL=1
      echo "[drill]   $tbl: src=$SRC target=$TGT drift=${DRIFT}% (>${MAX_ROWCOUNT_DRIFT_PCT}%) ⚠"
    else
      echo "[drill]   $tbl: src=$SRC target=$TGT drift=${DRIFT}% ✓"
    fi

    if [[ "$DFIRST" -eq 1 ]]; then DFIRST=0; else DRIFT_JSON+=","; fi
    DRIFT_JSON+="\"$tbl\":{\"source\":$SRC,\"target\":$TGT,\"drift_pct\":$DRIFT,\"status\":\"$STATUS\"}"
  done
  DRIFT_JSON+="}"
else
  echo "[drill] step 4/4 — skipped (no --source-db)"
fi

# ── cleanup ─────────────────────────────────────────────────────────────────
if [[ "$KEEP_DATA" -eq 0 ]]; then
  echo "[drill] cleanup — dropping target schema"
  run_psql "$TARGET_DB" -c "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;" >/dev/null 2>&1 || true
fi

# ── report ──────────────────────────────────────────────────────────────────
OVERALL="PASS"
EXIT_CODE=0
if [[ "$DRIFT_FAIL" -ne 0 ]]; then
  OVERALL="FAIL_DRIFT"
  EXIT_CODE=4
fi

cat <<EOF
{
  "drill_status": "$OVERALL",
  "timestamp_utc": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "dump_file": "$DUMP",
  "restore_elapsed_seconds": $RESTORE_ELAPSED,
  "max_drift_pct": $MAX_ROWCOUNT_DRIFT_PCT,
  "integrity": $INTEGRITY_JSON,
  "rowcount_drift": $DRIFT_JSON
}
EOF

exit $EXIT_CODE
