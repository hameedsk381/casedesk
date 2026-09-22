#!/bin/sh
set -e

echo "=== CaseDesk Production Startup ==="

# Apply versioned schema changes before serving traffic. Production deployments
# must use committed migrations; legacy db push is an explicit, temporary escape hatch.
if [ -f "prisma/schema.prisma" ]; then
  MIGRATION_MODE="${DB_MIGRATION_MODE:-deploy}"
  MAX_RETRIES="${DB_MIGRATION_RETRIES:-10}"
  RETRY_COUNT=0

  case "$MIGRATION_MODE" in
    deploy)
      if ! find prisma/migrations -name migration.sql -print -quit 2>/dev/null | grep -q .; then
        echo "ERROR: no Prisma migrations are present. Create and review an initial migration, baseline the existing database, then restart."
        echo "For a one-time legacy deployment only, set DB_MIGRATION_MODE=legacy-push and ALLOW_DB_PUSH=true."
        exit 1
      fi
      MIGRATION_COMMAND="npx prisma migrate deploy"
      ;;
    legacy-push)
      if [ "${ALLOW_DB_PUSH:-false}" != "true" ]; then
        echo "ERROR: DB_MIGRATION_MODE=legacy-push requires ALLOW_DB_PUSH=true."
        exit 1
      fi
      echo "WARNING: using legacy prisma db push; do not use this mode for routine deployments."
      MIGRATION_COMMAND="npx prisma db push --skip-generate"
      ;;
    none)
      MIGRATION_COMMAND=""
      ;;
    *)
      echo "ERROR: unsupported DB_MIGRATION_MODE '$MIGRATION_MODE' (use deploy, legacy-push, or none)."
      exit 1
      ;;
  esac

  if [ -n "$MIGRATION_COMMAND" ]; then
    until sh -c "$MIGRATION_COMMAND"; do
      RETRY_COUNT=$((RETRY_COUNT + 1))
      if [ "$RETRY_COUNT" -ge "$MAX_RETRIES" ]; then
        echo "ERROR: database migration failed after $MAX_RETRIES attempts."
        exit 1
      fi
      echo "Waiting for database to be ready (attempt $RETRY_COUNT/$MAX_RETRIES)..."
      sleep 3
    done
  fi
fi

# Uploads are private and served only through authenticated API routes.
mkdir -p /app/uploads

echo "Starting CaseDesk Next.js server on port ${PORT:-3000}..."
exec node server.js
