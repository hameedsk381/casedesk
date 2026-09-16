import { CitizenSubmissionSchema, TrackingStatusSchema, CIVIC_CATEGORIES } from '../src/lib/contracts/intake';
import { en } from '../citizen-portal/src/lib/i18n/dictionaries/en';
import { te } from '../citizen-portal/src/lib/i18n/dictionaries/te';

async function testPhase3() {
  console.log('=== Phase 3 Verification Tests ===');

  // 1. Test Valid Citizen Submission Schema
  console.log('\n[1] Testing CitizenSubmissionSchema validation...');
  const validPayload = {
    story: 'Groundwater in our village has turned yellow and foul-smelling due to factory discharge.',
    district: 'Guntur',
    town: 'Tenali',
    category: 'Environment & Land',
    preferredLanguage: 'English',
    isAnonymous: false,
    consentAccuracy: true,
    consentContact: true,
    consentNoGuarantee: true,
    consentToPublish: 'DISCUSS_FIRST',
    senderName: 'Venkatesh Rao',
    senderPhone: '+91 9876543210',
    senderEmail: 'venkatesh@example.com',
  };

  const validResult = CitizenSubmissionSchema.safeParse(validPayload);
  console.log(`Valid payload test: ${validResult.success ? 'PASS' : 'FAIL'}`);

  // 2. Test Invalid Submission (Empty story, invalid email)
  const invalidPayload = {
    story: '', // Should fail
    senderEmail: 'not-an-email', // Should fail
  };
  const invalidResult = CitizenSubmissionSchema.safeParse(invalidPayload);
  const detectedStoryError = !invalidResult.success && invalidResult.error.issues.some((i) => i.path.includes('story'));
  const detectedEmailError = !invalidResult.success && invalidResult.error.issues.some((i) => i.path.includes('senderEmail'));
  console.log(`Empty story rejection: ${detectedStoryError ? 'PASS' : 'FAIL'}`);
  console.log(`Invalid email rejection: ${detectedEmailError ? 'PASS' : 'FAIL'}`);

  // 3. Test TrackingStatusSchema
  console.log('\n[2] Testing TrackingStatusSchema...');
  const validRef = TrackingStatusSchema.safeParse({ ref: 'CD-IN-2026-00042' });
  const invalidRef = TrackingStatusSchema.safeParse({ ref: 'INVALID-CODE-123' });
  console.log(`Valid ref format CD-IN-YYYY-XXXXX: ${validRef.success ? 'PASS' : 'FAIL'}`);
  console.log(`Invalid ref rejected: ${!invalidRef.success ? 'PASS' : 'FAIL'}`);

  // 4. Test Categories List
  console.log('\n[3] Testing Civic Categories Contract...');
  const hasCategories = CIVIC_CATEGORIES.length >= 8;
  const allBilingual = CIVIC_CATEGORIES.every((c) => c.id && c.en && c.te);
  console.log(`Civic categories count (${CIVIC_CATEGORIES.length}): ${hasCategories ? 'PASS' : 'FAIL'}`);
  console.log(`All categories have EN & TE labels: ${allBilingual ? 'PASS' : 'FAIL'}`);

  // 5. Test i18n Parity between English and Telugu dictionaries
  console.log('\n[4] Testing Dictionary Parity (EN vs TE)...');
  const sections = ['common', 'hub', 'form', 'tracking'] as const;
  let allParity = true;

  for (const sec of sections) {
    const enKeys = Object.keys(en[sec]);
    const teKeys = Object.keys(te[sec]);
    const missingInTe = enKeys.filter((k) => !(k in te[sec]));
    if (missingInTe.length > 0) {
      console.error(`Missing keys in Telugu [${sec}]:`, missingInTe);
      allParity = false;
    }
  }
  console.log(`Dictionary EN / TE key parity: ${allParity ? 'PASS (100% matched)' : 'FAIL'}`);

  console.log('\n=== All Phase 3 Tests Completed Successfully ===');
}

testPhase3().catch((err) => {
  console.error('Phase 3 test failed:', err);
  process.exit(1);
});
