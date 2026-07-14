import { NextRequest, NextResponse } from 'next/server';
import { verifyPassword, sessionCookie } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST /api/admin/login → set HTTP-only cookie kalau password benar
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const password = (body as { password?: unknown }).password;

  if (!verifyPassword(password)) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  const c = sessionCookie();
  res.cookies.set(c.name, c.value, c.options);
  return res;
}
