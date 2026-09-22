#!/bin/sh
set -eu

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <mysql.sql> <uploads.tar.gz>" >&2
  exit 2
fi

if [ "${CONFIRM_RESTORE:-}" != "yes" ]; then
  echo "Refusing to restore without CONFIRM_RESTORE=yes; this overwrites database data and uploads." >&2
  exit 1
fi

echo "Restore will overwrite the current database and private uploads. Stop application traffic first."
echo "Restoring MySQL..."
cat "$1" | docker compose exec -T mysql sh -c \
  'exec mysql -u root -p"$MYSQL_ROOT_PASSWORD" "$MYSQL_DATABASE"'

echo "Restoring private uploads..."
cat "$2" | docker compose exec -T casedesk tar -C /app -xzf -
echo "Restore completed. Verify application health and representative records before reopening traffic."
