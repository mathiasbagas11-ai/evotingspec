import { NextResponse } from 'next/server';
import { callAppsScript } from '@/lib/appsScript';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// GET /api/candidates → getCandidates (publik, read-only)
export async function GET() {
  const res = await callAppsScript('getCandidates');
  return NextResponse.json(res);
}
