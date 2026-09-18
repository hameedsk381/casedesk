#!/bin/sh
set -e

echo "=== CaseDesk Production Startup ==="

# Apply versioned schema changes before serving traffic.
if [ -f "prisma/schema.prisma" ]; then
  echo "Connecting to MySQL and pushing database schema..."
  MAX_RETRIES=10
  RETRY_COUNT=0
  until npx prisma db push --skip-generate || [ $RETRY_COUNT -ge $MAX_RETRIES ]; do
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "Waiting for database to be ready (attempt $RETRY_COUNT/$MAX_RETRIES)..."
    sleep 3
  done
fi

# Ensure uploads directory exists
mkdir -p /app/public/uploads/submissions

echo "Starting CaseDesk Next.js server on port ${PORT:-3000}..."
exec node server.js
