import fs from 'fs';
import path from 'path';
import prisma from '../db/prisma';

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads');

export async function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export async function saveEvidenceFile(params: {
  caseId: string;
  uploadedById: string;
  fileBuffer: Buffer;
  originalFilename: string;
  mimeType: string;
  description?: string;
  type?: string;
}) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: params.caseId },
    select: { id: true, workspaceId: true },
  });

  if (!caseRecord) {
    throw new Error('Case not found');
  }

  const workspaceId = caseRecord.workspaceId;
  const targetDir = path.join(UPLOAD_ROOT, workspaceId, params.caseId);
  await ensureDirectoryExists(targetDir);

  // Sanitize filename to prevent path traversal
  const safeName = path.basename(params.originalFilename).replace(/[^a-zA-Z0-9._-]/g, '_');
  const uniquePrefix = Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const finalFilename = `${uniquePrefix}_${safeName}`;
  const absolutePath = path.join(targetDir, finalFilename);

  // Write file to filesystem
  fs.writeFileSync(absolutePath, params.fileBuffer);

  const relativePath = path.join('uploads', workspaceId, params.caseId, finalFilename).replace(/\\/g, '/');

  // Determine evidence type from mimeType
  let evidenceType = params.type || 'OTHER';
  if (!params.type) {
    if (params.mimeType.startsWith('image/')) evidenceType = 'IMAGE';
    else if (params.mimeType.startsWith('video/')) evidenceType = 'VIDEO';
    else if (params.mimeType.startsWith('audio/')) evidenceType = 'AUDIO';
    else if (params.mimeType.includes('pdf') || params.mimeType.includes('document') || params.mimeType.includes('sheet') || params.mimeType.includes('text')) {
      evidenceType = 'DOCUMENT';
    }
  }

  const evidence = await prisma.evidence.create({
    data: {
      caseId: params.caseId,
      name: safeName,
      type: evidenceType,
      filePath: relativePath,
      mimeType: params.mimeType,
      size: params.fileBuffer.length,
      description: params.description || '',
      uploadedById: params.uploadedById,
    },
  });

  // Log case event
  await prisma.caseEvent.create({
    data: {
      caseId: params.caseId,
      type: 'DOCUMENT_UPLOADED',
      title: 'Evidence Uploaded',
      description: `Uploaded file "${safeName}" (${(params.fileBuffer.length / 1024).toFixed(1)} KB).`,
      createdById: params.uploadedById,
      eventDate: new Date(),
    },
  });

  return evidence;
}

export async function getEvidenceFilePath(evidenceId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
  });

  if (!evidence) return null;

  const sanitizedRelative = evidence.filePath.replace(/^uploads[\\/]/, '');
  const absolutePath = path.join(process.cwd(), 'uploads', sanitizedRelative);
  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  return {
    absolutePath,
    filename: evidence.name,
    mimeType: evidence.mimeType,
    size: evidence.size,
  };
}

export async function deleteEvidence(evidenceId: string, userId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
  });

  if (!evidence) {
    throw new Error('Evidence not found');
  }

  const sanitizedRelative = evidence.filePath.replace(/^uploads[\\/]/, '');
  const absolutePath = path.join(process.cwd(), 'uploads', sanitizedRelative);
  if (fs.existsSync(absolutePath)) {
    try {
      fs.unlinkSync(absolutePath);
    } catch (err) {
      console.error('Failed to unlink local evidence file:', err);
    }
  }

  await prisma.evidence.delete({
    where: { id: evidenceId },
  });

  return { success: true };
}
