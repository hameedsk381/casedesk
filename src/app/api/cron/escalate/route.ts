import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { runResponseEscalation } from '@/lib/escalation/responseEscalation';

// External trigger for response escalation (e.g. a host cron or scheduler):
//   curl -X POST -H "Authorization: Bearer $CRON_SECRET" https://<casedesk>/api/cron/escalate
// Disabled unless CRON_SECRET is set. The app also runs this hourly by itself.

function isAuthorised(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const a = Buffer.from(token);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  if (!isAuthorised(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runResponseEscalation();
    return NextResponse.json(result);
  } catch (error) {
    console.error('[escalation] Cron run failed:', error);
    return NextResponse.json({ error: 'Escalation run failed' }, { status: 500 });
  }
}
