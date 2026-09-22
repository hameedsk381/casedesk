# CaseDesk Deployment Notes

## Required secrets

Compose now uses an external MySQL database. It refuses to start unless `SESSION_SECRET` and `DOCKER_DATABASE_URL` are supplied through the deployment environment. Use a long random session secret and ensure the external database allows connections from the deployment host.

## Database migrations

The production container defaults to `DB_MIGRATION_MODE=deploy` and runs only committed Prisma migrations. It fails closed when `prisma/migrations` is empty; it no longer runs `prisma db push` implicitly.

This repository currently has no migration history. Do not point `migrate deploy` at an existing database until an operator has reviewed an initial migration and baselined the existing schema. A safe operator workflow is:

1. Take a database and uploads backup with `sh scripts/backup-production.sh`.
2. Compare the Prisma schema to the live database and generate/review an initial migration in a disposable copy.
3. Baseline the live database with the reviewed migration using Prisma's documented `migrate resolve --applied` procedure.
4. Deploy with the default `DB_MIGRATION_MODE=deploy` and verify health and representative records.

For the current legacy database only, `DB_MIGRATION_MODE=legacy-push ALLOW_DB_PUSH=true` preserves the old startup behavior. This is intentionally explicit, should be used only under operator supervision, and must be removed after baseline migration work. `DB_MIGRATION_MODE=none` is available when migrations are managed by a separate release job.

## Backups and restore

`scripts/backup-production.sh` backs up `/app/uploads` to `BACKUP_DIR` (default `./backups`). Back up the external MySQL database separately using the provider's snapshot/backup facility or `mysqldump` from a trusted host. The default backup directory is git-ignored. Backups contain sensitive case data and must be access-controlled and copied to durable off-host storage. The scripts do not configure a retention policy or off-site replication; the operator must provide those.

Restore uploads only during a maintenance window after stopping application traffic. Restore the external database through its provider or a trusted `mysql` client separately:

```sh
CONFIRM_RESTORE=yes sh scripts/restore-production.sh backups/casedesk-uploads-<stamp>.tar.gz
```

Validate the restored database, private downloads, and application health before reopening traffic.

## HTTPS, HSTS, and CSP

Both Next.js services send HSTS and CSP headers. HSTS is effective only when the public endpoint is HTTPS; configure TLS and redirect HTTP at the reverse proxy before enabling HSTS for a production hostname. Do not use the production HSTS policy on a hostname whose subdomains are not all HTTPS.

The CSP retains `unsafe-inline`/`unsafe-eval` because this application and Next.js build have not been nonce-audited. Tightening those directives requires a separate browser regression test and nonce/hash implementation.

Uploads are stored in `/app/uploads`, outside `public`, and are streamed only by authenticated API routes. Existing files under a previously exposed `/app/public/uploads` path require operator review and removal or migration; this change does not delete data from a running volume.
