#!/bin/sh
set -eu

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <uploads.tar.gz>" >&2
  exit 2
fi

if [ "${CONFIRM_RESTORE:-}" != "yes" ]; then
  echo "Refusing to restore without CONFIRM_RESTORE=yes; this overwrites private uploads." >&2
  exit 1
fi

echo "Restoring private uploads..."
cat "$1" | docker compose exec -T casedesk tar -C /app -xzf -
echo "Restore completed. Verify application health and representative records before reopening traffic."
