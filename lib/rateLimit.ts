import type { NextRequest } from 'next/server';

// ─────────────────────────────────────────────────────────────
// Rate limit in-memory. Nyegah brute-force nebak token.
// Max 10 percobaan / IP / 10 menit.
//
// Catatan: in-memory = per instance server. Cukup buat pemilu skala
// kecil-menengah. Kalau di-scale multi-instance, ganti ke Redis/Upstash.
// ─────────────────────────────────────────────────────────────

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();
const LIMIT = 10;
const WINDOW_MS = 10 * 60 * 1000; // 10 menit

/** Ambil IP client dari header proxy (Vercel set x-forwarded-for). */
export function clientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? 'unknown';
}

/**
 * Return true kalau request DIIZINKAN, false kalau kena limit.
 * Setiap panggilan yang diizinkan menambah counter.
 */
export function allowRequest(ip: string): boolean {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }

  if (entry.count >= LIMIT) return false;

  entry.count += 1;
  return true;
}
