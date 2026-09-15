import { AIProvider, ExtractedCaseData, ContentGenerationResult } from './types';

export class MockAIProvider implements AIProvider {
  async extractCaseFromMessage(message: string): Promise<ExtractedCaseData> {
    const text = message.toLowerCase();

    let category = 'Public Safety';
    let suggestedPriority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
    let priorityReason = 'Standard civic grievance requiring review.';

    if (text.includes('hospital') || text.includes('icu') || text.includes('doctor') || text.includes('medicine') || text.includes('oxygen')) {
      category = 'Healthcare';
      suggestedPriority = 'URGENT';
      priorityReason = 'Immediate life-safety issue in public health facility.';
    } else if (text.includes('pension') || text.includes('ration') || text.includes('mandal') || text.includes('collector')) {
      category = 'Government Services';
      suggestedPriority = 'HIGH';
      priorityReason = 'Direct denial of statutory welfare entitlements to citizens.';
    } else if (text.includes('police') || text.includes('fir') || text.includes('bribe') || text.includes('arrest') || text.includes('station')) {
      category = 'Police / Law Enforcement';
      suggestedPriority = 'HIGH';
      priorityReason = 'Law enforcement misconduct and fundamental rights concern.';
    } else if (text.includes('school') || text.includes('teacher') || text.includes('student') || text.includes('college')) {
      category = 'Education';
      suggestedPriority = 'MEDIUM';
      priorityReason = 'Impact on student welfare and educational infrastructure.';
    } else if (text.includes('land') || text.includes('patta') || text.includes('survey') || text.includes('encroach')) {
      category = 'Land / Property';
      suggestedPriority = 'HIGH';
      priorityReason = 'Property rights dispute with potential revenue record tampering.';
    } else if (text.includes('fraud') || text.includes('loan') || text.includes('app') || text.includes('money') || text.includes('bank')) {
      category = 'Financial';
      suggestedPriority = 'URGENT';
      priorityReason = 'Financial extortion and active threat to citizen wellbeing.';
    } else if (text.includes('water') || text.includes('drain') || text.includes('road') || text.includes('electricity') || text.includes('pipe')) {
      category = 'Infrastructure';
      suggestedPriority = 'HIGH';
      priorityReason = 'Essential public utility failure affecting community health.';
    } else if (text.includes('pollution') || text.includes('chemical') || text.includes('canal') || text.includes('factory')) {
      category = 'Environment';
      suggestedPriority = 'URGENT';
      priorityReason = 'Active ecological toxicity and community poisoning danger.';
    }

    // Extract location clues
    let location = 'Guntur, Andhra Pradesh';
    if (text.includes('vijayawada')) location = 'Vijayawada, Andhra Pradesh';
    else if (text.includes('tenali')) location = 'Tenali, Andhra Pradesh';
    else if (text.includes('ongole')) location = 'Ongole, Andhra Pradesh';
    else if (text.includes('mangalagiri')) location = 'Mangalagiri, Andhra Pradesh';
    else if (text.includes('narasaraopet')) location = 'Narasaraopet, Andhra Pradesh';
    else if (text.includes('bapatla')) location = 'Bapatla, Andhra Pradesh';

    // Heuristic titles
    const firstLine = message.trim().split('\n')[0].replace(/^[^a-zA-Z0-9]+/, '');
    const title = firstLine.length > 10 && firstLine.length < 90
      ? firstLine
      : `${category} Grievance Reported in ${location.split(',')[0]}`;

    // Extract potential claims
    const sentences = message
      .split(/[.!?\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 20);

    const claims = sentences.length > 0
      ? sentences.slice(0, 3)
      : [
          'Primary grievance reported by complainant',
          'Lack of timely official intervention',
          'Physical hardship and documentation provided',
        ];

    return {
      title,
      summary: message.length > 180 ? message.substring(0, 180) + '...' : message,
      category,
      location,
      people: ['Complainant (identified)', 'Local Officer in-charge'],
      organizations: ['District Administration', 'Concerned Department / Agency'],
      claims,
      timeline: [
        { event: 'Initial incident reported', dateApprox: 'Within past 48-72 hours' },
        { event: 'Citizen filed grievance locally', dateApprox: 'Recent' },
      ],
      evidenceMentioned: ['Photographs / Video recordings', 'Local receipts / application acknowledgement'],
      missingInformation: [
        'Official government registration / acknowledgement slip number',
        'Specific names and designations of on-duty officials',
        'Independent corroborating witness statements',
      ],
      suggestedPriority,
      priorityReason,
    };
  }

  async generateCaseBrief(caseData: any): Promise<string> {
    return `# EXECUTIVE BRIEF: ${caseData.caseNumber} — ${caseData.title}

## 1. Core Grievance
${caseData.summary || 'Summary pending.'}

## 2. Location & Jurisdiction
${caseData.location} | Category: ${caseData.category} | Priority: ${caseData.priority}

## 3. Verified Facts vs. Unverified Claims
- **Verified**: Documentation received and cross-referenced with local registers.
- **Unverified**: Specific allegations of malice or financial misappropriation await formal right of reply.

## 4. Current Status
- Status: ${caseData.status}
- Verification Status: ${caseData.verificationStatus}
- Publication Status: ${caseData.publicationStatus}

## 5. Next Operational Steps
1. Solicit and log official response from concerned authorities.
2. Complete field verification of secondary witness statements.
3. Conduct pre-publication editorial and legal safety review.`;
  }

  async generateContentFromCase(caseData: any, format: string): Promise<ContentGenerationResult> {
    const caseNum = caseData.caseNumber || 'CD-2026';
    const loc = caseData.location || 'Local area';
    const title = caseData.title || 'Public Issue';

    let script = '';
    let hook = '';

    if (format === 'INSTAGRAM_REEL' || format === 'YOUTUBE_SHORT') {
      hook = `Did you know what just happened in ${loc.split(',')[0]}? This 60-second investigation will shock you.`;
      script = `[SCENE 1 - HOOK - 0 to 5s]
Visual: High-impact headline text over documented proof.
Voiceover: "${hook}"

[SCENE 2 - THE PROBLEM - 5 to 20s]
Visual: Citizen grievance document & location shot.
Voiceover: "Citizens in ${loc} are facing ${caseData.summary || title}. We reviewed the official complaint records."

[SCENE 3 - WHAT WE VERIFIED - 20 to 40s]
Visual: Screen showing verified stamps and timeline.
Voiceover: "Here is what is confirmed on paper: The authorities received formal notice, yet the issue persists."

[SCENE 4 - AUTHORITY RESPONSE & CTA - 40 to 60s]
Visual: Right of reply letter and contact details.
Voiceover: "We sent an official inquiry. While we wait for their reply, here is how you can check if your area is affected. Link in bio to read our complete case dossier."`;
    } else if (format === 'INSTAGRAM_CAROUSEL') {
      hook = `EXPLAINED: The breakdown at ${loc.split(',')[0]} and what citizens need to know.`;
      script = `SLIDE 1 (COVER):
Headline: "${title}"
Subhead: "CaseDesk Investigation Dossier #${caseNum}"

SLIDE 2 (THE CITIZEN REPORT):
"What was reported: ${caseData.summary}"

SLIDE 3 (WHAT THE EVIDENCE SHOWS):
"We reviewed primary documents, timestamped records, and on-ground reports from ${loc}."

SLIDE 4 (RIGHT OF REPLY):
"We reached out to the relevant department for comment. Transparency demands that both sides are on record."

SLIDE 5 (CITIZEN ACTION GUIDE):
"How to file an official grievance / check your rights step-by-step."`;
    } else {
      // ARTICLE / SOCIAL_POST / YOUTUBE_VIDEO
      hook = `Special Investigation: Inside the ${title} in ${loc}`;
      script = `# ${title}
**CaseDesk Investigation Report #${caseNum}**
*Location: ${loc} | Published for Public Interest*

### The Background
${caseData.summary}

### Key Claims Under Investigation
${caseData.claims ? caseData.claims.map((c: any) => `- ${c.text} (${c.status})`).join('\n') : '- Primary allegation documented by source'}

### Evidence on Record
${caseData.evidence ? caseData.evidence.map((e: any) => `- ${e.name} [${e.type}]`).join('\n') : '- Official documents and witness statements'}

### Right of Reply
In accordance with responsible public-interest journalism guidelines, formal inquiries have been submitted to the responsible statutory authorities. Updates will be documented in the live case timeline.`;
    }

    return {
      format,
      title: `${format.replace(/_/g, ' ')}: ${title}`,
      hook,
      script,
      evidenceCallouts: ['Official complaint letter', 'Timeline audit logs'],
      safetyWarnings: [
        'Ensure complainant anonymous preferences are strictly respected.',
        'Do not declare guilt prior to receipt or expiry of statutory right-of-reply window.',
      ],
    };
  }

  async transcribeAudio(fileBuffer: Buffer, fileName: string): Promise<{ transcript: string; durationEstimate: number }> {
    return {
      transcript: `[Audio transcript for ${fileName}]: Namaste. I am calling from Guntur regarding the public service delay. We submitted all our applications with seal and token numbers three weeks ago. Every day they tell us the server is down or the officer is in a meeting. Other people are being asked for cash by brokers outside. Please help us get this investigated.`,
      durationEstimate: 48,
    };
  }
}
