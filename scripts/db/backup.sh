#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# savdo-builder — Weekly PostgreSQL dump
#
# Runbook: docs/runbooks/postgres-backup-restore.md
# Closes: INFRA-BACKUP-RUNBOOK-001
#
# Usage:
#   DATABASE_URL='postgresql://user:pass@host:5432/db' bash scripts/db/backup.sh
#   DATABASE_URL='...' bash scripts/db/backup.sh --upload    # also push to R2
#   bash scripts/db/backup.sh --help
#
# Env vars:
#   DATABASE_URL                — source PG connection string (required)
#   BACKUP_DIR                  — local dir for dumps (default: ./backups)
#   BACKUP_PREFIX               — file prefix (default: savdo)
#   R2_BACKUP_BUCKET            — S3 bucket name for upload (optional)
#   R2_ENDPOINT_URL             — Cloudflare R2 endpoint (optional, required with --upload)
#   AWS_ACCESS_KEY_ID           — R2 access key (optional, required with --upload)
#   AWS_SECRET_ACCESS_KEY       — R2 secret (optional, required with --upload)
#   PG_DUMP_BIN                 — path to pg_dump (default: pg_dump in PATH)
#
# Exit codes: 0 ok, 1 generic error, 2 missing prerequisites, 3 dump failed,
# 4 upload failed.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

# ── parse args ──────────────────────────────────────────────────────────────
UPLOAD=0
for arg in "$@"; do
  case "$arg" in
    --upload) UPLOAD=1 ;;
    --help|-h)
      sed -n '/^# /,/^$/p' "$0" | sed 's/^# \{0,1\}//'
      exit 0
      ;;
    *)
      echo "ERROR: unknown argument: $arg" >&2
      echo "Run with --help for usage." >&2
      exit 1
      ;;
  esac
done

# ── defaults ────────────────────────────────────────────────────────────────
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_PREFIX="${BACKUP_PREFIX:-savdo}"
PG_DUMP_BIN="${PG_DUMP_BIN:-pg_dump}"

# ── prerequisites ───────────────────────────────────────────────────────────
if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "ERROR: DATABASE_URL is not set." >&2
  echo "Get it from Railway → savdo-api → Variables → DATABASE_URL." >&2
  exit 2
fi

if ! command -v "$PG_DUMP_BIN" >/dev/null 2>&1; then
  echo "ERROR: '$PG_DUMP_BIN' not found in PATH." >&2
  echo "Install with: brew install postgresql@16 / apt install postgresql-client-16 (or WSL2 on Windows)." >&2
  exit 2
fi

if [[ "$UPLOAD" -eq 1 ]]; then
  if [[ -z "${R2_BACKUP_BUCKET:-}" || -z "${R2_ENDPOINT_URL:-}" \
      || -z "${AWS_ACCESS_KEY_ID:-}" || -z "${AWS_SECRET_ACCESS_KEY:-}" ]]; then
    echo "ERROR: --upload requires R2_BACKUP_BUCKET, R2_ENDPOINT_URL, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY." >&2
    exit 2
  fi
  if ! command -v aws >/dev/null 2>&1; then
    echo "ERROR: 'aws' CLI not found (required for --upload)." >&2
    echo "Install: brew install awscli / pip install awscli." >&2
    exit 2
  fi
fi

# ── compute filename ────────────────────────────────────────────────────────
TIMESTAMP="$(date -u +%Y%m%d-%H%M%S)"
DUMP_FILE="${BACKUP_DIR}/${BACKUP_PREFIX}-${TIMESTAMP}.dump"

mkdir -p "$BACKUP_DIR"

# ── pg_dump ─────────────────────────────────────────────────────────────────
echo "[backup] starting pg_dump → $DUMP_FILE"
echo "[backup] DATABASE_URL host: $(echo "$DATABASE_URL" | sed -E 's#.*@([^/:]+).*#\1#')"
START_TS=$(date +%s)

# --format=custom — compressed, supports pg_restore --jobs parallelism + --list
# --no-owner / --no-privileges — restore-target может иметь другой owner role
# --no-comments — слегка меньше, не теряем ничего важного для DR
if ! "$PG_DUMP_BIN" \
    --no-owner \
    --no-privileges \
    --format=custom \
    --compress=9 \
    --file="$DUMP_FILE" \
    "$DATABASE_URL"; then
  echo "ERROR: pg_dump failed. Check DATABASE_URL connectivity and PG version compatibility." >&2
  rm -f "$DUMP_FILE"
  exit 3
fi

END_TS=$(date +%s)
ELAPSED=$((END_TS - START_TS))

# ── verify ──────────────────────────────────────────────────────────────────
if [[ ! -s "$DUMP_FILE" ]]; then
  echo "ERROR: dump file is empty: $DUMP_FILE" >&2
  exit 3
fi

DUMP_SIZE_BYTES=$(wc -c < "$DUMP_FILE" | tr -d '[:space:]')
DUMP_SIZE_HUMAN=$(du -h "$DUMP_FILE" 2>/dev/null | awk '{print $1}')

# Sanity check: pg_restore --list shouldn't crash on the file
if ! pg_restore --list "$DUMP_FILE" >/dev/null 2>&1; then
  echo "ERROR: dump verification failed (pg_restore --list crashed)." >&2
  exit 3
fi

TABLE_COUNT=$(pg_restore --list "$DUMP_FILE" | grep -c 'TABLE DATA' || true)

echo "[backup] dump OK"
echo "  file:   $DUMP_FILE"
echo "  size:   $DUMP_SIZE_HUMAN ($DUMP_SIZE_BYTES bytes)"
echo "  tables: $TABLE_COUNT"
echo "  time:   ${ELAPSED}s"

# ── upload (optional) ───────────────────────────────────────────────────────
if [[ "$UPLOAD" -eq 1 ]]; then
  S3_KEY="weekly/${BACKUP_PREFIX}-${TIMESTAMP}.dump"
  S3_URL="s3://${R2_BACKUP_BUCKET}/${S3_KEY}"

  echo "[upload] pushing to $S3_URL"

  if ! aws s3 cp "$DUMP_FILE" "$S3_URL" \
       --endpoint-url "$R2_ENDPOINT_URL" \
       --only-show-errors; then
    echo "ERROR: upload to R2 failed. Dump preserved locally at $DUMP_FILE" >&2
    exit 4
  fi

  echo "[upload] OK → $S3_URL"
fi

# ── summary ─────────────────────────────────────────────────────────────────
cat <<EOF
─────────────────────────────────────────────
SUMMARY
─────────────────────────────────────────────
status:    OK
file:      $DUMP_FILE
size:      $DUMP_SIZE_HUMAN
tables:    $TABLE_COUNT
elapsed:   ${ELAPSED}s
$([ "$UPLOAD" -eq 1 ] && echo "uploaded:  s3://${R2_BACKUP_BUCKET}/weekly/${BACKUP_PREFIX}-${TIMESTAMP}.dump")
─────────────────────────────────────────────
Next steps:
  - verify list:  pg_restore --list $DUMP_FILE | head -50
  - integrity:    bash scripts/db/restore-drill.sh --dump $DUMP_FILE --target-db <url>
  - schedule:     next backup → Friday 18:00 UZT
EOF
