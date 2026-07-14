import { NextResponse } from 'next/server';
import { clearCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/logout → hapus cookie
export async function POST() {
  const res = NextResponse.json({ ok: true });
  const c = clearCookie();
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
