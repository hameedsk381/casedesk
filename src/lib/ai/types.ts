export interface ExtractedCaseData {
  title: string;
  summary: string;
  category: string;
  location: string;
  people: string[];
  organizations: string[];
  claims: string[];
  timeline: Array<{ event: string; dateApprox?: string }>;
  evidenceMentioned: string[];
  missingInformation: string[];
  suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priorityReason: string;
}

export interface ContentGenerationResult {
  format: string;
  title: string;
  hook: string;
  script: string;
  evidenceCallouts: string[];
  safetyWarnings: string[];
}

export interface AIProvider {
  extractCaseFromMessage(message: string): Promise<ExtractedCaseData>;
  generateCaseBrief(caseData: any): Promise<string>;
  generateContentFromCase(caseData: any, format: string): Promise<ContentGenerationResult>;
  transcribeAudio(fileBuffer: Buffer, fileName: string): Promise<{ transcript: string; durationEstimate: number }>;
}
