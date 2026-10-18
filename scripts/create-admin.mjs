#!/usr/bin/env node
/**
 * One-off bootstrap: creates (or updates) the admin account, its workspace and
 * the public submission endpoint the citizen portal posts to.
 *
 * Credentials come from the environment / .env file — nothing is hardcoded and
 * the password is never printed:
 *
 *   ADMIN_EMAIL=you@example.org        (required)
 *   ADMIN_PASSWORD=<10+ chars, letter+number>   (required)
 *   ADMIN_NAME=Admin                   (optional)
 *   WORKSPACE_NAME=ComplianBox         (optional; shown publicly as the desk name)
 *   WORKSPACE_SLUG=complianbox         (optional)
 *   ENDPOINT_SLUG=<NEXT_PUBLIC_DEFAULT_SLUG or janata-investigation-desk>
 *   ENDPOINT_TITLE=Citizen Helpdesk    (optional)
 *   ADMIN_RESET_PASSWORD=true          (optional; reset the password of an existing account)
 *
 * Safe to re-run: existing records are reused, and an existing admin's password
 * is only changed when ADMIN_RESET_PASSWORD=true.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

try {
  process.loadEnvFile?.('.env'); // does not override variables that are already set
} catch {
  // no .env file — rely on the real environment
}

function fail(message) {
  console.error(`create-admin: ${message}`);
  process.exit(1);
}

const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const password = process.env.ADMIN_PASSWORD || '';

if (!email || !password) fail('ADMIN_EMAIL and ADMIN_PASSWORD must be set (in .env or the environment).');
if (email.length > 254 || !/^[^@ ]+@[^@ ]+[.][^@ ]+$/.test(email)) fail('ADMIN_EMAIL is not a valid email address.');
if (password.length < 10) fail('ADMIN_PASSWORD must be at least 10 characters.');
if (Buffer.byteLength(password, 'utf8') > 72) fail('ADMIN_PASSWORD is too long (bcrypt maximum is 72 bytes).');
if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) fail('ADMIN_PASSWORD must include a letter and a number.');

const name = (process.env.ADMIN_NAME || 'Admin').trim();
const workspaceName = (process.env.WORKSPACE_NAME || 'ComplianBox').trim();
const workspaceSlug = (process.env.WORKSPACE_SLUG || 'complianbox').trim().toLowerCase();
const endpointSlug = (process.env.ENDPOINT_SLUG || process.env.NEXT_PUBLIC_DEFAULT_SLUG || 'janata-investigation-desk').trim();
const endpointTitle = (process.env.ENDPOINT_TITLE || 'Citizen Helpdesk').trim();
const resetPassword = process.env.ADMIN_RESET_PASSWORD === 'true';

for (const [label, value] of [['WORKSPACE_SLUG', workspaceSlug], ['ENDPOINT_SLUG', endpointSlug]]) {
  if (!/^[a-z0-9][a-z0-9-]{0,98}$/.test(value)) fail(`${label} may only contain lowercase letters, numbers and hyphens.`);
}

const prisma = new PrismaClient();

try {
  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const workspace = await tx.workspace.upsert({
      where: { slug: workspaceSlug },
      update: {},
      create: { name: workspaceName, slug: workspaceSlug },
    });

    const existing = await tx.user.findUnique({ where: { email } });
    const user = existing
      ? await tx.user.update({
          where: { id: existing.id },
          data: { role: 'OWNER', ...(resetPassword ? { passwordHash } : {}) },
        })
      : await tx.user.create({ data: { name, email, passwordHash, role: 'OWNER' } });

    await tx.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: workspace.id, userId: user.id } },
      update: { role: 'OWNER' },
      create: { workspaceId: workspace.id, userId: user.id, role: 'OWNER' },
    });

    const endpoint = await tx.submissionEndpoint.upsert({
      where: { slug: endpointSlug },
      update: { isActive: true },
      create: {
        workspaceId: workspace.id,
        slug: endpointSlug,
        title: endpointTitle,
        description: 'Report civic issues and public problems in your ward.',
      },
    });

    return { workspace, user, endpoint, userExisted: !!existing };
  });

  console.log(`Workspace:  ${result.workspace.name} (${result.workspace.slug})`);
  console.log(`Admin:      ${result.user.email} (${result.userExisted ? 'existing account' : 'created'}, role OWNER)`);
  if (result.userExisted && !resetPassword) {
    console.log('Password:   unchanged (set ADMIN_RESET_PASSWORD=true to reset it)');
  }
  console.log(`Endpoint:   /${result.endpoint.slug} (active)`);
  console.log('Done. Remove ADMIN_PASSWORD from .env now.');
} catch (error) {
  console.error('create-admin: failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
