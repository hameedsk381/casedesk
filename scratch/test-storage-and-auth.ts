import {
  savePrivateUpload,
  getPrivateFilePath,
  deletePrivateFile,
  UPLOAD_BASE_DIR,
} from '../src/lib/storage';
import {
  hasWorkspaceAccess,
  canUser,
} from '../src/lib/auth/permissions';
import { createSessionToken, verifySessionToken } from '../src/lib/auth/session';
import fs from 'fs';
import path from 'path';

async function runTests() {
  console.log('--- Phase 1 Verification Tests ---');

  // 1. Test Storage Directory is outside public/
  console.log(`[Storage] Base directory: ${UPLOAD_BASE_DIR}`);
  const isOutsidePublic = !UPLOAD_BASE_DIR.includes(path.join('public', 'uploads'));
  console.log(`[Storage] Outside public web root: ${isOutsidePublic ? 'PASS' : 'FAIL'}`);

  // 2. Test Path Traversal Protection
  const traversalAttempt = getPrivateFilePath('../../secret.txt');
  console.log(`[Security] Traversal attempt blocked: ${traversalAttempt === null ? 'PASS' : 'FAIL'}`);

  // 3. Test Private Upload Save & Read
  const testBuffer = Buffer.from('Sensitive investigative whistleblower testimony 2026');
  const saved = await savePrivateUpload({
    buffer: testBuffer,
    subDirectory: 'test_submissions',
    fileName: 'leaked_records.pdf',
  });

  console.log(`[Storage] File saved at relative path: ${saved.relativePath}`);
  const resolvedPath = getPrivateFilePath(saved.relativePath);
  const fileExists = resolvedPath ? fs.existsSync(resolvedPath) : false;
  console.log(`[Storage] File verified on disk: ${fileExists ? 'PASS' : 'FAIL'}`);

  // 4. Test File Cleanup
  const deleted = await deletePrivateFile(saved.relativePath);
  const stillExists = resolvedPath ? fs.existsSync(resolvedPath) : false;
  console.log(`[Storage] File securely unlinked: ${deleted && !stillExists ? 'PASS' : 'FAIL'}`);

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
