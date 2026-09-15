import prisma from '../db/prisma';

export interface GlobalSearchResult {
  type: 'case' | 'source' | 'contact' | 'evidence';
  id: string;
  caseId: string;
  title: string;
  subtitle: string;
  badge?: string;
  href: string;
}

export async function globalSearch(query: string, workspaceId?: string): Promise<GlobalSearchResult[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const q = query.trim();
  const results: GlobalSearchResult[] = [];

  // Search Cases
  const cases = await prisma.case.findMany({
    where: {
      workspaceId,
      OR: [
        { caseNumber: { contains: q } },
        { title: { contains: q } },
        { summary: { contains: q } },
        { location: { contains: q } },
        { category: { contains: q } },
      ],
    },
    take: 6,
    select: {
      id: true,
      caseNumber: true,
      title: true,
      category: true,
      location: true,
      status: true,
      priority: true,
    },
  });

  cases.forEach((c) => {
    results.push({
      type: 'case',
      id: c.id,
      caseId: c.id,
      title: `${c.caseNumber} — ${c.title}`,
      subtitle: `${c.category} • ${c.location}`,
      badge: c.status,
      href: `/app/cases/${c.id}`,
    });
  });

  // Search Sources
  const sources = await prisma.source.findMany({
    where: {
      case: workspaceId ? { workspaceId } : undefined,
      OR: [
        { name: { contains: q } },
        { phone: { contains: q } },
        { email: { contains: q } },
        { location: { contains: q } },
      ],
    },
    take: 4,
    include: {
      case: {
        select: { id: true, caseNumber: true, title: true },
      },
    },
  });

  sources.forEach((s) => {
    results.push({
      type: 'source',
      id: s.id,
      caseId: s.caseId,
      title: s.name,
      subtitle: `Source for ${s.case.caseNumber}: ${s.case.title}`,
      badge: s.anonymous ? 'ANONYMOUS' : 'SOURCE',
      href: `/app/cases/${s.caseId}`,
    });
  });

  // Search Contacts
  const contacts = await prisma.contact.findMany({
    where: {
      case: workspaceId ? { workspaceId } : undefined,
      OR: [
        { name: { contains: q } },
        { organization: { contains: q } },
        { role: { contains: q } },
      ],
    },
    take: 4,
    include: {
      case: {
        select: { id: true, caseNumber: true, title: true },
      },
    },
  });

  contacts.forEach((ct) => {
    results.push({
      type: 'contact',
      id: ct.id,
      caseId: ct.caseId,
      title: ct.name,
      subtitle: `${ct.role || ct.type} at ${ct.organization || 'Independent'} (Case ${ct.case.caseNumber})`,
      badge: ct.type,
      href: `/app/cases/${ct.caseId}?tab=contacts`,
    });
  });

  // Search Evidence
  const evidence = await prisma.evidence.findMany({
    where: {
      case: workspaceId ? { workspaceId } : undefined,
      OR: [
        { name: { contains: q } },
        { description: { contains: q } },
      ],
    },
    take: 4,
    include: {
      case: {
        select: { id: true, caseNumber: true },
      },
    },
  });

  evidence.forEach((e) => {
    results.push({
      type: 'evidence',
      id: e.id,
      caseId: e.caseId,
      title: e.name,
      subtitle: `File in ${e.case.caseNumber} • ${(e.size / 1024).toFixed(0)} KB`,
      badge: e.type,
      href: `/app/cases/${e.caseId}?tab=evidence`,
    });
  });

  return results;
}
