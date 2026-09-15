import { triageWithGroq } from '../ai/groq';

export interface SensitiveItem {
  type: 'PHONE' | 'AADHAAR' | 'BANK_UPI' | 'MEDICAL' | 'CHILDREN_PERSONAL';
  label: string;
  count: number;
}

export interface TriageResult {
  summary: string;
  category: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  priorityReason: string;
  location: string;
  claims: string[];
  people: string[];
  organizations: string[];
  dates: string[];
  missingInformation: string[];
  suggestedAction: 'CREATE_CASE' | 'REQUEST_INFORMATION' | 'REVIEW' | 'POSSIBLE_DUPLICATE' | 'ARCHIVE';
  language: 'Telugu' | 'English' | 'Tenglish' | 'Other';
  sensitiveInfo: SensitiveItem[];
  normalizedEnglishSummary?: string;
}

export function detectLanguage(text: string): 'Telugu' | 'English' | 'Tenglish' | 'Other' {
  // Telugu Unicode block is \u0C00-\u0C7F
  const teluguRegex = /[\u0C00-\u0C7F]/;
  if (teluguRegex.test(text)) {
    return 'Telugu';
  }

  // Tenglish phonetic detection (Telugu in Latin alphabet)
  const tenglishRegex = /\b(maa|ooru|oori|lo|leru|ledu|levu|aindi|ayindi|undi|undhi|chesaru|chestunnaru|adugutunnaru|cheppandi|ravatledu|nunchi|kuda|guntalu|motham|prajalaku|mandhi|bribe|daggara|ippudu|rojulu|valla|pillalu|badha|ivvatledu|ninna|repu)\b/i;
  if (tenglishRegex.test(text)) {
    return 'Tenglish';
  }

  return 'English';
}

export function detectSensitiveInformation(text: string): SensitiveItem[] {
  const items: SensitiveItem[] = [];

  // 1. Phone numbers
  const phoneMatches = text.match(/(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g);
  if (phoneMatches && phoneMatches.length > 0) {
    items.push({
      type: 'PHONE',
      label: `${phoneMatches.length} phone number${phoneMatches.length > 1 ? 's' : ''}`,
      count: phoneMatches.length,
    });
  }

  // 2. Aadhaar numbers (12 digits with optional spaces or hyphens)
  const aadhaarMatches = text.match(/\b\d{4}[\s-]\d{4}[\s-]\d{4}\b/g);
  if (aadhaarMatches && aadhaarMatches.length > 0) {
    items.push({
      type: 'AADHAAR',
      label: `${aadhaarMatches.length} Aadhaar number${aadhaarMatches.length > 1 ? 's' : ''}`,
      count: aadhaarMatches.length,
    });
  }

  // 3. Bank details / UPI handles
  const upiMatches = text.match(/[\w.-]+@(okaxis|oksbi|okhdfcbank|paytm|ybl|upi|apl)\b/gi);
  if (upiMatches && upiMatches.length > 0) {
    items.push({
      type: 'BANK_UPI',
      label: `${upiMatches.length} financial / UPI account ID${upiMatches.length > 1 ? 's' : ''}`,
      count: upiMatches.length,
    });
  }

  // 4. Medical / Health details
  const medicalKeywords = [
    'icu', 'ventilator', 'oxygen', 'surgery', 'patient', 'hospitalized',
    'saturation', 'jaundice', 'vomiting', 'gastroenteritis', 'prescription',
  ];
  const hasMedical = medicalKeywords.some((k) => text.toLowerCase().includes(k));
  if (hasMedical) {
    items.push({
      type: 'MEDICAL',
      label: 'Patient medical / health status information',
      count: 1,
    });
  }

  // 5. Children / Minor personal information
  const minorKeywords = ['school kids', 'minor', 'primary student', 'class 7', 'children', '7th class'];
  const hasMinor = minorKeywords.some((k) => text.toLowerCase().includes(k));
  if (hasMinor) {
    items.push({
      type: 'CHILDREN_PERSONAL',
      label: 'Minor / school children references',
      count: 1,
    });
  }

  return items;
}

export async function triageIntakeItem(text: string, sourceType: string): Promise<TriageResult> {
  const language = detectLanguage(text);
  const sensitiveInfo = detectSensitiveInformation(text);

  // 1. Try Groq Llama-3.3-70b-versatile for high-fidelity newsroom triage
  try {
    const groqResult = await triageWithGroq(text, language);
    if (groqResult) {
      return {
        summary: groqResult.summary,
        category: groqResult.category,
        priority: groqResult.priority,
        priorityReason: groqResult.priorityReason,
        location: groqResult.location || (language === 'Telugu' ? 'Andhra Pradesh' : 'India'),
        claims: groqResult.claims && groqResult.claims.length > 0 ? groqResult.claims : ['Citizen report received for editorial review'],
        people: groqResult.people || [],
        organizations: groqResult.organizations || [],
        dates: groqResult.dates || [],
        missingInformation: groqResult.missingInformation || [],
        suggestedAction: groqResult.suggestedAction || 'REVIEW',
        language: (groqResult.language as any) || language,
        sensitiveInfo,
        normalizedEnglishSummary: groqResult.normalizedEnglishSummary,
      };
    }
  } catch (err) {
    console.warn('Groq triage failed, using fallback heuristic parser:', err);
  }

  // 2. Deterministic Heuristic Fallback
  const lower = text.toLowerCase();

  // Category & Priority heuristic analysis
  let category = 'Civic Infrastructure';
  let priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' = 'MEDIUM';
  let priorityReason = 'Standard citizen inquiry requiring initial editorial review.';

  if (
    lower.includes('ventilator') ||
    lower.includes('icu') ||
    lower.includes('oxygen') ||
    lower.includes('hospital') ||
    lower.includes('doctor') ||
    lower.includes('ambulance') ||
    lower.includes('రోగి') ||
    lower.includes('ఆసుపత్రి')
  ) {
    category = 'Healthcare';
    priority = 'URGENT';
    priorityReason = 'Immediate life-safety issue in public healthcare delivery.';
  } else if (
    lower.includes('canal') ||
    lower.includes('chemical') ||
    lower.includes('effluent') ||
    lower.includes('poison') ||
    lower.includes('pollution') ||
    lower.includes('burning') ||
    lower.includes('smoke') ||
    lower.includes('కాలుష్యం')
  ) {
    category = 'Environment';
    priority = 'URGENT';
    priorityReason = 'Active environmental contamination posing community health hazards.';
  } else if (
    lower.includes('pension') ||
    lower.includes('ration') ||
    lower.includes('mandal') ||
    lower.includes('aadhaar') ||
    lower.includes('bribe') ||
    lower.includes('sub-registrar') ||
    lower.includes('పింఛను')
  ) {
    category = 'Government Services';
    priority = 'HIGH';
    priorityReason = 'Systemic denial of welfare entitlements or administrative irregularity.';
  } else if (
    lower.includes('loan app') ||
    lower.includes('morphed') ||
    lower.includes('extort') ||
    lower.includes('harass') ||
    lower.includes('threat') ||
    lower.includes('police') ||
    lower.includes('fir')
  ) {
    category = 'Police / Law Enforcement';
    priority = 'URGENT';
    priorityReason = 'Active extortion, physical intimidation, or urgent law enforcement lapse.';
  } else if (
    lower.includes('school') ||
    lower.includes('toilet') ||
    lower.includes('ceiling') ||
    lower.includes('mid-day meal') ||
    lower.includes('college') ||
    lower.includes('పాఠశాల')
  ) {
    category = 'Education';
    priority = 'HIGH';
    priorityReason = 'Child welfare concern and public education infrastructure failure.';
  } else if (
    lower.includes('land') ||
    lower.includes('patta') ||
    lower.includes('encroach') ||
    lower.includes('survey') ||
    lower.includes('భూమి')
  ) {
    category = 'Land / Property';
    priority = 'HIGH';
    priorityReason = 'Dispute over public commons or suspected fraudulent deed registration.';
  } else if (
    lower.includes('sanitation') ||
    lower.includes('pf') ||
    lower.includes('wage') ||
    lower.includes('salary') ||
    lower.includes('strike')
  ) {
    category = 'Employment';
    priority = 'HIGH';
    priorityReason = 'Labour rights violation and withheld statutory social security.';
  } else if (
    lower.includes('water') ||
    lower.includes('sewage') ||
    lower.includes('contamination') ||
    lower.includes('pipe') ||
    lower.includes('తాగునీరు')
  ) {
    category = 'Infrastructure';
    priority = 'HIGH';
    priorityReason = 'Public water contamination creating epidemic disease danger.';
  } else if (
    lower.includes('boost') ||
    lower.includes('marketing') ||
    lower.includes('crypto') ||
    lower.includes('backlink') ||
    lower.includes('credit')
  ) {
    category = 'Other';
    priority = 'LOW';
    priorityReason = 'Promotional or commercial solicitation without investigative merit.';
  }

  // Location heuristic
  let location = 'Andhra Pradesh';
  if (lower.includes('guntur') || lower.includes('గుంటూరు')) location = 'Guntur, Andhra Pradesh';
  else if (lower.includes('vijayawada') || lower.includes('విజయవాడ')) location = 'Vijayawada, Andhra Pradesh';
  else if (lower.includes('tenali') || lower.includes('తెనాలి')) location = 'Tenali, Andhra Pradesh';
  else if (lower.includes('mangalagiri') || lower.includes('మంగళగిరి')) location = 'Mangalagiri, Andhra Pradesh';
  else if (lower.includes('paderu') || lower.includes('పాడేరు')) location = 'Paderu, Andhra Pradesh';
  else if (lower.includes('bapatla') || lower.includes('బాపట్ల')) location = 'Bapatla, Andhra Pradesh';
  else if (lower.includes('narasaraopet') || lower.includes('నరసరావుపేట')) location = 'Narasaraopet, Andhra Pradesh';
  else if (lower.includes('ongole') || lower.includes('ఒంగోలు')) location = 'Ongole, Andhra Pradesh';

  // Extract claims
  const sentences = text
    .split(/[.!?\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 20);

  const claims =
    sentences.length > 0
      ? sentences.slice(0, 3)
      : ['Citizen grievance alleging official administrative negligence'];

  // Missing information detection
  const missingInformation: string[] = [];
  if (!text.match(/\b(?:202\d|yesterday|today|last week|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)\b/i)) {
    missingInformation.push('Specific incident date or timeframe');
  }
  if (!text.match(/\b(?:Ward|Mandal|Village|Street|Road|Nagar|Colony|Feeder|AP\d{2})\b/i)) {
    missingInformation.push('Precise location coordinates or ward details');
  }
  if (!text.match(/\b(?:application|slip|FIR|complaint no|token|petition|acknowledgement|bill)\b/i)) {
    missingInformation.push('Official complaint / application reference number');
  }
  if (!text.match(/\b(?:photo|video|bill|document|proof|recording|slip)\b/i)) {
    missingInformation.push('Supporting documentary or video evidence');
  }

  // Determine suggested action
  let suggestedAction: 'CREATE_CASE' | 'REQUEST_INFORMATION' | 'REVIEW' | 'POSSIBLE_DUPLICATE' | 'ARCHIVE' = 'REVIEW';
  if (category === 'Other' && priority === 'LOW') {
    suggestedAction = 'ARCHIVE';
  } else if (missingInformation.length >= 3) {
    suggestedAction = 'REQUEST_INFORMATION';
  } else if (priority === 'URGENT' || priority === 'HIGH') {
    suggestedAction = 'CREATE_CASE';
  }

  // Summary generation
  let summary = text.length > 240 ? text.slice(0, 240) + '...' : text;
  let normalizedEnglishSummary: string | undefined = undefined;

  if (language === 'Telugu' || language === 'Tenglish') {
    normalizedEnglishSummary = `Citizen report received in ${language} from ${location.split(',')[0]} regarding ${category.toLowerCase()} irregularities. Complainant requests newsroom intervention and official verification.`;
    summary = normalizedEnglishSummary;
  }

  return {
    summary,
    category,
    priority,
    priorityReason,
    location,
    claims,
    people: ['Complainant Source', 'Department In-charge'],
    organizations: [category + ' Authority', 'District Collectorate'],
    dates: ['Recent incident'],
    missingInformation,
    suggestedAction,
    language,
    sensitiveInfo,
    normalizedEnglishSummary,
  };
}
