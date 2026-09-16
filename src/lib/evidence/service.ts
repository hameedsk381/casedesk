import prisma from '../db/prisma';
import {
  savePrivateUpload,
  getPrivateFilePath,
  deletePrivateFile,
} from '../storage';

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
  const subDirectory = `cases/${workspaceId}/${params.caseId}`;

  // Save securely via centralized private storage
  const saved = await savePrivateUpload({
    buffer: params.fileBuffer,
    subDirectory,
    fileName: params.originalFilename,
  });

  // Determine evidence type from mimeType
  let evidenceType = params.type || 'OTHER';
  if (!params.type) {
    if (params.mimeType.startsWith('image/')) evidenceType = 'IMAGE';
    else if (params.mimeType.startsWith('video/')) evidenceType = 'VIDEO';
    else if (params.mimeType.startsWith('audio/')) evidenceType = 'AUDIO';
    else if (
      params.mimeType.includes('pdf') ||
      params.mimeType.includes('document') ||
      params.mimeType.includes('sheet') ||
      params.mimeType.includes('text')
    ) {
      evidenceType = 'DOCUMENT';
    }
  }

  const evidence = await prisma.evidence.create({
    data: {
      caseId: params.caseId,
      name: saved.fileName,
      type: evidenceType,
      filePath: saved.relativePath,
      mimeType: params.mimeType,
      size: saved.size,
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
      description: `Uploaded file "${saved.fileName}" (${(saved.size / 1024).toFixed(1)} KB).`,
      createdById: params.uploadedById,
      eventDate: new Date(),
    },
  });

  return evidence;
}

export async function getEvidenceFilePath(evidenceId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      case: {
        select: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (!evidence) return null;

  const absolutePath = getPrivateFilePath(evidence.filePath);
  if (!absolutePath) {
    return null;
  }

  return {
    absolutePath,
    relativePath: evidence.filePath,
    filename: evidence.name,
    mimeType: evidence.mimeType,
    size: evidence.size,
    workspaceId: evidence.case.workspaceId,
    caseId: evidence.caseId,
  };
}

export async function deleteEvidence(evidenceId: string, userId: string) {
  const evidence = await prisma.evidence.findUnique({
    where: { id: evidenceId },
    include: {
      case: {
        select: {
          id: true,
          workspaceId: true,
        },
      },
    },
  });

  if (!evidence) {
    throw new Error('Evidence not found');
  }

  // Delete from disk
  await deletePrivateFile(evidence.filePath);

  await prisma.evidence.delete({
    where: { id: evidenceId },
  });

  return { success: true };
}
