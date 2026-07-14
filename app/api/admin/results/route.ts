import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsScript';
import { requireAdmin } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/admin/results → [AUTH] getResults
export async function GET(req: NextRequest) {
  if (!requireAdmin(req)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const res = await callAppsScript('getResults');
  return NextResponse.json(res);
}
