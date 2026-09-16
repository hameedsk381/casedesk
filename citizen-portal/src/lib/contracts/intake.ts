import { z } from 'zod';

export const CIVIC_CATEGORIES = [
  { id: 'Healthcare', en: 'Healthcare & Hospitals', te: 'వైద్యం & ఆసుపత్రులు' },
  { id: 'Government Services', en: 'Government Services & Welfare', te: 'ప్రభుత్వ సేవలు & సంక్షేమం' },
  { id: 'Education', en: 'Schools & Education', te: 'పాఠశాలలు & విద్య' },
  { id: 'Land / Property', en: 'Land Encroachment & Property', te: 'భూ ఆక్రమణలు & ఆస్తులు' },
  { id: 'Corruption & Bribery', en: 'Corruption & Bribery', te: 'అవినీతి & లంచాలు' },
  { id: 'Civic Infrastructure', en: 'Roads, Water & Infrastructure', te: 'రహదారులు, నీరు & మౌలిక వసతులు' },
  { id: 'Environment & Land', en: 'Environment & Pollution', te: 'పర్యావరణం & కాలుష్యం' },
  { id: 'Consumer', en: 'Consumer Rights & Fraud', te: 'వినియోగదారుల హక్కులు & మోసాలు' },
  { id: 'Other', en: 'Other Issue', te: 'ఇతర అంశం' },
] as const;

export const CitizenSubmissionSchema = z.object({
  slug: z.string().optional(),
  story: z.string().min(1, 'Please describe what happened in your story or voice message.').trim(),
  transcription: z.string().optional(),
  district: z.string().optional(),
  town: z.string().optional(),
  address: z.string().optional(),
  incidentDate: z.string().optional(),
  category: z.string().optional(),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  senderEmail: z
    .string()
    .email('Invalid email address format')
    .optional()
    .or(z.literal(''))
    .nullable()
    .transform((val) => (val ? val : undefined)),
  preferredLanguage: z.string().optional().default('English'),
  isAnonymous: z.boolean().optional().default(false),
  consentAccuracy: z.boolean().optional().default(true),
  consentContact: z.boolean().optional().default(true),
  consentNoGuarantee: z.boolean().optional().default(true),
  consentToPublish: z.string().optional().default('DISCUSS_FIRST'),
  files: z
    .array(
      z.object({
        fileName: z.string(),
        filePath: z.string(),
        mimeType: z.string(),
        size: z.number().nonnegative(),
        type: z.string(),
      })
    )
    .optional(),
});

export type CitizenSubmissionInput = z.infer<typeof CitizenSubmissionSchema>;

export const TrackingStatusSchema = z.object({
  ref: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^CD-IN-\d{4}-\d{5}$/, 'Invalid reference format. Expected format: CD-IN-YYYY-XXXXX'),
});

export type TrackingStatusInput = z.infer<typeof TrackingStatusSchema>;
