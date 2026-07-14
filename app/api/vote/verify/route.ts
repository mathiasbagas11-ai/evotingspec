import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsScript';
import { allowRequest, clientIp } from '@/lib/rateLimit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/vote/verify → verifyToken  [rate-limited]
export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!allowRequest(ip)) {
    return NextResponse.json({ ok: false, code: 'RATE_LIMITED' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const token = (body as { token?: unknown }).token;

  const res = await callAppsScript('verifyToken', { token });
  return NextResponse.json(res);
}
