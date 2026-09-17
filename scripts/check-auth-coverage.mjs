// Contract test: verifies every private API route requires authentication.
//
// Scans src/app/api/**/route.ts, checks each file exports an auth marker
// (getCurrentUser / requireAuth / getSession). Public routes are allowlisted.
// Run via: node scripts/check-auth-coverage.mjs
//
// Exit 0 = pass, Exit 1 = fail (missing auth detected).

import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

const API_DIR = join(import.meta.dirname, '..', 'src', 'app', 'api');

const PUBLIC_ROUTES = new Set([
  'api/auth/login',
  'api/auth/logout',
  'api/auth/signup',
  'api/health',
  'api/submit',
  'api/submit/status',
  'api/submit/[creatorSlug]',
  'api/intake/counts',
]);

const AUTH_PATTERN = /(?:getCurrentUser|requireAuth|getSession)\s*[\(\.]/;

function walkRouteFiles(dir) {
  const files = [];
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkRouteFiles(full));
    } else if (entry.name === 'route.ts') {
      files.push(full);
    }
  }
  return files;
}

let failures = 0;
for (const filePath of walkRouteFiles(API_DIR)) {
  const rel = relative(join(API_DIR, '..'), filePath).replace(/\\/g, '/').replace('/route.ts', '');
  const publicRel = rel.startsWith('/') ? rel.slice(1) : rel;
  if (PUBLIC_ROUTES.has(publicRel)) continue;

  const content = readFileSync(filePath, 'utf8');

  const hasMutation = /export\s+async\s+function\s+(GET|POST|PUT|PATCH|DELETE)/.test(content);
  if (!hasMutation) continue;

  if (!AUTH_PATTERN.test(content)) {
    console.error(`❌ ${rel} — missing authentication marker (getCurrentUser/requireAuth/getSession)`);
    failures++;
  }
}

if (failures > 0) {
  console.error(`\n${failures} route(s) missing auth protection.\n`);
  process.exit(1);
} else {
  console.log('✅ All private API routes have auth protection');
}
