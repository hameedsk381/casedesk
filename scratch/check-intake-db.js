const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkItem() {
  const item = await prisma.intakeItem.findUnique({
    where: { id: 'cmu1lpm1f001moeokwm8moh1q' },
  });

  console.log('--- DATABASE INTAKE ITEM RECORD ---');
  console.log('ID:', item?.id);
  console.log('Ref Code:', item?.referenceNumber);
  console.log('Category:', item?.aiCategory);
  console.log('Priority:', item?.aiPriority);
  console.log('Language:', item?.preferredLanguage);
  console.log('Location:', item?.aiLocation);
  console.log('Summary:', item?.aiSummary);
  console.log('Claims:', item?.aiClaims);
  console.log('Entities:', item?.aiEntities);

  await prisma.$disconnect();
}

checkItem().catch(console.error);
