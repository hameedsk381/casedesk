import { NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { getCorsHeaders } from '@/lib/api/cors';
import { getClientIp, rateLimit } from '@/lib/rateLimit';

/**
 * Public accountability feed. Exposes only cases that were published AND whose
 * citizen consented to publication. No names, contact details, free-text
 * summaries or individual officials' names are ever returned — authorities are
 * identified by organisation/department only.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
const MAX_CASES = 500;

function normaliseWard(raw: string | null | undefined): string | null {
  const value = (raw || '').trim().replace(/^ward[ .:-]*/i, '').toUpperCase();
  return value ? value.slice(0, 50) : null;
}

function escalationLevel(daysWaiting: number): 0 | 1 | 2 | 3 {
  if (daysWaiting >= 30) return 3;
  if (daysWaiting >= 14) return 2;
  if (daysWaiting >= 7) return 1;
  return 0;
}

export async function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  const corsHeaders = getCorsHeaders(request);
  try {
    const rl = rateLimit(`public-feed:${getClientIp(request)}`, 60, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again shortly.' },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(rl.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(request.url);
    const wardFilter = normaliseWard(searchParams.get('ward'));
    const categoryFilter = searchParams.get('category')?.slice(0, 100) || null;

    const cases = await prisma.case.findMany({
      where: {
        publicationStatus: 'PUBLISHED',
        createdFromIntakes: { some: { consentToPublish: 'YES' } },
        ...(categoryFilter ? { category: categoryFilter } : {}),
      },
      orderBy: { publishedAt: 'desc' },
      take: MAX_CASES,
      select: {
        id: true,
        caseNumber: true,
        title: true,
        category: true,
        status: true,
        resolutionStatus: true,
        publishedAt: true,
        createdAt: true,
        resolvedAt: true,
        createdFromIntakes: {
          where: { consentToPublish: 'YES' },
          select: { ward: true },
          take: 1,
        },
        responseRequests: {
          where: { status: { not: 'NOT_REQUESTED' } },
          orderBy: { requestedAt: 'asc' },
          select: {
            id: true,
            status: true,
            requestedAt: true,
            deadline: true,
            responseReceivedAt: true,
            contact: { select: { organization: true, role: true } },
          },
        },
      },
    });

    const now = Date.now();

    const items = cases
      .map((c) => {
        const ward = normaliseWard(c.createdFromIntakes[0]?.ward);
        const resolved = c.resolutionStatus === 'RESOLVED' || c.status === 'RESOLVED' || !!c.resolvedAt;
        const responses = c.responseRequests.map((r) => {
          const answered = r.status === 'RECEIVED' || !!r.responseReceivedAt;
          const end = answered && r.responseReceivedAt ? r.responseReceivedAt.getTime() : now;
          const daysWaiting = Math.max(0, Math.floor((end - r.requestedAt.getTime()) / DAY_MS));
          const overdue = !answered && !!r.deadline && r.deadline.getTime() < now;
          return {
            authority: r.contact.organization || r.contact.role || 'Concerned department',
            requestedAt: r.requestedAt,
            deadline: r.deadline,
            answered,
            daysWaiting,
            overdue,
            escalationLevel: answered ? 0 : escalationLevel(daysWaiting),
          };
        });
        return {
          caseNumber: c.caseNumber,
          title: c.title,
          category: c.category,
          ward,
          publishedAt: c.publishedAt,
          resolved,
          resolvedAt: c.resolvedAt,
          daysToResolve:
            resolved && c.resolvedAt
              ? Math.max(0, Math.floor((c.resolvedAt.getTime() - c.createdAt.getTime()) / DAY_MS))
              : null,
          responses,
        };
      })
      .filter((item) => !wardFilter || item.ward === wardFilter);

    // Per-ward scorecard over the filtered set
    const byWard = new Map<string, { ward: string; total: number; resolved: number; awaiting: number; overdue: number; resolveDays: number[] }>();
    for (const item of items) {
      const key = item.ward || 'UNSPECIFIED';
      const row = byWard.get(key) || { ward: key, total: 0, resolved: 0, awaiting: 0, overdue: 0, resolveDays: [] };
      row.total += 1;
      if (item.resolved) row.resolved += 1;
      if (item.daysToResolve !== null) row.resolveDays.push(item.daysToResolve);
      row.awaiting += item.responses.filter((r) => !r.answered).length;
      row.overdue += item.responses.filter((r) => !r.answered && (r.overdue || r.escalationLevel > 0)).length;
      byWard.set(key, row);
    }
    const average = (values: number[]) =>
      values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null;

    const allDays = items.flatMap((i) => (i.daysToResolve !== null ? [i.daysToResolve] : []));
    const summary = {
      total: items.length,
      resolved: items.filter((i) => i.resolved).length,
      awaitingResponse: items.reduce((n, i) => n + i.responses.filter((r) => !r.answered).length, 0),
      overdueResponses: items.reduce(
        (n, i) => n + i.responses.filter((r) => !r.answered && (r.overdue || r.escalationLevel > 0)).length,
        0
      ),
      averageDaysToResolve: average(allDays),
    };

    const wards = [...byWard.values()]
      .map(({ resolveDays, ...row }) => ({ ...row, averageDaysToResolve: average(resolveDays) }))
      .sort((a, b) => b.total - a.total);

    // Site-wide counts (not limited to published cases or the ward filter) so the
    // home page can show real, counted totals. Aggregates only — no content.
    const [received, departmentsAsked, repliedRequests] = await Promise.all([
      prisma.intakeItem.count({ where: { sourceType: 'WEB_FORM' } }),
      prisma.responseRequest.count({ where: { status: { not: 'NOT_REQUESTED' } } }),
      prisma.responseRequest.findMany({
        where: { responseReceivedAt: { not: null } },
        select: { requestedAt: true, responseReceivedAt: true },
        take: 1000,
      }),
    ]);
    const replyDays = repliedRequests.map((r) =>
      Math.max(0, Math.floor((r.responseReceivedAt!.getTime() - r.requestedAt.getTime()) / DAY_MS))
    );
    const overall = {
      received,
      departmentsAsked,
      departmentsReplied: repliedRequests.length,
      averageReplyDays: average(replyDays),
    };

    return NextResponse.json(
      { generatedAt: new Date(now).toISOString(), overall, summary, wards, cases: items.slice(0, 100) },
      { headers: { ...corsHeaders, 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch (error) {
    console.error('Public feed error:', error);
    return NextResponse.json({ error: 'Unable to load public reports.' }, { status: 500, headers: corsHeaders });
  }
}
