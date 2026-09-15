export interface DuplicateCheckResult {
  isDuplicate: boolean;
  confidence: number; // 0 to 1
  candidateCaseId?: string;
  candidateCaseNumber?: string;
  candidateCaseTitle?: string;
  matchReasons: string[];
}

export function detectDuplicateIntake(
  text: string,
  category: string,
  location: string,
  existingCases: Array<{
    id: string;
    caseNumber: string;
    title: string;
    summary: string;
    category: string;
    location: string;
  }>
): DuplicateCheckResult {
  if (!existingCases || existingCases.length === 0) {
    return { isDuplicate: false, confidence: 0, matchReasons: [] };
  }

  const rawLower = text.toLowerCase();
  const locationLower = location.toLowerCase();
  const categoryLower = category.toLowerCase();

  let bestMatch: {
    caseItem: (typeof existingCases)[0];
    score: number;
    reasons: string[];
  } | null = null;

  for (const c of existingCases) {
    let score = 0;
    const reasons: string[] = [];

    const caseTitleLower = c.title.toLowerCase();
    const caseSummaryLower = c.summary.toLowerCase();
    const caseLocationLower = c.location.toLowerCase();

    // 1. Category alignment (+20 points)
    if (c.category.toLowerCase() === categoryLower) {
      score += 0.2;
      reasons.push(`Matching category: ${c.category}`);
    }

    // 2. Geographic vicinity alignment (+25 points)
    const cities = ['guntur', 'vijayawada', 'tenali', 'mangalagiri', 'bapatla', 'ongole', 'narasaraopet', 'paderu'];
    for (const city of cities) {
      if ((rawLower.includes(city) || locationLower.includes(city)) && caseLocationLower.includes(city)) {
        score += 0.25;
        reasons.push(`Same geographic cluster: ${city.toUpperCase()}`);
        break;
      }
    }

    // 3. Keyword / Entity overlap (+40 points)
    const keywordClusters = [
      {
        cluster: 'Chemical canal effluent',
        keys: ['effluent', 'canal', 'dye', 'dyeing', 'tanker', 'kommamuru', 'toxic', 'waste', 'dumping', 'చాంబర్'],
      },
      {
        cluster: 'Hospital ventilator / ICU disruption',
        keys: ['icu', 'ventilator', 'oxygen', 'ggh', 'generator', 'backup', 'ambu bag', 'ఆసుపత్రి'],
      },
      {
        cluster: 'Pension meter mapping error',
        keys: ['widow', 'pension', 'rice mill', 'commercial meter', 'units', 'sultanabad', 'పింఛను'],
      },
      {
        cluster: 'School van overloading',
        keys: ['school van', 'omni', 'overcrowd', 'kids', 'eluru road', 'rto'],
      },
      {
        cluster: 'Loan app harassment',
        keys: ['loan app', 'rupeespeed', 'quickkredit', 'morph', 'morphed', 'contacts', 'extort'],
      },
      {
        cluster: 'Municipal water sewage contamination',
        keys: ['sewage', 'drinking water', 'pipeline', 'tap water', 'anandapet', 'sanath nagar', 'jaundice'],
      },
      {
        cluster: 'Sanitation workers PF theft',
        keys: ['sanitation', 'epfo', 'provident fund', 'pf', 'sewer', 'boots', 'contractor'],
      },
    ];

    for (const clusterObj of keywordClusters) {
      const intakeMatches = clusterObj.keys.filter((k) => rawLower.includes(k));
      const caseMatches = clusterObj.keys.filter((k) => caseTitleLower.includes(k) || caseSummaryLower.includes(k));

      if (intakeMatches.length >= 2 && caseMatches.length >= 2) {
        score += 0.45;
        reasons.push(`Core incident similarity: ${clusterObj.cluster} (${intakeMatches.slice(0, 3).join(', ')})`);
        break;
      }
    }

    // 4. Case number direct mention (+50 points)
    if (rawLower.includes(c.caseNumber.toLowerCase())) {
      score += 0.5;
      reasons.push(`Direct case reference: ${c.caseNumber}`);
    }

    // Keep highest scoring candidate
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = { caseItem: c, score, reasons };
    }
  }

  if (bestMatch && bestMatch.score >= 0.55) {
    const finalConfidence = Math.min(0.96, Math.round(bestMatch.score * 100) / 100);
    return {
      isDuplicate: true,
      confidence: finalConfidence,
      candidateCaseId: bestMatch.caseItem.id,
      candidateCaseNumber: bestMatch.caseItem.caseNumber,
      candidateCaseTitle: bestMatch.caseItem.title,
      matchReasons: bestMatch.reasons,
    };
  }

  return {
    isDuplicate: false,
    confidence: 0,
    matchReasons: [],
  };
}
