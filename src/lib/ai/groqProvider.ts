import fs from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import type { AIProvider, ExtractedCaseData, ContentGenerationResult } from './types';
import { groq, GROQ_MODELS, transcribeAudioWithGroq } from './groq';
import { MockAIProvider } from './mockProvider';

/**
 * Groq-backed provider. Every method degrades to the local deterministic
 * provider when the Groq client is unavailable (no GROQ_API_KEY) or a request
 * fails, so a missing key or an API outage never breaks the desk.
 */
export class GroqAIProvider implements AIProvider {
  constructor(private readonly fallback: AIProvider = new MockAIProvider()) {}

  async extractCaseFromMessage(message: string): Promise<ExtractedCaseData> {
    if (!groq) return this.fallback.extractCaseFromMessage(message);
    try {
      const content = await this.jsonCompletion(
        `You are an investigative newsroom intake assistant.
Read this citizen report and extract structured case data.

CITIZEN REPORT:
"""
${message}
"""

Return ONLY JSON matching:
{
  "title": "short factual working title (max 90 chars)",
  "summary": "1-2 sentence neutral summary",
  "category": "one of the newsroom categories",
  "location": "district/town/landmark, or 'Unspecified'",
  "people": ["names or roles mentioned"],
  "organizations": ["departments, institutions, companies mentioned"],
  "claims": ["distinct verifiable claims made by the complainant"],
  "timeline": [{ "event": "what happened", "dateApprox": "when, if stated" }],
  "evidenceMentioned": ["documents, photos, recordings referenced"],
  "missingInformation": ["what is needed to verify this report"],
  "suggestedPriority": "LOW | MEDIUM | HIGH | URGENT",
  "priorityReason": "one sentence editorial justification"
}`,
        'You extract structured, factual case data from citizen reports. Respond only in valid JSON.',
        1200
      );
      if (!content) return this.fallback.extractCaseFromMessage(message);
      return {
        title: content.title || 'Untitled report',
        summary: content.summary || message.slice(0, 180),
        category: content.category || 'Other',
        location: content.location || 'Unspecified',
        people: content.people || [],
        organizations: content.organizations || [],
        claims: content.claims || [],
        timeline: content.timeline || [],
        evidenceMentioned: content.evidenceMentioned || [],
        missingInformation: content.missingInformation || [],
        suggestedPriority: content.suggestedPriority || 'MEDIUM',
        priorityReason: content.priorityReason || 'Standard review.',
      };
    } catch (error) {
      console.error('Groq extractCaseFromMessage failed, using fallback:', error);
      return this.fallback.extractCaseFromMessage(message);
    }
  }

  async generateCaseBrief(caseData: any): Promise<string> {
    if (!groq) return this.fallback.generateCaseBrief(caseData);
    try {
      const completion = await groq.chat.completions.create({
        model: GROQ_MODELS.INVESTIGATIVE_REASONING,
        messages: [
          {
            role: 'system',
            content:
              'You are the managing editor of an investigative newsroom. Write concise, neutral, evidence-led briefs in Markdown. Never assert unverified claims as fact.',
          },
          {
            role: 'user',
            content: `Write an internal case brief for the editorial team.

${caseContext(caseData)}

Use these sections:
# EXECUTIVE BRIEF: {caseNumber} — {title}
## 1. Core Grievance
## 2. Location & Jurisdiction
## 3. Verified Facts vs. Unverified Claims
## 4. Current Status
## 5. Next Operational Steps (2-4 concrete actions)

Base every statement on the data above. Mark anything not yet corroborated as unverified.`,
          },
        ],
        temperature: 0.2,
        max_tokens: 1200,
      });
      return completion.choices[0]?.message?.content?.trim() || (await this.fallback.generateCaseBrief(caseData));
    } catch (error) {
      console.error('Groq generateCaseBrief failed, using fallback:', error);
      return this.fallback.generateCaseBrief(caseData);
    }
  }

  async generateContentFromCase(caseData: any, format: string): Promise<ContentGenerationResult> {
    if (!groq) return this.fallback.generateContentFromCase(caseData, format);
    try {
      const content = await this.jsonCompletion(
        `You are a responsible public-interest content editor. Turn this verified case dossier into a ${format.replace(/_/g, ' ')} script.

${caseContext(caseData)}

Return ONLY JSON matching:
{
  "format": "${format}",
  "title": "publishable headline",
  "hook": "one-line opening hook",
  "script": "the full, ready-to-record script with scene/section markers appropriate to ${format}",
  "evidenceCallouts": ["specific verified evidence a viewer should be shown"],
  "safetyWarnings": ["legal/editorial cautions for this specific story"]
}

Rules:
- Qualify every unverified claim as an allegation ("alleged", "claimed").
- Do not name individuals as guilty.
- State that a right of reply was sought where a response is pending.`,
        'You write factual, legally careful newsroom scripts. Respond only in valid JSON.',
        2400
      );
      if (!content) return this.fallback.generateContentFromCase(caseData, format);
      return {
        format,
        title: content.title || `${format.replace(/_/g, ' ')}: ${caseData.title || 'Public Issue'}`,
        hook: content.hook || '',
        script: content.script || '',
        evidenceCallouts: content.evidenceCallouts || [],
        safetyWarnings: content.safetyWarnings || [],
      };
    } catch (error) {
      console.error('Groq generateContentFromCase failed, using fallback:', error);
      return this.fallback.generateContentFromCase(caseData, format);
    }
  }

  async transcribeAudio(fileBuffer: Buffer, fileName: string): Promise<{ transcript: string; durationEstimate: number }> {
    if (!groq) return this.fallback.transcribeAudio(fileBuffer, fileName);

    const tempPath = path.join(os.tmpdir(), `casedesk-transcribe-${randomUUID()}${path.extname(fileName) || '.audio'}`);
    try {
      await fs.promises.writeFile(tempPath, fileBuffer, { mode: 0o600 });
      const text = await transcribeAudioWithGroq(tempPath);
      if (!text) return this.fallback.transcribeAudio(fileBuffer, fileName);
      return { transcript: text, durationEstimate: Math.ceil(text.split(/\s+/).length / 2.5) };
    } catch (error) {
      console.error('Groq transcribeAudio failed, using fallback:', error);
      return this.fallback.transcribeAudio(fileBuffer, fileName);
    } finally {
      await fs.promises.unlink(tempPath).catch(() => {});
    }
  }

  private async jsonCompletion(prompt: string, system: string, maxTokens: number): Promise<any | null> {
    if (!groq) return null;
    const completion = await groq.chat.completions.create({
      model: GROQ_MODELS.INVESTIGATIVE_REASONING,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: maxTokens,
    });
    const raw = completion.choices[0]?.message?.content;
    if (!raw) return null;
    return JSON.parse(raw);
  }
}

/** Compact, prompt-friendly digest of the case record. */
function caseContext(caseData: any): string {
  const claims = (caseData.claims || [])
    .map((c: any) => `- ${c.text} [${c.status}]`)
    .join('\n') || '- (none recorded)';
  const evidence = (caseData.evidence || [])
    .map((e: any) => `- ${e.name} [${e.type}]`)
    .join('\n') || '- (none recorded)';
  const responses = (caseData.responseRequests || [])
    .map((r: any) => `- ${r.contact?.organization || r.contact?.role || 'Authority'} [${r.status}]`)
    .join('\n') || '- (none recorded)';

  return `CASE ${caseData.caseNumber || ''}
Title: ${caseData.title || ''}
Category: ${caseData.category || ''}
Priority: ${caseData.priority || ''}
Location: ${caseData.location || ''}
Status: ${caseData.status || ''}
Verification: ${caseData.verificationStatus || ''}
Summary: ${caseData.summary || ''}

CLAIMS:
${claims}

EVIDENCE:
${evidence}

RIGHT OF REPLY:
${responses}`;
}
