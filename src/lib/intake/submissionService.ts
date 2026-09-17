import prisma from '../db/prisma';
import { generateIntakeReferenceNumber } from './referenceNumber';
import { enqueueIntakeTriage } from '../queue/intakeQueue';
import { isMailConfigured, sendSubmissionNotification } from '../mailer';

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

  // Fallback to workspace directly — expose only generic public branding,
  // never the internal workspace name (which may contain personal identities)
  const defaultWorkspace = await prisma.workspace.findFirst();
  if (!defaultWorkspace) throw new Error('No active workspace found');

  return {
    id: 'default',
    workspaceId: defaultWorkspace.id,
    slug: defaultWorkspace.slug,
    title: 'Citizen Helpdesk',
    description: 'Report civic issues, government failures, and public problems to the team investigating them.',
    isActive: true,
    requireContact: false,
    allowAnonymous: true,
    allowVoice: true,
    allowAttachments: true,
    workspace: {
      id: defaultWorkspace.id,
      name: 'Citizen Helpdesk',
      slug: defaultWorkspace.slug,
      description: defaultWorkspace.description,
    },
  };
}

export async function processCitizenSubmission(payload: CitizenSubmissionPayload) {
  const endpoint = await getSubmissionEndpoint(payload.slug);
  const workspaceId = endpoint.workspaceId;

  // Validate consent
  if (payload.consentAccuracy === false || payload.consentNoGuarantee === false) {
    throw new Error('Mandatory consent confirmation required before submission.');
  }

  // Generate atomic reference number (e.g. CD-IN-2026-00042)
  const referenceNumber = await generateIntakeReferenceNumber();

  // Construct combined location string
  const locationParts = [payload.town, payload.district, payload.address].filter(Boolean);
  const combinedLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Andhra Pradesh';

  // Determine complainant profile attributes
  const senderName = payload.isAnonymous ? 'Anonymous Citizen' : (payload.senderName?.trim() || 'Anonymous Citizen');
  const senderPhone = payload.isAnonymous ? null : (payload.senderPhone?.trim() || null);
  const senderEmail = payload.isAnonymous ? null : (payload.senderEmail?.trim() || null);
  const consentToPublish = payload.consentToPublish || 'DISCUSS_FIRST';
  const consentToContact = payload.consentContact ?? true;

  // Persist IntakeItem immediately with status INCOMING (<100ms)
  const intakeItem = await prisma.intakeItem.create({
    data: {
      workspaceId,
      sourceType: 'WEB_FORM',
      senderName,
      senderPhone,
      senderEmail,
      preferredLanguage: payload.preferredLanguage || 'English',
      rawText: payload.story,
      transcription: payload.transcription || null,
      attachmentCount: payload.files?.length || 0,
      status: 'INCOMING',
      referenceNumber,
      consentToContact,
      consentToPublish,
      endpointSlug: endpoint.slug,
      incidentDate: payload.incidentDate || null,
      aiCategory: payload.category || 'General Civic Issue',
      aiLocation: combinedLocation,
      aiPriority: 'MEDIUM',
      aiSummary: 'Dispatch received. Asynchronous triage in progress...',
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
  const systemUser = await prisma.user.findFirst({ select: { id: true } });
  if (systemUser) {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        userId: systemUser.id,
        action: 'CITIZEN_SUBMISSION_RECEIVED',
        metadata: JSON.stringify({
          referenceNumber,
          intakeId: intakeItem.id,
          category: payload.category,
          isAnonymous: payload.isAnonymous,
          hasAttachments: (payload.files?.length || 0) > 0,
        }),
      },
    });
  }

  // Enqueue background worker for Groq Whisper transcription & Llama triage
  enqueueIntakeTriage(intakeItem.id);

  // Notify the newsroom by email — fire-and-forget so a slow SMTP server
  // never delays the citizen's submission response
  if (isMailConfigured()) {
    void (async () => {
      try {
        let recipients: string[] = [];
        const notifyOverride = process.env.WORKSPACE_NOTIFY_EMAIL;
        if (notifyOverride) {
          recipients = notifyOverride.split(',').map((e) => e.trim()).filter(Boolean);
        } else {
          const members = await prisma.workspaceMember.findMany({
            where: { workspaceId },
            select: { user: { select: { email: true } } },
            take: 10,
          });
          recipients = members.map((m) => m.user.email).filter(Boolean);
        }

        if (recipients.length > 0) {
          await sendSubmissionNotification({
            to: recipients,
            referenceNumber,
            category: intakeItem.aiCategory || 'General Civic Issue',
            location: combinedLocation,
            isAnonymous: Boolean(payload.isAnonymous),
            senderName: payload.isAnonymous ? null : payload.senderName || null,
            hasAttachments: (payload.files?.length || 0) > 0,
            storyPreview: payload.story,
          });
        }
      } catch (mailErr: any) {
        console.error('[submissionService] Email notification failed:', mailErr?.message || mailErr);
      }
    })();
  }

  // Return immediate response with milestone tracker steps
  return {
    success: true,
    status: 'INCOMING',
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
