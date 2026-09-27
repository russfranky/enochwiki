#!/usr/bin/env bash
# ============================================================
# backup-db.sh — timestamped SQLite backup, keeps the last 14 days
# ------------------------------------------------------------
# Uses the sqlite3 ".backup" command, which copies a live database
# safely (no need to stop the server).
#
# Usage:
#   DATABASE_URL="file:./db/custom.db" bash scripts/backup-db.sh
#   BACKUP_DIR=/var/backups/enochwiki DATABASE_URL="..." bash scripts/backup-db.sh
#
# Env:
#   DATABASE_URL  required. The "file:" prefix is stripped.
#   BACKUP_DIR    optional. Defaults to ./backups (repo root).
#   KEEP_DAYS     optional. Defaults to 14.
# ============================================================
set -uo pipefail

: "${DATABASE_URL:?FAIL: DATABASE_URL is not set}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
KEEP_DAYS="${KEEP_DAYS:-14}"

DB="${DATABASE_URL#file:}"
if [ ! -f "$DB" ]; then
  echo "FAIL: database file not found: $DB" >&2
  exit 1
fi
command -v sqlite3 >/dev/null 2>&1 || { echo "FAIL: sqlite3 CLI not installed" >&2; exit 1; }

mkdir -p "$BACKUP_DIR"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="$BACKUP_DIR/backup-$STAMP.db"
# D-008: same-second runs must not silently overwrite — append a collision
# suffix until the name is free.
N=0
while [ -e "$OUT" ]; do
  N=$((N + 1))
  OUT="$BACKUP_DIR/backup-$STAMP-$N.db"
done

sqlite3 "$DB" ".backup '$OUT'" || { echo "FAIL: sqlite3 .backup failed" >&2; exit 1; }
[ -f "$OUT" ] || { echo "FAIL: backup file was not created" >&2; exit 1; }

SIZE="$(du -h "$OUT" | cut -f1)"
echo "backup written: $OUT ($SIZE)"

# Prune backups older than KEEP_DAYS.
PRUNED="$(find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.db' -mtime +"$KEEP_DAYS" -print -delete | wc -l)"
echo "pruned $PRUNED backup(s) older than $KEEP_DAYS days"
echo "backups kept: $(find "$BACKUP_DIR" -maxdepth 1 -name 'backup-*.db' | wc -l)"
