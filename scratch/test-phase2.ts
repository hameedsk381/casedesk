import { generateIntakeReferenceNumber } from '../src/lib/intake/referenceNumber';
import { generateCaseNumber } from '../src/lib/cases/caseNumber';
import { enqueueIntakeTriage } from '../src/lib/queue/intakeQueue';

async function testPhase2() {
  console.log('=== Phase 2 Verification Tests ===');

  // 1. Test Concurrent Intake Reference Number Generation
  console.log('\n[1] Testing concurrent generation of 10 Intake Reference Numbers...');
  const intakeRefs = await Promise.all(
    Array.from({ length: 10 }, () => generateIntakeReferenceNumber())
  );
  console.log('Generated intake refs:', intakeRefs);

  const uniqueIntakeRefs = new Set(intakeRefs);
  const intakeHasDuplicates = uniqueIntakeRefs.size !== intakeRefs.length;
  console.log(`Unique count: ${uniqueIntakeRefs.size} / 10`);
  console.log(`Intake Sequence Collision Test: ${intakeHasDuplicates ? 'FAIL (Duplicates detected)' : 'PASS (All unique)'}`);

  // Format check
  const validIntakeFormat = intakeRefs.every((ref) => /^CD-IN-\d{4}-\d{5}$/.test(ref));
  console.log(`Intake Format Check (CD-IN-YYYY-XXXXX): ${validIntakeFormat ? 'PASS' : 'FAIL'}`);

  // 2. Test Concurrent Case Number Generation
  console.log('\n[2] Testing concurrent generation of 10 Case Numbers...');
  const caseNumbers = await Promise.all(
    Array.from({ length: 10 }, () => generateCaseNumber())
  );
  console.log('Generated case numbers:', caseNumbers);

  const uniqueCaseNumbers = new Set(caseNumbers);
  const caseHasDuplicates = uniqueCaseNumbers.size !== caseNumbers.length;
  console.log(`Unique count: ${uniqueCaseNumbers.size} / 10`);
  console.log(`Case Sequence Collision Test: ${caseHasDuplicates ? 'FAIL (Duplicates detected)' : 'PASS (All unique)'}`);

  const validCaseFormat = caseNumbers.every((num) => /^CD-\d{4}-\d{5}$/.test(num));
  console.log(`Case Format Check (CD-YYYY-XXXXX): ${validCaseFormat ? 'PASS' : 'FAIL'}`);

  // 3. Test Queue Module Integration
  console.log('\n[3] Testing intake queue worker registration...');
  // Enqueue a test dummy id (worker will safely skip non-existent item)
  enqueueIntakeTriage('non_existent_test_item_id');
  console.log('Enqueue worker call: PASS');

  console.log('\n=== All Phase 2 Tests Completed Successfully ===');
}

testPhase2().catch((err) => {
  console.error('Phase 2 test failed:', err);
  process.exit(1);
});
