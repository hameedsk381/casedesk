#!/bin/sh
set -eu

# Run from the host with the compose project selected by Docker Compose.
BACKUP_DIR="${BACKUP_DIR:-./backups}"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
umask 077
mkdir -p "$BACKUP_DIR"

echo "Backing up MySQL..."
docker compose exec -T mysql sh -c \
  'exec mysqldump --single-transaction --quick --routines --triggers --events -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"' \
  > "$BACKUP_DIR/casedesk-mysql-$STAMP.sql"

echo "Backing up private uploads..."
docker compose exec -T casedesk tar -C /app -czf - uploads \
  > "$BACKUP_DIR/casedesk-uploads-$STAMP.tar.gz"

echo "Backup written to $BACKUP_DIR (protect it as sensitive data)."
