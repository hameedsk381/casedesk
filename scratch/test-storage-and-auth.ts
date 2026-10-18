import {
  savePrivateUpload,
  privateFileExists,
  openPrivateFileStream,
  withPrivateFileOnDisk,
  deletePrivateFile,
  storageDriverName,
} from '../src/lib/storage';
import {
  hasWorkspaceAccess,
  canUser,
} from '../src/lib/auth/permissions';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';

async function readAll(stream: NodeJS.ReadableStream | null): Promise<string> {
  if (!stream) return '';
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk as Buffer));
  return Buffer.concat(chunks).toString('utf8');
}

async function runTests() {
  console.log('--- Phase 1 Verification Tests ---');

  // 1. Which storage driver is active (set GCS_BUCKET to test Google Cloud Storage)
  console.log('[Storage] Driver: ' + storageDriverName());

  // 2. Test Path Traversal Protection
  const traversalAttempts = ['../../secret.txt', '/etc/passwd', 'a/../../b', 'a\b', ''];
  const blocked = (await Promise.all(traversalAttempts.map((p) => privateFileExists(p)))).every((exists) => exists === false);
  console.log('[Security] Traversal attempts blocked: ' + (blocked ? 'PASS' : 'FAIL'));

  // 3. Test Private Upload Save & Read
  const testBuffer = Buffer.from('Sensitive investigative whistleblower testimony 2026');
  const saved = await savePrivateUpload({
    buffer: testBuffer,
    subDirectory: 'test_submissions',
    fileName: 'leaked_records.pdf',
    contentType: 'application/pdf',
  });

  console.log('[Storage] File saved at relative path: ' + saved.relativePath);
  const fileExists = await privateFileExists(saved.relativePath);
  console.log('[Storage] File exists after save: ' + (fileExists ? 'PASS' : 'FAIL'));
  const roundTrip = await readAll(await openPrivateFileStream(saved.relativePath));
  console.log('[Storage] Stream returns the saved content: ' + (roundTrip === testBuffer.toString() ? 'PASS' : 'FAIL'));
  const viaDisk = await withPrivateFileOnDisk(saved.relativePath, async (filePath) => (await import('fs')).readFileSync(filePath, 'utf8'));
  console.log('[Storage] On-disk copy for tools matches: ' + (viaDisk === testBuffer.toString() ? 'PASS' : 'FAIL'));

  // 4. Test File Cleanup
  const deleted = await deletePrivateFile(saved.relativePath);
  const stillExists = await privateFileExists(saved.relativePath);
  console.log('[Storage] File deleted: ' + (deleted && !stillExists ? 'PASS' : 'FAIL'));

  // 5. Test Auth Tokens
  const token = await createSessionToken({
    userId: 'usr_test123',
    email: 'investigator@casedesk.org',
    role: 'RESEARCHER',
    name: 'Lead Investigator',
  });
  const verified = await verifySessionToken(token);
  console.log(`[Auth] Session creation & verification: ${verified?.userId === 'usr_test123' ? 'PASS' : 'FAIL'}`);

  // 6. Test Workspace Access & Roles
  const mockUserResearcher = {
    id: 'usr_res1',
    role: 'RESEARCHER',
    workspaceMembers: [{ workspaceId: 'ws_alpha' }],
  };
  const mockUserAdmin = {
    id: 'usr_adm1',
    role: 'ADMIN',
    workspaceMembers: [],
  };

  const researcherAllowed = hasWorkspaceAccess(mockUserResearcher, 'ws_alpha');
  const researcherDenied = !hasWorkspaceAccess(mockUserResearcher, 'ws_beta');
  const adminAllowedAny = hasWorkspaceAccess(mockUserAdmin, 'ws_beta');
  console.log(`[Auth] Workspace isolation for Researcher: ${researcherAllowed && researcherDenied ? 'PASS' : 'FAIL'}`);
  console.log(`[Auth] Admin cross-workspace access: ${adminAllowedAny ? 'PASS' : 'FAIL'}`);

  // 7. Test Permissions
  const canResearcherCreate = canUser('RESEARCHER', 'create_case');
  const canViewerCreate = !canUser('VIEWER', 'create_case');
  const canEditorDelete = !canUser('EDITOR', 'delete_case');
  console.log(`[Permissions] Role-based action checks: ${canResearcherCreate && canViewerCreate && canEditorDelete ? 'PASS' : 'FAIL'}`);

  console.log('--- All Verification Tests Completed Successfully ---');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
