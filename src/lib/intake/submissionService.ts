import prisma from '../db/prisma';
import path from 'path';
import { triageIntakeItem } from './triage';
import { detectDuplicateIntake } from './duplicateDetector';
import { generateIntakeReferenceNumber } from './referenceNumber';
import { transcribeAudioWithGroq } from '../ai/groq';

export interface CitizenSubmissionPayload {
  slug?: string;
  story: string;
  transcription?: string;
  district?: string;
  town?: string;
  address?: string;
  incidentDate?: string;
  category?: string;
  senderName?: string;
  senderPhone?: string;
  senderEmail?: string;
  preferredLanguage?: string;
  isAnonymous?: boolean;
  consentAccuracy?: boolean;
  consentContact?: boolean;
  consentNoGuarantee?: boolean;
  consentToPublish?: string; // "YES" | "NO" | "DISCUSS_FIRST"
  files?: Array<{
    fileName: string;
    filePath: string;
    mimeType: string;
    size: number;
    type: string;   
  }>;
}

export async function getSubmissionEndpoint(slug?: string) {
  if (slug) {
    const endpoint = await prisma.submissionEndpoint.findUnique({
      where: { slug },
      include: {
        workspace: {
          select: { id: true, name: true, slug: true, description: true },
        },
      },
    });
    if (endpoint && endpoint.isActive) {
      return endpoint;
    }
  }

  // Fallback to first active endpoint or default workspace
  const defaultEndpoint = await prisma.submissionEndpoint.findFirst({
    where: { isActive: true },
    include: {
      workspace: {
        select: { id: true, name: true, slug: true, description: true },
      },
    },
  });

  if (defaultEndpoint) return defaultEndpoint;

  // Fallback to workspace directly
  const defaultWorkspace = await prisma.workspace.findFirst();
  if (!defaultWorkspace) throw new Error('No active workspace found');

  return {
    id: 'default',
    workspaceId: defaultWorkspace.id,
    slug: defaultWorkspace.slug,
    title: `${defaultWorkspace.name} — Citizen Story Portal`,
    description: 'Report civic emergencies and issues directly to the investigative newsroom.',
    isActive: true,
    requireContact: false,
    allowAnonymous: true,
    allowVoice: true,
    allowAttachments: true,
    workspace: defaultWorkspace,
  };
}

export async function processCitizenSubmission(payload: CitizenSubmissionPayload) {
  const endpoint = await getSubmissionEndpoint(payload.slug);
  const workspaceId = endpoint.workspaceId;

  // Validate consent
  if (payload.consentAccuracy === false || payload.consentNoGuarantee === false) {
    throw new Error('Mandatory consent confirmation required before submission.');
  }

  // Generate Reference Number
  const referenceNumber = await generateIntakeReferenceNumber();

  // If voice audio is provided without transcription, transcribe using Groq Whisper Large V3 Turbo
  let transcription = payload.transcription || null;
  if (!transcription && payload.files && payload.files.length > 0) {
    const audioFile = payload.files.find((f) => f.type === 'AUDIO' || f.mimeType?.startsWith('audio/'));
    if (audioFile) {
      try {
        const diskPath = path.join(process.cwd(), 'public', audioFile.filePath.replace(/^\//, ''));
        const transcribed = await transcribeAudioWithGroq(
          diskPath,
          payload.preferredLanguage === 'Telugu' ? 'te' : 'en'
        );
        if (transcribed) {
          transcription = transcribed;
          if (!payload.story || payload.story.startsWith('Voice dispatch')) {
            payload.story = transcribed;
          }
        }
      } catch (audioErr) {
        console.warn('Voice transcription fallback:', audioErr);
      }
    }
  }

  // Construct combined location string
  const locationParts = [payload.town, payload.district, payload.address].filter(Boolean);
  const combinedLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Andhra Pradesh';

  // Run AI Triage (Llama 3.3 70B Versatile via Groq)
  const triaged = await triageIntakeItem(payload.story, 'WEB_FORM');


  // Fetch existing cases for duplicate detection
  const existingCases = await prisma.case.findMany({
    where: { workspaceId },
    select: {
      id: true,
      caseNumber: true,
      title: true,
      summary: true,
      category: true,
      location: true,
    },
  });

  // Check for potential duplicate cases
  const duplicate = detectDuplicateIntake(
    payload.story,
    payload.category || triaged.category,
    combinedLocation,
    existingCases
  );

  // Determine final attributes
  const senderName = payload.isAnonymous ? 'Anonymous Citizen' : (payload.senderName?.trim() || 'Anonymous Citizen');
  const senderPhone = payload.isAnonymous ? null : (payload.senderPhone?.trim() || null);
  const senderEmail = payload.isAnonymous ? null : (payload.senderEmail?.trim() || null);
  const consentToPublish = payload.consentToPublish || 'DISCUSS_FIRST';
  const consentToContact = payload.consentContact ?? true;

  // Create IntakeItem with attachments
  const intakeItem = await prisma.intakeItem.create({
    data: {
      workspaceId,
      sourceType: 'WEB_FORM',
      senderName,
      senderPhone,
      senderEmail,
      preferredLanguage: payload.preferredLanguage || triaged.language,
      rawText: payload.story,
      transcription: transcription || payload.transcription || null,
      attachmentCount: payload.files?.length || 0,
      status: 'NEEDS_REVIEW',
      referenceNumber,
      consentToContact,
      consentToPublish,
      endpointSlug: endpoint.slug,
      incidentDate: payload.incidentDate || null,
      aiSummary: triaged.summary,
      aiCategory: payload.category || triaged.category,
      aiPriority: triaged.priority,
      aiPriorityReason: triaged.priorityReason,
      aiLocation: combinedLocation || triaged.location,
      aiEntities: JSON.stringify({
        people: triaged.people,
        organizations: triaged.organizations,
        dates: triaged.dates,
      }),
      aiClaims: JSON.stringify(triaged.claims),
      aiMissingInformation: JSON.stringify(triaged.missingInformation),
      sensitiveInfoDetected: JSON.stringify(triaged.sensitiveInfo),
      duplicateCandidate: duplicate.isDuplicate,
      duplicateCaseId: duplicate.candidateCaseId || null,
      attachments: {
        create: (payload.files || []).map((f) => ({
          fileName: f.fileName,
          filePath: f.filePath,
          mimeType: f.mimeType,
          size: f.size,
          type: f.type,
        })),
      },
    },
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      workspaceId,
      userId: (await prisma.user.findFirst({ select: { id: true } }))?.id || '',
      action: 'CITIZEN_SUBMISSION_RECEIVED',
      metadata: JSON.stringify({
        referenceNumber,
        intakeId: intakeItem.id,
        category: intakeItem.aiCategory,
        isAnonymous: payload.isAnonymous,
        hasAttachments: (payload.files?.length || 0) > 0,
      }),
    },
  });

  return {
    success: true,
    referenceNumber,
    intakeId: intakeItem.id,
    triageCategory: intakeItem.aiCategory,
    urgency: intakeItem.aiPriority,
    receivedAt: intakeItem.createdAt,
    endpointTitle: endpoint.title,
    whatNext: [
      { step: 1, title: 'Submission received', completed: true },
      { step: 2, title: 'Initial review by journalists', completed: false },
      { step: 3, title: 'Additional information, if required', completed: false },
      { step: 4, title: 'Investigation, if selected', completed: false },
      { step: 5, title: 'Possible public reporting', completed: false },
    ],
  };
}

