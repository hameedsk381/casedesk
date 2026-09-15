import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing records...');
  await prisma.submissionEndpoint.deleteMany();
  await prisma.intakeAttachment.deleteMany();
  await prisma.intakeItem.deleteMany();
  await prisma.inboxMessage.deleteMany();
  await prisma.activityLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.content.deleteMany();
  await prisma.responseRequest.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.task.deleteMany();
  await prisma.caseEvent.deleteMany();
  await prisma.evidence.deleteMany();
  await prisma.verificationItem.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.source.deleteMany();
  await prisma.case.deleteMany();
  await prisma.workspaceMember.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  console.log('Seeding users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const sarah = await prisma.user.create({
    data: {
      name: 'Sarah Khan',
      email: 'sarah@casedesk.local',
      passwordHash,
      role: 'OWNER',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const arun = await prisma.user.create({
    data: {
      name: 'Arun Verma',
      email: 'arun@casedesk.local',
      passwordHash,
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const priya = await prisma.user.create({
    data: {
      name: 'Priya Nair',
      email: 'priya@casedesk.local',
      passwordHash,
      role: 'EDITOR',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  const raj = await prisma.user.create({
    data: {
      name: 'Rajesh Sharma',
      email: 'raj@casedesk.local',
      passwordHash,
      role: 'VIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  });

  console.log('Seeding workspace...');
  const workspace = await prisma.workspace.create({
    data: {
      name: 'Janata Investigation Desk',
      slug: 'janata-desk',
      description: 'Independent civic investigations and public accountability newsroom.',
      members: {
        create: [
          { userId: sarah.id, role: 'OWNER' },
          { userId: arun.id, role: 'ADMIN' },
          { userId: priya.id, role: 'EDITOR' },
          { userId: raj.id, role: 'VIEWER' },
        ],
      },
    },
  });

  console.log('Seeding default submission endpoint for citizen portal...');
  await prisma.submissionEndpoint.create({
    data: {
      workspaceId: workspace.id,
      slug: 'janata-investigation-desk',
      title: 'Janata Investigation Desk — Citizen Story Portal',
      description: 'Report civic emergencies, public fund diversions, government service failures, and environmental hazards directly to Sarah Khan and the investigative journalism desk.',
      isActive: true,
      requireContact: false,
      allowAnonymous: true,
      allowVoice: true,
      allowAttachments: true,
    },
  });

  console.log('Seeding 10 civic journalism cases with operational next actions & health...');

  // 1. Government Hospital ICU
  const case1 = await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00001',
      workspaceId: workspace.id,
      title: 'Government Hospital ICU Ventilator & Oxygen Pressure Failure',
      summary: 'Relatives of ICU patients allege sudden oxygen pressure drops and non-functional backup generators during a 45-minute power disruption at the District Headquarters Hospital.',
      category: 'Healthcare',
      priority: 'URGENT',
      status: 'UNDER_REVIEW',
      location: 'Guntur, Andhra Pradesh',
      sourceType: 'WHATSAPP',
      sourceText: 'Namaste Sarah garu, yesterday night at Guntur GGH 3rd floor ICU, power went out at 11:20 PM. Back-up generator did not start for 40 mins. Nurses were using manual AMBU bags. Two patients had severe saturation drops. Hospital staff warned us not to record videos or call anyone. Please look into this.',
      aiSummary: 'Report of critical ICU equipment failure due to backup power delay at GGH Guntur on Sep 12. Manual ventilation required for multiple critical patients.',
      aiPriorityReason: 'Immediate life-safety risk involving public healthcare infrastructure and potential negligence in critical care.',
      verificationStatus: 'IN_PROGRESS',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: 'Hospital Superintendent response overdue — send legal reminder',
      healthStatus: 'BLOCKED',
      healthReason: 'Right of reply deadline expired 2 days ago without official statement',
      assignedToId: sarah.id,
      createdById: sarah.id,
    },
  });

  await prisma.source.create({
    data: {
      caseId: case1.id,
      name: 'K. Venkatesh Rao',
      phone: '+91 98480 23145',
      email: 'venkat.rao92@gmail.com',
      preferredLanguage: 'Telugu / English',
      location: 'Kothapet, Guntur',
      anonymous: false,
      consentToContact: true,
      consentToPublish: false,
      notes: 'Patient brother is admitted in ICU bed 14. Very cooperative and willing to provide time-stamped hospital pharmacy slips.',
    },
  });

  await prisma.claim.createMany({
    data: [
      {
        caseId: case1.id,
        text: 'Power outage occurred in ICU block on Sep 12 from 11:20 PM to 12:05 AM.',
        status: 'SUPPORTED',
        source: 'Complainant statement and ICU pharmacy timestamp slips',
      },
      {
        caseId: case1.id,
        text: 'Automatic diesel backup generator failed to switch on due to lack of diesel fuel.',
        status: 'UNVERIFIED',
        source: 'WhatsApp allegation',
      },
      {
        caseId: case1.id,
        text: 'Nurses had to manually bag ventilate 6 patients during the disruption.',
        status: 'PARTIALLY_SUPPORTED',
        source: 'Audio recording of ward boy statement',
      },
    ],
  });

  await prisma.verificationItem.createMany({
    data: [
      {
        caseId: case1.id,
        statement: 'Hospital admission records and patient bed numbers confirmed',
        status: 'VERIFIED',
        evidenceRequired: 'OP ticket & admission slip',
        verifiedById: sarah.id,
        verifiedAt: new Date(Date.now() - 86400000 * 2),
      },
      {
        caseId: case1.id,
        statement: 'Power board load-shedding log for Sambasiva Pet electrical feeder',
        status: 'PENDING',
        evidenceRequired: 'APCPDCL substation log sheet',
      },
      {
        caseId: case1.id,
        statement: 'Hospital Superintendent formal statement on generator maintenance',
        status: 'PENDING',
        evidenceRequired: 'Official written response or press release',
      },
    ],
  });

  await prisma.evidence.createMany({
    data: [
      {
        caseId: case1.id,
        name: 'ICU_Admission_Slip_Bed14.pdf',
        type: 'DOCUMENT',
        filePath: 'uploads/janata-desk/CD-2026-00001/ICU_Admission_Slip_Bed14.pdf',
        mimeType: 'application/pdf',
        size: 428000,
        description: 'Official admission receipt and doctor prescription slip dated Sep 11.',
        verificationStatus: 'VERIFIED',
        uploadedById: sarah.id,
      },
      {
        caseId: case1.id,
        name: 'Ward_Corridor_Darkness_Video.mp4',
        type: 'VIDEO',
        filePath: 'uploads/janata-desk/CD-2026-00001/Ward_Corridor_Darkness_Video.mp4',
        mimeType: 'video/mp4',
        size: 14200000,
        description: '32-second cell phone video showing corridor pitch black and emergency sirens echoing.',
        verificationStatus: 'SUPPORTED',
        uploadedById: sarah.id,
      },
    ],
  });

  await prisma.caseEvent.createMany({
    data: [
      {
        caseId: case1.id,
        type: 'CASE_CREATED',
        title: 'Case received via WhatsApp hotline',
        description: 'Initial message and hospital admission slips received from complainant.',
        eventDate: new Date(Date.now() - 86400000 * 3),
      },
      {
        caseId: case1.id,
        type: 'RESPONSE_REQUESTED',
        title: 'Right of reply letter sent to Hospital Superintendent',
        description: 'Sent formal questions regarding backup power failure and diesel reserve log.',
        eventDate: new Date(Date.now() - 86400000 * 2),
      },
    ],
  });

  await prisma.task.createMany({
    data: [
      {
        caseId: case1.id,
        title: 'Cross-check APCPDCL feeder power tripping logs',
        description: 'Call Substation Engineer at Collectorate Feeder to verify grid outage timings.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        assignedToId: arun.id,
        dueDate: new Date(Date.now() + 86400000),
        createdById: sarah.id,
      },
      {
        caseId: case1.id,
        title: 'Interview second witness family from Bed 12',
        description: 'Obtain written statement regarding duration of manual bag ventilation.',
        status: 'TODO',
        priority: 'URGENT',
        assignedToId: sarah.id,
        dueDate: new Date(Date.now() + 86400000 * 2),
        createdById: sarah.id,
      },
    ],
  });

  const contact1 = await prisma.contact.create({
    data: {
      caseId: case1.id,
      name: 'Dr. C. Prabhakar Rao',
      organization: 'Government General Hospital, Guntur',
      role: 'Medical Superintendent',
      phone: '+91 863 2234001',
      email: 'superintendent.gghguntur@ap.gov.in',
      type: 'AUTHORITY',
    },
  });

  await prisma.responseRequest.create({
    data: {
      caseId: case1.id,
      contactId: contact1.id,
      requestedAt: new Date(Date.now() - 86400000 * 3),
      deadline: new Date(Date.now() - 86400000 * 1), // Overdue!
      method: 'Email & Speed Post',
      status: 'FOLLOW_UP_REQUIRED',
      notes: 'Initial 48h deadline elapsed with no reply from Superintendent office.',
    },
  });

  // 2. Delayed Pension
  const case2 = await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00002',
      workspaceId: workspace.id,
      title: 'Systemic Cancellation of Social Security Pensions for Elderly Widows',
      summary: 'Over 40 elderly widows in Tenali rural mandal had their YSR Pension Kanuka pensions cancelled abruptly due to database mapping of commercial rice mill meters to domestic huts.',
      category: 'Government Services',
      priority: 'HIGH',
      status: 'INVESTIGATION',
      location: 'Tenali, Andhra Pradesh',
      sourceType: 'TEXT',
      sourceText: 'Sarah madam, in Sultanabad village near Tenali, 43 grandmothers have not received widow pension for 5 months. Mandal office claims their electricity consumption is over 300 units per month, but they live in one-room huts with a single light bulb. The electricity meter numbers mapped in the portal belong to local commercial rice mills!',
      aiSummary: 'Welfare pension denial due to faulty database linkage of commercial electric meters to rural beneficiary accounts in Tenali mandal.',
      aiPriorityReason: 'Direct economic deprivation affecting vulnerable senior citizens; clear official data mapping error.',
      verificationStatus: 'SUBSTANTIALLY_VERIFIED',
      publicationStatus: 'DRAFT_READY',
      resolutionStatus: 'OPEN',
      nextAction: 'Cross-examine MPDO resurvey report & record video interview',
      healthStatus: 'ON_TRACK',
      healthReason: 'Electricity ADE confirmed database seeding error in writing',
      assignedToId: arun.id,
      createdById: sarah.id,
    },
  });

  await prisma.source.create({
    data: {
      caseId: case2.id,
      name: 'M. Subhashini',
      phone: '+91 94401 88412',
      email: 'subha.volunteer@gmail.com',
      preferredLanguage: 'Telugu',
      location: 'Sultanabad, Tenali',
      anonymous: false,
      consentToContact: true,
      consentToPublish: true,
    },
  });

  await prisma.claim.createMany({
    data: [
      {
        caseId: case2.id,
        text: '43 women in Sultanabad had pensions discontinued without prior physical notice.',
        status: 'SUPPORTED',
        source: 'Physical verification by field volunteer and village council records',
      },
      {
        caseId: case2.id,
        text: 'Portal records map commercial high-tension meter USC No. 441092 to a domestic hut.',
        status: 'SUPPORTED',
        source: 'Electricity bill copies and village revenue portal printout',
      },
    ],
  });

  await prisma.verificationItem.createMany({
    data: [
      {
        caseId: case2.id,
        statement: 'Cross-verification of 15 beneficiary ration cards and pension IDs',
        status: 'VERIFIED',
        evidenceRequired: 'Ration card photocopies and portal screenshots',
        verifiedById: arun.id,
        verifiedAt: new Date(Date.now() - 86400000),
      },
      {
        caseId: case2.id,
        statement: 'Electricity department confirmation of meter mapping discrepancy',
        status: 'VERIFIED',
        evidenceRequired: 'Written letter from Assistant Divisional Engineer Tenali',
        verifiedById: arun.id,
        verifiedAt: new Date(),
      },
    ],
  });

  await prisma.content.create({
    data: {
      caseId: case2.id,
      type: 'INSTAGRAM_CAROUSEL',
      title: 'How a Broken Algorithm Cut 43 Widows Off Their Only Income in Tenali',
      body: 'SLIDE 1: 43 grandmothers in Sultanabad, Tenali lost their Rs 3,000 monthly widow pensions overnight. The reason given? "Their house uses more electricity than a factory."\n\nSLIDE 2: THE REALITY: Lakshmi amma lives in a single-room mud house with 1 bulb and 1 fan. Her electricity bill is Rs 85/month. But on the government portal, her Aadhaar was linked to a 200 HP commercial rice mill meter 6 kilometers away!',
      status: 'IN_REVIEW',
      createdById: priya.id,
    },
  });

  // 3. Land Encroachment
  const case3 = await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00003',
      workspaceId: workspace.id,
      title: 'Mangalagiri Hill-Foot Commons Encroachment & Fake Pattas',
      summary: 'Small farmers allege 18 acres of grazing commons along Mangalagiri hill foothills are being flattened by private developers using forged pre-1970 title deeds.',
      category: 'Land / Property',
      priority: 'HIGH',
      status: 'VERIFICATION',
      location: 'Mangalagiri, Andhra Pradesh',
      sourceType: 'MANUAL',
      sourceText: 'Farmers cooperative committee from Atmakur village submitted petition regarding survey numbers 241/1 and 241/2.',
      verificationStatus: 'IN_PROGRESS',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: 'Obtain certified 1965 RSR Gazette copy from District Registrar',
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: '2 primary title deed verification items incomplete',
      assignedToId: arun.id,
      createdById: arun.id,
    },
  });

  // 4. School Van Overcrowding
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00004',
      workspaceId: workspace.id,
      title: 'Unregulated Private School Vans Ferrying 26 Children in 8-Seater Vehicles',
      summary: 'Video evidence shows school vans operating on Eluru Road stuffing 24-28 primary school kids with gas cylinders under seats and no emergency exits.',
      category: 'Public Safety',
      priority: 'MEDIUM',
      status: 'CONTENT_READY',
      location: 'Vijayawada, Andhra Pradesh',
      sourceType: 'WHATSAPP',
      sourceText: 'Sharing video taken this morning at Benz Circle. Omni van AP16 TV 8821 had 26 school kids packed inside.',
      verificationStatus: 'SUBSTANTIALLY_VERIFIED',
      publicationStatus: 'DRAFT_READY',
      resolutionStatus: 'OPEN',
      nextAction: 'Review YouTube Short script draft & schedule publish',
      healthStatus: 'ON_TRACK',
      healthReason: 'Footage verified and RTO surprise inspection scheduled',
      assignedToId: priya.id,
      createdById: priya.id,
    },
  });

  // 5. School Infrastructure
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00005',
      workspaceId: workspace.id,
      title: 'ZP High School Classroom Ceiling Collapse Danger & Non-Functional Toilets',
      summary: 'Portions of plaster fell during monsoon rain injuring one class 7 student. School has no working girls toilet, causing 30% dropout among adolescent girls.',
      category: 'Education',
      priority: 'HIGH',
      status: 'TRIAGE',
      location: 'Narasaraopet, Andhra Pradesh',
      sourceType: 'TEXT',
      sourceText: 'ZP High School Rompicherla road. Yesterday ceiling plaster fell on bench in 7th class.',
      verificationStatus: 'NOT_STARTED',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: 'Interview Headmaster & photograph classroom ceiling cracks',
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: 'Physical verification pending field visit',
      assignedToId: sarah.id,
      createdById: sarah.id,
    },
  });

  // 6. Loan App Extortion
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00006',
      workspaceId: workspace.id,
      title: 'Unregistered Chinese Loan App Morphing Photos to Extort College Students',
      summary: 'Victims reporting harassment by apps named "RupeeSpeed" and "QuickKredit" who access contacts and send morphed sexually explicit photos to family and college professors.',
      category: 'Financial',
      priority: 'URGENT',
      status: 'INVESTIGATION',
      location: 'Ongole, Andhra Pradesh',
      sourceType: 'VOICE',
      sourceText: 'I took a small loan of Rs 4,000 for exam fees. Now they demand Rs 9,500 and send morphed photos on WhatsApp.',
      verificationStatus: 'IN_PROGRESS',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: 'File cybercrime complaint with Cyberabad Police & preserve chat logs',
      healthStatus: 'BLOCKED',
      healthReason: 'Victim receiving active intimidation calls; urgent police liaison needed',
      assignedToId: sarah.id,
      createdById: sarah.id,
    },
  });

  // 7. Water Contamination
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00007',
      workspaceId: workspace.id,
      title: 'Sewage Infiltration in Old City Municipal Tap Water Lines',
      summary: 'Residents of Anandapet report blackish foul-smelling tap water resulting in 22 hospitalizations for acute gastroenteritis over the past 10 days.',
      category: 'Infrastructure',
      priority: 'HIGH',
      status: 'FOLLOW_UP',
      location: 'Guntur Old City, Andhra Pradesh',
      sourceType: 'WHATSAPP',
      sourceText: 'Water coming from municipal line smells like gutter since 2 weeks. Today lab test from private clinic confirmed E.coli contamination.',
      verificationStatus: 'SUBSTANTIALLY_VERIFIED',
      publicationStatus: 'PUBLISHED',
      resolutionStatus: 'PARTIALLY_RESOLVED',
      nextAction: 'Follow-up water sample retest report from Municipal Chemist',
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: 'Follow-up due today; 4 hospital discharges pending',
      assignedToId: arun.id,
      createdById: arun.id,
      publishedAt: new Date(Date.now() - 86400000 * 5),
    },
  });

  // 8. Sub-Registrar Office Delay
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00008',
      workspaceId: workspace.id,
      title: 'Unlawful "Token Fee" Extortion for Agricultural Title Registration',
      summary: 'Farmers registering gift deeds subjected to mandatory Rs 15,000 cash demands via unauthorized document writers outside the sub-registrar office.',
      category: 'Consumer Complaint',
      priority: 'MEDIUM',
      status: 'NEW',
      location: 'Vijayawada Rural, Andhra Pradesh',
      sourceType: 'MANUAL',
      sourceText: 'Complaint lodged by 5 smallholder farmers regarding registration delays. Server down excuses used to force speed money.',
      verificationStatus: 'NOT_STARTED',
      publicationStatus: 'NOT_PUBLISHED',
      resolutionStatus: 'OPEN',
      nextAction: 'Assign researcher & confirm complainant willingness to record on video',
      healthStatus: 'NEEDS_ATTENTION',
      healthReason: 'Unassigned new case awaiting intake triage',
      assignedToId: null,
      createdById: sarah.id,
    },
  });

  // 9. Sanitation Workers PPE
  await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00009',
      workspaceId: workspace.id,
      title: 'Tenali Municipal Contract Sanitation Workers Deprived of EPF & Gloves',
      summary: '62 contract sanitation workers handling underground sewer unclogging without rubber boots, masks, or oxygen detectors, with 7 months of unremitted Provident Fund deductions.',
      category: 'Employment',
      priority: 'HIGH',
      status: 'RESOLVED',
      location: 'Tenali, Andhra Pradesh',
      sourceType: 'TEXT',
      sourceText: 'Tenali municipality outsourced sewer workers union submitted PF statements showing employer share deducted but not deposited in EPFO.',
      verificationStatus: 'SUBSTANTIALLY_VERIFIED',
      publicationStatus: 'PUBLISHED',
      resolutionStatus: 'RESOLVED',
      nextAction: 'Archive case dossier and track quarterly EPF deposits',
      healthStatus: 'ON_TRACK',
      healthReason: 'Resolution complete: Contractor deposited 7 months EPF',
      assignedToId: arun.id,
      createdById: arun.id,
      publishedAt: new Date(Date.now() - 86400000 * 14),
      resolvedAt: new Date(Date.now() - 86400000 * 2),
    },
  });

  // 10. Chemical Effluent Canal
  const case10 = await prisma.case.create({
    data: {
      caseNumber: 'CD-2026-00010',
      workspaceId: workspace.id,
      title: 'Midnight Chemical Effluent Discharge into Kommamuru Irrigation Canal',
      summary: 'Industrial textile dyeing units discharging untreated toxic red dye into irrigation canal at 2 AM, destroying paddy crops across 6 downstream villages.',
      category: 'Environment',
      priority: 'URGENT',
      status: 'PUBLISHED',
      location: 'Bapatla / Guntur Border, Andhra Pradesh',
      sourceType: 'VIDEO',
      sourceText: 'Thermal camera and night video footage showing tanker AP07 Y 9921 dumping boiling chemical liquid into irrigation culvert.',
      verificationStatus: 'SUBSTANTIALLY_VERIFIED',
      publicationStatus: 'PUBLISHED',
      resolutionStatus: 'ONGOING',
      nextAction: 'Pollution Control Board response pending — submit RTI appeal',
      healthStatus: 'BLOCKED',
      healthReason: 'Published 3 days ago; APPCB inspection team report not yet furnished',
      assignedToId: sarah.id,
      createdById: sarah.id,
      publishedAt: new Date(Date.now() - 86400000 * 3),
    },
  });

  console.log('Seeding activity logs & notifications...');
  await prisma.activityLog.createMany({
    data: [
      {
        workspaceId: workspace.id,
        caseId: case1.id,
        userId: sarah.id,
        action: 'CASE_CREATED',
        metadata: JSON.stringify({ caseNumber: 'CD-2026-00001', category: 'Healthcare' }),
      },
      {
        workspaceId: workspace.id,
        caseId: case1.id,
        userId: sarah.id,
        action: 'RESPONSE_REQUESTED',
        metadata: JSON.stringify({ authority: 'GGH Superintendent Dr. C. Prabhakar Rao' }),
      },
      {
        workspaceId: workspace.id,
        caseId: case2.id,
        userId: arun.id,
        action: 'VERIFICATION_UPDATED',
        metadata: JSON.stringify({ status: 'SUBSTANTIALLY_VERIFIED', itemsVerified: 2 }),
      },
    ],
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: sarah.id,
        type: 'CASE_ASSIGNED',
        title: 'Urgent Case Assigned',
        message: 'You have been assigned to case CD-2026-00001 (Hospital ICU Failure).',
        read: false,
      },
      {
        userId: sarah.id,
        type: 'DEADLINE_APPROACHING',
        title: 'Response Deadline Overdue',
        message: 'Right of Reply deadline for GGH Superintendent expired 2 days ago.',
        read: false,
      },
      {
        userId: priya.id,
        type: 'CONTENT_READY',
        title: 'Case Ready for Content Studio',
        message: 'CD-2026-00002 (Pension Mappings) has been verified and is ready for draft review.',
        read: false,
      },
    ],
  });

  console.log('Seeding 22 Intelligent Intake Items with attachments & triage data...');

  // 1. WhatsApp Duplicate of CD-2026-00010 (Chemical canal dumping)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'N. Subba Rao (Ayacut Farmer)',
      senderPhone: '+91 94402 88123',
      preferredLanguage: 'Telugu',
      rawText: 'Sarah garu, last night again around 2:30 AM another blue tanker dumped pungent dark chemical water at the same Kommamuru canal culvert near Appikatla. Paddy leaves turned black this morning. Here are the photos of the canal foam and water sample.',
      attachmentCount: 2,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Environment & Land',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Immediate recurring toxic discharge polluting irrigation canal for multiple farming villages.',
      aiSummary: 'Farmer reports another midnight tanker dumping toxic industrial effluent into Kommamuru canal near Appikatla, causing severe paddy crop discoloration.',
      aiLocation: 'Appikatla, Bapatla District, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['N. Subba Rao'], organizations: ['Kommamuru Ayacut Farmers Committee'], dates: ['Yesterday 2:30 AM'] }),
      aiClaims: JSON.stringify(['Dark chemical effluent dumped into irrigation canal culvert at 2:30 AM', 'Paddy leaves discolored and crops damaged', 'Tanker vehicle spotted dumping repeatedly']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      duplicateCandidate: true,
      duplicateCaseId: case10.id,
      attachments: {
        create: [
          {
            fileName: 'Kommamuru_Canal_Foam_Culvert.jpg',
            filePath: 'uploads/janata-desk/intake/Kommamuru_Canal_Foam_Culvert.jpg',
            mimeType: 'image/jpeg',
            size: 2840000,
            type: 'IMAGE',
          },
          {
            fileName: 'Dark_Water_Sample_Bottled.jpg',
            filePath: 'uploads/janata-desk/intake/Dark_Water_Sample_Bottled.jpg',
            mimeType: 'image/jpeg',
            size: 1950000,
            type: 'IMAGE',
          },
        ],
      },
    },
  });

  // 2. Telugu Voice Note Duplicate of CD-2026-00010
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'VOICE',
      senderName: 'K. Rangaiah',
      senderPhone: '+91 98481 67234',
      preferredLanguage: 'Telugu',
      rawText: 'అన్నా నమస్కారం... మేము కొమ్మమూరు కాలువ ఆయకట్టు రైతులం. రాత్రి మళ్లీ కెమికల్ వాటర్ వదిలారు. మా మూడు ఎకరాల పొలంలో వరి ఎండిపోయింది. నీళ్లు కంపు కొడుతున్నాయి. మీ వీడియో చూసి ఫోన్ చేస్తున్నాం. మాకు న్యాయం జరగాలి.',
      transcription: 'అన్నా నమస్కారం... మేము కొమ్మమూరు కాలువ ఆయకట్టు రైతులం. రాత్రి మళ్లీ కెమికల్ వాటర్ వదిలారు. మా మూడు ఎకరాల పొలంలో వరి ఎండిపోయింది. నీళ్లు కంపు కొడుతున్నాయి. మీ వీడియో చూసి ఫోన్ చేస్తున్నాం. మాకు న్యాయం జరగాలి.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Environment & Land',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Direct voice plea from farmer suffering acute crop loss due to recurring toxic canal discharge.',
      aiSummary: 'Farmer from Kommamuru command area reports fresh midnight chemical dumping destroyed 3 acres of paddy; water smells foul; reaching out after watching CaseDesk report.',
      aiLocation: 'Bapatla / Guntur Border, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['K. Rangaiah'], organizations: ['Kommamuru Farmers'], dates: ['Last night'] }),
      aiClaims: JSON.stringify(['Chemical water released into canal overnight', 'Three acres of standing paddy completely dried up', 'Water emits severe toxic odor']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      duplicateCandidate: true,
      duplicateCaseId: case10.id,
      attachments: {
        create: [
          {
            fileName: 'Voice_Note_Rangaiah_Farmer.m4a',
            filePath: 'uploads/janata-desk/intake/Voice_Note_Rangaiah_Farmer.m4a',
            mimeType: 'audio/mp4',
            size: 420000,
            type: 'AUDIO',
          },
        ],
      },
    },
  });

  // 3. Email Lab Water Test Duplicate of CD-2026-00010
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'EMAIL',
      senderName: 'Dr. K. Srinivas (Green Agro Lab)',
      senderEmail: 'srinivas.lab@greenagro.org',
      preferredLanguage: 'English',
      rawText: 'Dear CaseDesk Team, In reference to your investigation on the Kommamuru canal effluent dumping: we tested a water sample collected 500m downstream from Appikatla culvert on Sep 12. COD is 1,840 mg/L (normal < 250) and TDS is 4,200 ppm with high phenolic compounds. Enclosing the signed laboratory test certificate.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Environment & Land',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Scientific chemical laboratory confirmation of acute water contamination matching active investigation.',
      aiSummary: 'Independent agro lab test confirms dangerous COD (1,840 mg/L) and phenolic contamination in Kommamuru canal downstream of culvert.',
      aiLocation: 'Appikatla / Kommamuru Canal',
      aiEntities: JSON.stringify({ people: ['Dr. K. Srinivas'], organizations: ['Green Agro Laboratory'], dates: ['Sep 12, 2026'] }),
      aiClaims: JSON.stringify(['COD measured at 1,840 mg/L versus statutory threshold of 250 mg/L', 'TDS at 4,200 ppm with hazardous phenolic compounds present']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      duplicateCandidate: true,
      duplicateCaseId: case10.id,
      attachments: {
        create: [
          {
            fileName: 'GreenAgro_Water_Analysis_Certificate.pdf',
            filePath: 'uploads/janata-desk/intake/GreenAgro_Water_Analysis_Certificate.pdf',
            mimeType: 'application/pdf',
            size: 780000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 4. WhatsApp Duplicate of CD-2026-00001 (Hospital ventilator blackout)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'P. Murali Krishna',
      senderPhone: '+91 98490 55432',
      preferredLanguage: 'English',
      rawText: 'Madam, my uncle was also admitted in Guntur GGH 3rd floor ICU on the same night (Sep 12) when the power died. His pulse rate dropped below 45 while nurses were pumping manual AMBU bag. The generator failed for over 40 minutes. We have the hospital admission slip and ICU monitor photos.',
      attachmentCount: 2,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Healthcare',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Life-threatening patient incident matching open ventilator failure investigation.',
      aiSummary: 'Corroborating patient attendant statement confirms Guntur GGH ICU power blackout on Sep 12 and 40-minute generator failure.',
      aiLocation: 'Guntur GGH, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['P. Murali Krishna'], organizations: ['Guntur GGH'], dates: ['Sep 12, 2026'] }),
      aiClaims: JSON.stringify(['ICU patient pulse dropped below 45 during generator failure', 'Emergency manual ventilation required for 40+ minutes', 'Patient admission slip available']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      duplicateCandidate: true,
      duplicateCaseId: case1.id,
      attachments: {
        create: [
          {
            fileName: 'Uncle_Bed9_Admission_Slip.pdf',
            filePath: 'uploads/janata-desk/intake/Uncle_Bed9_Admission_Slip.pdf',
            mimeType: 'application/pdf',
            size: 340000,
            type: 'DOCUMENT',
          },
          {
            fileName: 'ICU_Monitor_Alarm.jpg',
            filePath: 'uploads/janata-desk/intake/ICU_Monitor_Alarm.jpg',
            mimeType: 'image/jpeg',
            size: 1420000,
            type: 'IMAGE',
          },
        ],
      },
    },
  });

  // 5. Whistleblower Nurse (Merged into Case CD-2026-00001)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WEB_FORM',
      senderName: 'Confidential Staff Nurse',
      senderEmail: 'secure_nurse_ggh@protonmail.com',
      preferredLanguage: 'English',
      rawText: 'I am a staff nurse at GGH Guntur ICU. The generator maintenance logbook was forged yesterday morning on the orders of the RMO to show diesel was refilled on Sep 10, but the tank was actually dry. Staff were ordered to sign false statements. Please keep my identity strictly confidential.',
      attachmentCount: 0,
      status: 'MERGED',
      duplicateCaseId: case1.id,
      aiCategory: 'Healthcare',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Whistleblower allegation of forged government hospital safety records following ICU crisis.',
      aiSummary: 'GGH Guntur ICU nurse alleges generator diesel log was forged post-incident to conceal negligence.',
      aiLocation: 'Guntur GGH, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Resident Medical Officer (RMO)'], organizations: ['Guntur Government General Hospital'], dates: ['Sep 10, 2026', 'Yesterday'] }),
      aiClaims: JSON.stringify(['Generator fuel log forged post-incident', 'Diesel tank was completely dry during Sep 12 outage', 'Hospital nursing staff pressured to sign false statements']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 3600000 * 20),
    },
  });

  // 6. Voice Note in Telugu: Ration shop grain diversion in Anantapur (PDS scam)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'VOICE',
      senderName: 'Mallikarjuna (PDS Beneficiary)',
      senderPhone: '+91 94911 33210',
      preferredLanguage: 'Telugu',
      rawText: 'మేడం నమస్తే, కళ్యాణదుర్గం మండలం రేషన్ షాపు నంబర్ 18 లో ప్రతినెలా 5 కిలోల బియ్యానికి బదులు 3 కిలోలే ఇస్తున్నారు. బయోమెట్రిక్ వేయించుకుని వేలిముద్ర పడలేదని మోసం చేస్తున్నారు. మిగిలిన బియ్యం రాత్రి పూట ప్రైవేట్ రైస్ మిల్లులకు లారీల్లో తరలిస్తున్నారు. వీడీయో తీస్తే కార్డు రద్దు చేస్తామని డీలర్ బెదిరిస్తున్నాడు.',
      transcription: 'మేడం నమస్తే, కళ్యాణదుర్గం మండలం రేషన్ షాపు నంబర్ 18 లో ప్రతినెలా 5 కిలోల బియ్యానికి బదులు 3 కిలోలే ఇస్తున్నారు. బయోమెట్రిక్ వేయించుకుని వేలిముద్ర పడలేదని మోసం చేస్తున్నారు. మిగిలిన బియ్యం రాత్రి పూట ప్రైవేట్ రైస్ మిల్లులకు లారీల్లో తరలిస్తున్నారు. వీడీయో తీస్తే కార్డు రద్దు చేస్తామని డీలర్ బెదిరిస్తున్నాడు.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Corruption & Bribery',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Systemic diversion of essential subsidized food grains impacting poor families with biometric fraud.',
      aiSummary: 'PDS dealer at Shop #18 in Kalyandurg skimming 2kg rice per card using false biometric failures and trucking diverted grain to private mills.',
      aiLocation: 'Kalyandurg Mandal, Anantapur District, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Mallikarjuna', 'Ration Dealer #18'], organizations: ['Civil Supplies Department', 'PDS Kalyandurg'], dates: ['Monthly / Ongoing'] }),
      aiClaims: JSON.stringify(['Beneficiaries given 3kg instead of statutory 5kg rice entitlement', 'Biometric authentication errors fabricated to justify short delivery', 'Diverted government rice loaded onto trucks for private mills at night', 'Threats issued to cancel ration cards of complaining citizens']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      attachments: {
        create: [
          {
            fileName: 'Audio_Kalyandurg_PDS_Complaint.m4a',
            filePath: 'uploads/janata-desk/intake/Audio_Kalyandurg_PDS_Complaint.m4a',
            mimeType: 'audio/mp4',
            size: 512000,
            type: 'AUDIO',
          },
        ],
      },
    },
  });

  // 7. Voice Note in Telugu: Illegal sand mining on Tungabhadra riverbed with GPS
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'VOICE',
      senderName: 'Veeresh Gowd',
      senderPhone: '+91 97011 44521',
      preferredLanguage: 'Telugu',
      rawText: 'అన్నా, తుంగభద్ర నది ఒడ్డున మంత్రాలయం దగ్గర (GPS: 15.9382 N, 77.4218 E) రాత్రి 10 గంటల నుంచి ఉదయం 4 గంటల దాకా 40 టిప్పర్లతో అక్రమంగా ఇసుక తోడేస్తున్నారు. నది ఒడ్డు తవ్వడం వల్ల మా పంట భూములకు కోత పడుతోంది. రెవెన్యూ అధికారులకు ఫిర్యాదు చేసినా ఎవరూ పట్టించుకోవడం లేదు.',
      transcription: 'అన్నా, తుంగభద్ర నది ఒడ్డున మంత్రాలయం దగ్గర (GPS: 15.9382 N, 77.4218 E) రాత్రి 10 గంటల నుంచి ఉదయం 4 గంటల దాకా 40 టిప్పర్లతో అక్రమంగా ఇసుక తోడేస్తున్నారు. నది ఒడ్డు తవ్వడం వల్ల మా పంట భూములకు కోత పడుతోంది. రెవెన్యూ అధికారులకు ఫిర్యాదు చేసినా ఎవరూ పట్టించుకోవడం లేదు.',
      attachmentCount: 2,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Environment & Land',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Extensive mechanized sand excavation with pinpoint GPS coordinates causing riverbank destruction and farmland erosion.',
      aiSummary: 'Organized mechanized sand theft on Tungabhadra riverbed near Mantralayam using 40 tippers nightly, causing severe bank erosion to agricultural land.',
      aiLocation: 'Mantralayam, Kurnool District (15.9382° N, 77.4218° E)',
      aiEntities: JSON.stringify({ people: ['Veeresh Gowd'], organizations: ['Mines & Geology Dept', 'Mantralayam Revenue Office'], dates: ['Nightly 10 PM - 4 AM'] }),
      aiClaims: JSON.stringify(['Over 40 tipper trucks excavate sand nightly without transit permits', 'Excavation destabilizing riverbank causing farmland collapse', 'Local revenue authorities failed to take enforcement action despite formal complaint']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      attachments: {
        create: [
          {
            fileName: 'Tungabhadra_Audio_Dispatch.m4a',
            filePath: 'uploads/janata-desk/intake/Tungabhadra_Audio_Dispatch.m4a',
            mimeType: 'audio/mp4',
            size: 480000,
            type: 'AUDIO',
          },
          {
            fileName: 'GPS_Location_Screenshot.png',
            filePath: 'uploads/janata-desk/intake/GPS_Location_Screenshot.png',
            mimeType: 'image/png',
            size: 890000,
            type: 'IMAGE',
          },
        ],
      },
    },
  });

  // 8. Voice Note in Telugu: Anganwadi building ceiling collapse in Guntur
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'VOICE',
      senderName: 'Lakshmi Kumari (Anganwadi Worker)',
      senderPhone: '+91 91212 77890',
      preferredLanguage: 'Telugu',
      rawText: 'అక్కా, మా నరసరావుపేట అంగన్‌వాడీ సెంటర్ 4 భవనం పైకప్పు పెచ్చులు ఊడిపడుతున్నాయి. మొన్న వర్షానికి సిమెంట్ పెళ్ల పడి ఒక చిన్న పాప తలకు గాయమైంది. 28 మంది పసిపిల్లలు ఉన్నారు. అధికారులకు మూడుసార్లు అర్జీ ఇచ్చినా బడ్జెట్ లేదంటున్నారు. దయచేసి వీడియో చేయండి.',
      transcription: 'అక్కా, మా నరసరావుపేట అంగన్‌వాడీ సెంటర్ 4 భవనం పైకప్పు పెచ్చులు ఊడిపడుతున్నాయి. మొన్న వర్షానికి సిమెంట్ పెళ్ల పడి ఒక చిన్న పాప తలకు గాయమైంది. 28 మంది పసిపిల్లలు ఉన్నారు. అధికారులకు మూడుసార్లు అర్జీ ఇచ్చినా బడ్జెట్ లేదంటున్నారు. దయచేసి వీడియో చేయండి.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Education',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Immediate physical danger to 28 toddlers from crumbling municipal building with prior child injury.',
      aiSummary: 'Dilapidated Anganwadi Center 4 building ceiling collapsing in Narasaraopet; cement chunk injured child during rain; 28 toddlers at severe risk.',
      aiLocation: 'Narasaraopet, Palnadu District, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Lakshmi Kumari'], organizations: ['Women Development & Child Welfare Department', 'Anganwadi Center 4'], dates: ['Recent rains'] }),
      aiClaims: JSON.stringify(['Concrete plaster falling from ceiling of Anganwadi Center 4', 'A toddler sustained head injury during recent rainfall', 'Three written representations ignored by civic authorities citing lack of funds']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      attachments: {
        create: [
          {
            fileName: 'Anganwadi_Ceiling_Damage.jpg',
            filePath: 'uploads/janata-desk/intake/Anganwadi_Ceiling_Damage.jpg',
            mimeType: 'image/jpeg',
            size: 1650000,
            type: 'IMAGE',
          },
        ],
      },
    },
  });

  // 9. Sensitive Data: Medical records with patient name and diagnosis
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'Suresh Babu',
      senderPhone: '+91 98850 12345',
      preferredLanguage: 'English',
      rawText: 'Sir, private diagnostic center in Vijayawada gave fake cancer biopsy reports. My wife Anitha (Patient ID: DIAG-9921, DOB: 14/05/1988) was wrongly diagnosed with Stage-2 Cervical Carcinoma and hospital collected Rs 2.8 lakhs for unnecessary chemotherapy before second opinion proved it was benign. Enclosing blood report, PET scan, and biopsy summary.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Healthcare',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Grave medical malpractice allegation involving falsified cancer diagnosis and unnecessary invasive procedures.',
      aiSummary: 'Private diagnostic center allegedly issued false Stage-2 cervical cancer biopsy leading to Rs 2.8L unnecessary chemotherapy.',
      aiLocation: 'Vijayawada, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Suresh Babu', 'Anitha (Patient)'], organizations: ['Apex Diagnostic Centre Vijayawada'], dates: ['May 2026 - Present'] }),
      aiClaims: JSON.stringify(['False oncology biopsy issued by private lab', 'Patient subjected to unnecessary chemotherapy costing Rs 2.8 lakhs', 'Independent pathology lab confirmed tissue was completely benign']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify(['Medical Records', 'Patient Identifying Information', 'Phone Numbers']),
      attachments: {
        create: [
          {
            fileName: 'Anitha_Biopsy_Report_Redacted.pdf',
            filePath: 'uploads/janata-desk/intake/Anitha_Biopsy_Report_Redacted.pdf',
            mimeType: 'application/pdf',
            size: 1120000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 10. Sensitive Data: Aadhaar numbers and bank accounts of scam victims
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'EMAIL',
      senderName: 'Ch. Ram Mohan',
      senderEmail: 'rammohan.exservice@gmail.com',
      preferredLanguage: 'English',
      rawText: 'Sir, bogus PM-Kisan agent in Kadapa collected biometric and Aadhaar cards of 38 widows. Examples: Aadhaar 4492-8812-3341 (K. Subbamma, SBI A/c 30992144812, IFSC SBIN0001822) and Aadhaar 7712-4019-8823 (G. Narayanamma, Andhra Bank A/c 1102991823). The agent routed government DBT subsidies of Rs 6,000 into fraudulent mule accounts.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Corruption & Bribery',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Systematic siphoning of government welfare subsidies targeting vulnerable widows with Aadhaar/bank data theft.',
      aiSummary: 'Fraudulent welfare middleman in Kadapa exploited Aadhaar and bank details of 38 widows to divert PM-Kisan DBT installments.',
      aiLocation: 'Kadapa, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Ch. Ram Mohan', 'K. Subbamma', 'G. Narayanamma'], organizations: ['PM-Kisan Scheme', 'SBI', 'Union Bank of India'], dates: ['2025 - 2026'] }),
      aiClaims: JSON.stringify(['Biometric authentication used to hijack welfare subsidies', '38 rural widows deprived of statutory DBT payments', 'Mule bank accounts opened without beneficiary knowledge']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify(['Aadhaar Numbers', 'Bank Account Numbers', 'IFSC Codes', 'Citizen Names']),
      attachments: {
        create: [
          {
            fileName: 'Widow_Aadhaar_Bank_Roster.xlsx',
            filePath: 'uploads/janata-desk/intake/Widow_Aadhaar_Bank_Roster.xlsx',
            mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            size: 450000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 11. Sensitive Data: Minor name and school details
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'Concerned Parent',
      senderPhone: '+91 94412 66789',
      preferredLanguage: 'English',
      rawText: 'A 13-year-old 8th standard student Master Rahul Verma (DOB: 12/08/2012, Roll #18, St. Jude High School, Eluru) was beaten brutally with an electric wire by physical director for coming late. Child has multiple hematomas and is admitted in civil hospital.',
      attachmentCount: 1,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Education',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Severe corporal punishment of a minor resulting in hospitalization and serious physical injury.',
      aiSummary: '13-year-old student hospitalized in Eluru after brutal corporal punishment with wire by school sports director.',
      aiLocation: 'Eluru, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Master Rahul Verma (Minor)', 'Physical Director'], organizations: ['St. Jude High School Eluru', 'Eluru Civil Hospital'], dates: ['Today'] }),
      aiClaims: JSON.stringify(['Unlawful corporal punishment with an electric wire', 'Severe multiple hematomas requiring hospital admission', 'School administration attempting to suppress police complaint']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify(["Minor's Personal Information", 'Medical Records', 'School Enrollment Data']),
      attachments: {
        create: [
          {
            fileName: 'Hospital_Injury_MLC_Report.jpg',
            filePath: 'uploads/janata-desk/intake/Hospital_Injury_MLC_Report.jpg',
            mimeType: 'image/jpeg',
            size: 1380000,
            type: 'IMAGE',
          },
        ],
      },
    },
  });

  // 12. Spam: Loan offer (Archived)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'EMAIL',
      senderName: 'Quick Instant Cash',
      senderEmail: 'instant.cash247@fastcredits.xyz',
      preferredLanguage: 'English',
      rawText: 'Dear Sir/Madam, Get instant paperless personal loan up to Rs 15,00,000 within 15 minutes! No CIBIL score required. Low interest rates from 5.99%. Click link to download APK and claim pre-approved loan.',
      attachmentCount: 0,
      status: 'ARCHIVED',
      archiveReason: 'SPAM',
      aiCategory: 'Other',
      aiPriority: 'LOW',
      aiPriorityReason: 'Automated phishing / illegal lending app promotion.',
      aiSummary: 'Instant paperless personal loan spam promotional advertisement.',
      aiLocation: 'Unknown',
      aiEntities: JSON.stringify({ people: [], organizations: ['FastCredits Loan'], dates: [] }),
      aiClaims: JSON.stringify([]),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  // 13. Not Relevant: Generic fan mail (Archived)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'INSTAGRAM',
      senderName: 'vamsi_krishna_vizag',
      senderPhone: '@vamsi_krishna_vizag',
      preferredLanguage: 'English',
      rawText: 'Love your videos anna keep it up! Best investigative journalism in AP. Big fan of your hospital ground reports.',
      attachmentCount: 0,
      status: 'ARCHIVED',
      archiveReason: 'NOT_RELEVANT',
      aiCategory: 'Other',
      aiPriority: 'LOW',
      aiPriorityReason: 'Viewer appreciation message; no civic issue or investigation requested.',
      aiSummary: 'Viewer fan appreciation message praising previous investigative reports.',
      aiLocation: 'Visakhapatnam',
      aiEntities: JSON.stringify({ people: ['Vamsi Krishna'], organizations: [], dates: [] }),
      aiClaims: JSON.stringify([]),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: arun.id,
      reviewedAt: new Date(Date.now() - 3600000 * 8),
    },
  });

  // 14. Incomplete: Road is very bad (Needs Information triage)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'Citizen Driver',
      senderPhone: '+91 80081 22910',
      preferredLanguage: 'English',
      rawText: 'Road is very bad in our village please help. Vehicles are getting punctured every day and ambulance refused to come.',
      attachmentCount: 0,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Civic Infrastructure',
      aiPriority: 'LOW',
      aiPriorityReason: 'Unspecified location and missing factual corroboration for road infrastructure defect.',
      aiSummary: 'Complainant reports severely damaged village road causing vehicle breakdowns and ambulance refusal without naming village or district.',
      aiLocation: 'Unspecified',
      aiEntities: JSON.stringify({ people: [], organizations: [], dates: [] }),
      aiClaims: JSON.stringify(['Village road heavily damaged', 'Emergency vehicles refusing entry']),
      aiMissingInformation: JSON.stringify(['Exact village, mandal, and district names', 'Specific road stretch or highway connection', 'Photographs or video of road potholes', 'Previous grievance petition numbers']),
      sensitiveInfoDetected: JSON.stringify([]),
    },
  });

  // 15. Incomplete: Officer took bribe (Archived as Insufficient Information)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WEB_FORM',
      senderName: 'Anonymous Citizen',
      preferredLanguage: 'English',
      rawText: 'Officer took bribe from me yesterday. He asked 25,000 rupees to clear my file. Please expose him.',
      attachmentCount: 0,
      status: 'ARCHIVED',
      archiveReason: 'INSUFFICIENT_INFORMATION',
      aiCategory: 'Corruption & Bribery',
      aiPriority: 'LOW',
      aiPriorityReason: 'Corruption allegation without named official, department, office location, or transactional proof.',
      aiSummary: 'Citizen alleges public official demanded Rs 25,000 bribe to process pending application, missing specific identifying details.',
      aiLocation: 'Unspecified',
      aiEntities: JSON.stringify({ people: [], organizations: [], dates: ['Yesterday'] }),
      aiClaims: JSON.stringify(['Government official demanded Rs 25,000 bribe to release file']),
      aiMissingInformation: JSON.stringify(['Department name and office location', 'Designation and name of the official involved', 'Application or file reference number', 'Proof of payment, receipt, audio recording, or witness detail']),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 3600000 * 4),
    },
  });

  // 16. Incomplete: Water is dirty (Merged into Case CD-2026-00010)
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'Appikatla Villager',
      senderPhone: '+91 79891 00213',
      preferredLanguage: 'English',
      rawText: 'Water is dark red and dirty here coming with bad chemical odor near canal bund. Crops turning yellow.',
      attachmentCount: 0,
      status: 'MERGED',
      duplicateCaseId: case10.id,
      aiCategory: 'Environment & Land',
      aiPriority: 'MEDIUM',
      aiPriorityReason: 'Water contamination report matching Kommamuru industrial discharge.',
      aiSummary: 'Contaminated reddish canal water causing crop yellowing near canal bund.',
      aiLocation: 'Appikatla, Bapatla District',
      aiEntities: JSON.stringify({ people: [], organizations: [], dates: ['Ongoing'] }),
      aiClaims: JSON.stringify(['Canal water colored dark red with strong chemical smell', 'Paddy crops turning yellow']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: arun.id,
      reviewedAt: new Date(Date.now() - 3600000 * 18),
    },
  });

  // 17. High Priority Ready to Convert: Municipal tender fraud in Vijayawada
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'EMAIL',
      senderName: 'Citizen RTI Forum Vijayawada',
      senderEmail: 'rti.vja.forum@gmail.com',
      preferredLanguage: 'English',
      rawText: 'We have obtained e-procurement audit logs exposing bid rigging in Vijayawada Municipal Corporation smart street-lighting tender (Tender Ref: VMC/ELEC/2025/112, Value: Rs 14.8 Crores). All three bidding firms submitted bids from the exact same broadband IP address within 8 minutes of each other. The winning contractor is the brother-in-law of the Superintending Engineer.',
      attachmentCount: 2,
      status: 'NEEDS_REVIEW',
      aiCategory: 'Corruption & Bribery',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Irrefutable digital paper trail of collusive municipal bidding worth Rs 14.8 Crores involving familial conflict of interest.',
      aiSummary: 'RTI forum exposes Rs 14.8Cr Vijayawada Municipal street-lighting tender rigging with e-procurement server IP logs confirming collusive cartel.',
      aiLocation: 'Vijayawada, NTR District, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['Superintending Engineer', 'Winning Contractor'], organizations: ['Vijayawada Municipal Corporation', 'AP e-Procurement Portal'], dates: ['2025 - 2026'] }),
      aiClaims: JSON.stringify(['Three competing bids submitted from single IP address within 8 minutes', 'Tender worth Rs 14.8 Crores awarded to immediate relative of sanctioning engineer', 'AP e-Procurement server audit trail confirms collusive bidding cartel']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      attachments: {
        create: [
          {
            fileName: 'VMC_E-Procurement_Audit_Trail_IP_Logs.pdf',
            filePath: 'uploads/janata-desk/intake/VMC_E-Procurement_Audit_Trail_IP_Logs.pdf',
            mimeType: 'application/pdf',
            size: 2100000,
            type: 'DOCUMENT',
          },
          {
            fileName: 'SE_Family_Tree_Affidavit.pdf',
            filePath: 'uploads/janata-desk/intake/SE_Family_Tree_Affidavit.pdf',
            mimeType: 'application/pdf',
            size: 890000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 18. Converted to Case: Initial Whistleblowing Report for Case CD-2026-00001
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'K. Venkatesh (Patient Attendant)',
      senderPhone: '+91 98492 11400',
      preferredLanguage: 'Telugu',
      rawText: 'Namaste Sarah garu, yesterday night at Guntur GGH 3rd floor ICU, power went out at 11:20 PM. Back-up generator did not start for 40 mins. Nurses were using manual AMBU bags. Two patients had severe saturation drops. Hospital staff warned us not to record videos or call anyone. Please look into this.',
      attachmentCount: 1,
      status: 'CASE_CREATED',
      createdCaseId: case1.id,
      aiCategory: 'Healthcare',
      aiPriority: 'URGENT',
      aiPriorityReason: 'Direct emergency whistleblowing report regarding hospital ICU power and generator failure.',
      aiSummary: 'Hospital attendant reports 40-minute generator failure in GGH Guntur ICU leading to oxygen desaturation in critical patients.',
      aiLocation: 'Guntur, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['K. Venkatesh'], organizations: ['Guntur Government General Hospital'], dates: ['Sep 12, 2026'] }),
      aiClaims: JSON.stringify(['Power failure in ICU at 11:20 PM', 'Backup generator failed to start for 40 minutes', 'Nurses used manual resuscitation bags']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 86400000 * 3),
      attachments: {
        create: [
          {
            fileName: 'ICU_Oxygen_Failure_Notice.pdf',
            filePath: 'uploads/janata-desk/intake/ICU_Oxygen_Failure_Notice.pdf',
            mimeType: 'application/pdf',
            size: 512000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 19. Converted to Case: Initial report for Case CD-2026-00002
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'M. Subhashini (Volunteer)',
      senderPhone: '+91 94401 88412',
      preferredLanguage: 'Telugu',
      rawText: 'Sarah madam, in Sultanabad village near Tenali, 43 grandmothers have not received widow pension for 5 months. Mandal office claims their electricity consumption is over 300 units per month, but they live in one-room huts with a single light bulb. The electricity meter numbers mapped in the portal belong to local commercial rice mills!',
      attachmentCount: 1,
      status: 'CASE_CREATED',
      createdCaseId: case2.id,
      aiCategory: 'Government Services',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Welfare pension denial due to faulty database linkage affecting 43 elderly widows.',
      aiSummary: '43 elderly widows deprived of pensions due to database mapping of commercial rice mill meters to their huts.',
      aiLocation: 'Tenali, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: ['M. Subhashini'], organizations: ['Pensions Department'], dates: ['5 months ago'] }),
      aiClaims: JSON.stringify(['43 widows lost pension due to erroneous electricity consumption data']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: arun.id,
      reviewedAt: new Date(Date.now() - 86400000 * 2),
      attachments: {
        create: [
          {
            fileName: 'Tenali_Widows_List.pdf',
            filePath: 'uploads/janata-desk/intake/Tenali_Widows_List.pdf',
            mimeType: 'application/pdf',
            size: 670000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 20. Converted to Case: Initial report for Case CD-2026-00003
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'MANUAL',
      senderName: 'Atmakur Farmers Cooperative',
      preferredLanguage: 'Telugu',
      rawText: 'Small farmers allege 18 acres of grazing commons along Mangalagiri hill foothills are being flattened by private developers using forged pre-1970 title deeds.',
      attachmentCount: 1,
      status: 'CASE_CREATED',
      createdCaseId: case3.id,
      aiCategory: 'Land / Property',
      aiPriority: 'HIGH',
      aiPriorityReason: 'Grazing commons encroachment using forged land records.',
      aiSummary: '18 acres of common grazing land in Mangalagiri encroached with alleged forged pre-1970 title deeds.',
      aiLocation: 'Mangalagiri, Andhra Pradesh',
      aiEntities: JSON.stringify({ people: [], organizations: ['Atmakur Farmers Cooperative'], dates: ['1970'] }),
      aiClaims: JSON.stringify(['18 acres of commons grabbed using forged deeds']),
      aiMissingInformation: JSON.stringify([]),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 86400000 * 4),
      attachments: {
        create: [
          {
            fileName: 'Mangalagiri_Deed_Copy.pdf',
            filePath: 'uploads/janata-desk/intake/Mangalagiri_Deed_Copy.pdf',
            mimeType: 'application/pdf',
            size: 1400000,
            type: 'DOCUMENT',
          },
        ],
      },
    },
  });

  // 21. Needs Information: Streetlights not working on canal bund
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WHATSAPP',
      senderName: 'P. Venkat',
      senderPhone: '+91 89781 44556',
      preferredLanguage: 'English',
      rawText: 'Streetlights not working on canal bund road for 2 months, several women felt unsafe walking after 8 PM.',
      attachmentCount: 0,
      status: 'NEEDS_INFORMATION',
      aiCategory: 'Civic Infrastructure',
      aiPriority: 'LOW',
      aiPriorityReason: 'Safety risk due to non-functioning lighting, pending specific road coordinates.',
      aiSummary: 'Non-functional streetlights on canal bund road for 2 months causing nighttime safety concerns.',
      aiLocation: 'Canal Road',
      aiEntities: JSON.stringify({ people: ['P. Venkat'], organizations: [], dates: ['Last 2 months'] }),
      aiClaims: JSON.stringify(['Streetlights extinguished for 2 months along canal road']),
      aiMissingInformation: JSON.stringify(['Specific stretch of canal road and nearest landmark', 'Municipal ward number', 'Has a complaint been registered with electricity board']),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: arun.id,
      reviewedAt: new Date(Date.now() - 3600000 * 6),
    },
  });

  // 22. Needs Information: Veterinary clinic unstaffed
  await prisma.intakeItem.create({
    data: {
      workspaceId: workspace.id,
      sourceType: 'WEB_FORM',
      senderName: 'T. Anji Reddy',
      senderPhone: '+91 91002 33445',
      preferredLanguage: 'English',
      rawText: 'Local veterinary hospital has no doctor for 6 months. Cattle are dying from unseasonal foot-and-mouth infection.',
      attachmentCount: 0,
      status: 'NEEDS_INFORMATION',
      aiCategory: 'Agriculture',
      aiPriority: 'MEDIUM',
      aiPriorityReason: 'Livestock epidemic risk due to long-term veterinary officer absence, awaiting village location.',
      aiSummary: 'Veterinary clinic unstaffed for 6 months as cattle contract foot-and-mouth infection; village location needed.',
      aiLocation: 'Unspecified Mandal',
      aiEntities: JSON.stringify({ people: ['T. Anji Reddy'], organizations: ['Animal Husbandry Department'], dates: ['Last 6 months'] }),
      aiClaims: JSON.stringify(['Veterinary dispensary unmanned for six consecutive months', 'Cattle dying from preventable viral infections']),
      aiMissingInformation: JSON.stringify(['Village, Mandal, and District names', 'Estimated number of affected cattle and farmers', 'Dispenser or livestock assistant contact']),
      sensitiveInfoDetected: JSON.stringify([]),
      reviewedById: sarah.id,
      reviewedAt: new Date(Date.now() - 3600000 * 10),
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
