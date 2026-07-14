'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ResultRow = { candidate_id: string; name: string; count: number };
type Results = { total: number; results: ResultRow[] };
type Stats = { total_generated: number; used: number; remaining: number };

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function AdminPage() {
  // null = masih cek sesi; false = belum login; true = login.
  const [authed, setAuthed] = useState<boolean | null>(null);

  // Cek sesi via endpoint ber-auth (cookie HttpOnly nggak kebaca JS).
  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center text-gray-400">
        Memuat…
      </main>
    );
  }

  return authed ? (
    <Dashboard onLogout={() => setAuthed(false)} />
  ) : (
    <LoginForm onSuccess={() => setAuthed(true)} />
  );
}

// ─────────────────────────────────────────────────────────────
function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    setBusy(false);
    if (res.ok) onSuccess();
    else setError('Password salah.');
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow">
        <h1 className="text-2xl font-bold">Admin</h1>
        <p className="mt-1 text-sm text-gray-500">Masuk untuk mengelola pemilihan.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Masuk…' : 'Masuk'}
        </button>
      </form>
    </main>
  );
}

// ─────────────────────────────────────────────────────────────
type Tab = 'generate' | 'results' | 'stats';

function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [tab, setTab] = useState<Tab>('generate');

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' }).catch(() => {});
    onLogout();
  }

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard Admin</h1>
        <button onClick={logout} className="text-sm text-gray-500 underline">
          Keluar
        </button>
      </div>

      <div className="mt-5 flex gap-2 border-b">
        {([
          ['generate', 'Generate Token'],
          ['results', 'Hasil'],
          ['stats', 'Statistik Token'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium ${
              tab === id
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-6">
        {tab === 'generate' && <GenerateTab />}
        {tab === 'results' && <ResultsTab />}
        {tab === 'stats' && <StatsTab />}
      </div>
    </main>
  );
}

// ── Tab 1: Generate ──────────────────────────────────────────
function GenerateTab() {
  const router = useRouter();
  const [count, setCount] = useState(150);
  const [tokens, setTokens] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate() {
    setBusy(true);
    setError('');
    const n = Math.min(500, Math.max(1, count || 0));
    const res = await fetch('/api/admin/tokens', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count: n }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false }));
    setBusy(false);
    if (res.ok) setTokens(res.data?.tokens ?? []);
    else setError('Gagal generate. Coba lagi.');
  }

  function copyAll() {
    navigator.clipboard.writeText(tokens.join('\n')).catch(() => {});
  }

  function downloadCsv() {
    const csv = 'token\n' + tokens.join('\n') + '\n';
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tokens-${todayStr()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openPrint() {
    try {
      sessionStorage.setItem('print_tokens', JSON.stringify(tokens));
    } catch {
      // abaikan
    }
    router.push('/admin/print');
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <span className="block text-gray-500">Jumlah (maks 500)</span>
          <input
            type="number"
            min={1}
            max={500}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2"
          />
        </label>
        <button
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {busy ? 'Membuat…' : 'Generate'}
        </button>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {tokens.length > 0 && (
        <>
          <textarea
            readOnly
            value={tokens.join('\n')}
            rows={8}
            className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm"
          />
          <div className="flex flex-wrap gap-3">
            <button onClick={copyAll} className="rounded-lg border px-4 py-2 text-sm">
              Copy All
            </button>
            <button onClick={downloadCsv} className="rounded-lg border px-4 py-2 text-sm">
              Download CSV
            </button>
            <button
              onClick={openPrint}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Buka Halaman Print
            </button>
          </div>
          <p className="text-sm text-gray-500">{tokens.length} token dibuat.</p>
        </>
      )}
    </div>
  );
}

// ── Tab 2: Hasil ─────────────────────────────────────────────
function ResultsTab() {
  const [results, setResults] = useState<Results | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetch('/api/admin/results').then((x) => x.json()).catch(() => null),
      fetch('/api/admin/stats').then((x) => x.json()).catch(() => null),
    ]);
    if (r?.ok) setResults(r.data);
    if (s?.ok) setStats(s.data);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000); // auto-refresh 30 detik
    return () => clearInterval(id);
  }, [load]);

  const max = Math.max(1, ...(results?.results.map((r) => r.count) ?? [0]));

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={load} className="rounded-lg border px-4 py-2 text-sm">
          Refresh
        </button>
        <span className="text-sm text-gray-500">Auto-refresh tiap 30 detik</span>
      </div>

      <div className="flex gap-4">
        <Stat label="Total suara" value={results?.total ?? 0} />
        <Stat label="Token terpakai" value={stats?.used ?? 0} />
      </div>

      <div className="space-y-3">
        {results?.results.map((r) => {
          const pct = max ? Math.round((r.count / max) * 100) : 0;
          const share = results.total
            ? Math.round((r.count / results.total) * 100)
            : 0;
          return (
            <div key={r.candidate_id}>
              <div className="flex justify-between text-sm">
                <span className="font-medium">{r.name}</span>
                <span className="text-gray-500">
                  {r.count} suara ({share}%)
                </span>
              </div>
              <div className="mt-1 h-4 w-full overflow-hidden rounded bg-gray-100">
                <div
                  className="h-full rounded bg-blue-600 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
        {!results && <p className="text-sm text-gray-400">Memuat…</p>}
      </div>
    </div>
  );
}

// ── Tab 3: Statistik ─────────────────────────────────────────
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const s = await fetch('/api/admin/stats')
      .then((x) => x.json())
      .catch(() => null);
    if (s?.ok) setStats(s.data);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <button onClick={load} className="rounded-lg border px-4 py-2 text-sm">
        Refresh
      </button>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Dicetak" value={stats?.total_generated ?? 0} />
        <Stat label="Terpakai" value={stats?.used ?? 0} />
        <Stat label="Sisa" value={stats?.remaining ?? 0} />
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex-1 rounded-xl bg-white p-4 shadow-sm">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}
