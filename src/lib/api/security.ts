import { NextResponse } from 'next/server';

export function pickAllowedFields<T extends Record<string, unknown>>(
  input: unknown,
  fields: readonly (keyof T)[]
): Partial<T> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};

  const source = input as T;
  return Object.fromEntries(
    fields
      .filter((field) => Object.prototype.hasOwnProperty.call(source, field))
      .map((field) => [field, source[field]])
  ) as Partial<T>;
}

/** Reject cross-site browser requests while preserving non-browser API clients. */
export function rejectCrossOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  let requestOrigin: string;
  try {
    const forwardedProto = request.headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    const forwardedHost = request.headers.get('x-forwarded-host')?.split(',')[0]?.trim();
    requestOrigin = forwardedHost
      ? `${forwardedProto || new URL(request.url).protocol.replace(':', '')}://${forwardedHost}`
      : new URL(request.url).origin;
  } catch {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  if (origin !== requestOrigin) {
    return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
  }

  return null;
}
