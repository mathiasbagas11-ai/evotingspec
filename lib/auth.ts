import crypto from 'crypto';
import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Admin auth.
// Cookie value = HMAC-SHA256("admin", SESSION_SECRET) — BUKAN plaintext
// password. Password admin tidak pernah disimpan di cookie/browser.
// ─────────────────────────────────────────────────────────────

export const ADMIN_COOKIE = 'admin_session';
const MAX_AGE = 60 * 60 * 8; // 8 jam

function hmacAdmin(): string {
  const secret = process.env.SESSION_SECRET ?? '';
  return crypto.createHmac('sha256', secret).update('admin').digest('hex');
}

/** Timing-safe compare dua string. */
function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

/** Bandingkan password input dgn ADMIN_PASSWORD (timing-safe). */
export function verifyPassword(input: unknown): boolean {
  const expected = process.env.ADMIN_PASSWORD ?? '';
  if (!expected) return false;
  return safeEqual(String(input ?? ''), expected);
}

/** Opsi cookie untuk set session admin setelah login sukses. */
export function sessionCookie() {
  return {
    name: ADMIN_COOKIE,
    value: hmacAdmin(),
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: MAX_AGE,
    },
  };
}

/** Opsi cookie untuk logout (hapus). */
export function clearCookie() {
  return {
    name: ADMIN_COOKIE,
    value: '',
    options: {
      httpOnly: true,
      secure: true,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 0,
    },
  };
}

/** Cek cookie admin valid. Dipanggil di /tokens, /results, /stats. */
export function requireAdmin(req: NextRequest): boolean {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return safeEqual(token, hmacAdmin());
}
