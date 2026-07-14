import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsScript';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/tokens → [AUTH] generateTokens
export async function POST(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const count = (body as { count?: unknown }).count;

  const res = await callAppsScript('generateTokens', { count });
  return NextResponse.json(res);
}
