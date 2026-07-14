import { NextRequest, NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsScript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/vote/cast → castVote
// candidateId TETAP divalidasi ulang di Apps Script (server tak percaya client).
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { token, candidateId } = body as { token?: unknown; candidateId?: unknown };

  const res = await callAppsScript('castVote', { token, candidateId });
  return NextResponse.json(res);
}
