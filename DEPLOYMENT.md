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

## Public site vs. staff workspace

Only the citizen portal and the citizen API are meant to be public.

- The default `casedesk` service runs with `STAFF_APP_ENABLED=false`: the staff workspace (`/app`, `/login`, `/signup`, the marketing pages and every staff API) answers 404. Only `/api/submit/*`, `/api/health` and `/api/cron/escalate` respond.
- Your team uses a separate instance (`casedesk-staff`) with the staff workspace on, started by the same `docker compose up -d` and bound to `127.0.0.1` (port `3002`):

  Reach it over an SSH tunnel or VPN (`ssh -L 3002:localhost:3002 <server>`, then open `http://localhost:3002`). Do not add it to the public reverse proxy. Change the port with `STAFF_APP_PORT`.
- Route only the `citizen-portal` service through the public reverse proxy.
- Staff accounts must already exist, because public signup is closed unless `SIGNUP_ENABLED=true`.

## First-time admin account

There is no default login. Put the admin credentials in `.env` (see `.env.example`):

```
ADMIN_EMAIL=you@openvaartha.com
ADMIN_PASSWORD=<10+ characters, with a letter and a number>
```

With Docker Compose this happens automatically: on startup the `casedesk` container creates the workspace, an `OWNER` account, and the active public submission endpoint the citizen portal uses (`NEXT_PUBLIC_DEFAULT_SLUG`):

```bash
docker compose up -d --build
```

It is safe to re-run: existing records are reused and an existing account's password is only changed with `ADMIN_RESET_PASSWORD=true`. The password is never printed. **Remove `ADMIN_PASSWORD` from `.env` afterwards.** Without Compose, run `npm run create-admin` once on the host (with DATABASE_URL set). Sign in through the private staff instance (see above).

## Deploying on Dokploy

Dokploy terminates TLS (Traefik) and routes by domain, so:

1. Create a **Compose** application from this repository and put the variables from `.env.example` in its Environment tab (`DOCKER_DATABASE_URL`, `SESSION_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `GROQ_API_KEY`, and so on).
2. Set `TRUSTED_PROXY=true` and `PUBLIC_PORTAL_URL=https://<your portal domain>`, and set `NEXT_PUBLIC_CITIZEN_PORTAL_URL`/`APP_URL` to the matching https addresses.
3. Add domains in Dokploy:
   - `citizen-portal` → container port **3001** — the public citizens' site.
   - `casedesk-staff` → container port **3000** — the staff workspace, on its own hostname (for example `staff.<domain>`).
   - Do **not** add a domain for `casedesk`: it is the internal, citizen-API-only instance that the portal calls over the compose network.
4. The staff hostname is reachable from the internet, protected by login only. Keep `SIGNUP_ENABLED=false`, use a strong admin password, and consider an IP allow-list or basic-auth middleware on that domain in Traefik.
5. If Cloudflare (or another CDN) sits in front of Traefik, the client IP seen by the apps is the CDN's, which makes rate limits shared. Prefer pointing DNS straight at the server.
6. The `127.0.0.1:3002` binding on `casedesk-staff` is unused under Dokploy; change `STAFF_APP_PORT` if that port clashes with another stack.

## Post-deploy smoke test

Run this against staging first (and again after any production deploy). It submits a real `[SMOKE TEST]` report, so delete that report afterwards.

```bash
PORTAL_URL=https://<portal domain> \nSTAFF_URL=https://<staff domain> \nCASEDESK_URL=https://<staff domain> CRON_SECRET=<secret> \nnpm run smoke
```

It checks the portal, privacy notice, tracker, endpoint, consent and upload validation, tracking, the public feed, QR codes, and (optionally) the staff gate and escalation endpoint, then prints a manual checklist for the staff workflow. Set `PRIVACY_CONTACT_EMAIL` first or the privacy check will fail by design.

## File storage (Google Cloud Storage)

Attachments and evidence go to a private Google Cloud Storage bucket when `GCS_BUCKET` is set; without it they stay on the local `casedesk-uploads` volume.

1. Create a **private** bucket (uniform bucket-level access on, public access prevented), in a region close to your users (for example `asia-south1`).
2. Create a service account and grant it **Storage Object Admin on that bucket only**. Create a JSON key for it.
3. Check the key and bucket from your own computer (the key is not sent anywhere except to Google), then print the base64 value:
   ```bash
   node scripts/check-gcs.mjs --key-file ./service-account.json --bucket <bucket name>
   node scripts/check-gcs.mjs --key-file ./service-account.json --print-base64
   ```
   The first command writes, reads and deletes one tiny test object and flags public access, versioning and soft-delete problems. Paste the second command's output into Dokploy's environment, then delete the key file from your computer. (Manual alternative to the second command:)
   ```bash
   base64 -w0 service-account.json     # macOS: base64 -i service-account.json
   ```
   ```
   GCS_BUCKET=<bucket name>
   GCS_CREDENTIALS_BASE64=<the output above>
   GCS_PREFIX=casedesk                 # optional folder inside the bucket
   ```
4. **Erasure and soft delete.** New GCS buckets keep deleted objects for a "soft delete" period (7 days by default). Erased reports' files stay recoverable in that window. Either set the bucket's soft-delete retention to 0 days, or state the delay in your privacy notice. Do not enable object versioning on this bucket.
5. The logs show `[storage] Using Google Cloud Storage bucket "<name>"` at the first upload. The smoke test's image upload (`npm run smoke`) confirms writes work.
6. Backups: with GCS the bucket holds the files, so `scripts/backup-production.sh` (which archives the local uploads volume) is no longer relevant for them. Back up the MySQL database separately; the files in the bucket are only useful together with the database rows that point to them.

Files are only ever served through the authenticated download routes, never through public bucket URLs.

## Erasing a report (privacy requests)

Staff with delete permission (OWNER/ADMIN) can permanently erase a report with its files:

- A case, with every linked citizen report, attachment and evidence file:
  `DELETE /api/cases/<id>` with body `{"confirm": "<case number>"}`
- A report that never became a case:
  `DELETE /api/intake/<id>` with body `{"confirm": "<reference number>"}`

Files are deleted first; if any file cannot be deleted nothing is removed from the database, so the call can be retried. The action is logged (reference or case number and counts only). There is no button for this in the staff screens yet.

## Inviting creators

Owners and admins invite people from **Settings → Newsroom Team** in the staff workspace.

1. Enter the person's email and choose a role (Researcher by default; only the owner can invite an Admin) and click **Send invite**.
2. If SMTP is configured the invitation is emailed. Either way the screen shows the link — copy it and send it yourself if email isn't set up.
3. The link works once and expires after 7 days. The creator opens it, enters their name and a password (or, if they already have an account, their existing password) and lands in your shared workspace.

Set **`APP_URL` to the staff workspace's public address** (for example `https://staff.openvaartha.com`), because invitation links are built from it. Invitations are stored only as a hash, so a database leak cannot reveal working links.

Pending invitations can be revoked, and members can be removed (their account and past work stay). The owner cannot be removed. Public signup can stay closed (`SIGNUP_ENABLED=false`); invitations do not depend on it.
