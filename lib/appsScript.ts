// ─────────────────────────────────────────────────────────────
// SATU-SATUNYA file yang boleh menyebut script.google.com.
// Semua route handler manggil callAppsScript(), bukan fetch langsung.
// SHARED_SECRET disuntik di sini (server-side), tidak pernah ke browser.
// ─────────────────────────────────────────────────────────────

export type ApiResponse<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; code: string; error?: string };

export async function callAppsScript<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<ApiResponse<T>> {
  const url = process.env.APPS_SCRIPT_URL;
  const secret = process.env.SHARED_SECRET;

  if (!url || !secret) {
    return { ok: false, code: 'INVALID', error: 'Server env belum diset' };
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, action, ...payload }),
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok) return { ok: false, code: 'INVALID', error: `HTTP ${res.status}` };
    return (await res.json()) as ApiResponse<T>;
  } catch (err) {
    return { ok: false, code: 'INVALID', error: String(err) };
  }
}
