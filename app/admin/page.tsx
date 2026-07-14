'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHeader } from '@/components/BrandHeader';

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
  const [showPw, setShowPw] = useState(false);
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
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
      <BrandHeader subtitle="Panel Admin" />
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Masuk</h1>
        <p className="mt-1 text-sm text-gray-500">Masuk untuk mengelola pemilihan.</p>

        <div className="relative mt-5">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-lg border border-gray-300 px-4 py-3 pr-11 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPw ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.3 3.8M6.6 6.6C4.5 8 3 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path
                  d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
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

  const tabs: [Tab, string][] = [
    ['generate', 'Generate Token'],
    ['results', 'Hasil'],
    ['stats', 'Statistik Token'],
  ];

  return (
    <main className="mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between">
        <BrandHeader subtitle="Panel Admin" compact />
        <button
          onClick={logout}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
        >
          Keluar
        </button>
      </div>

      <div className="mt-6 inline-flex rounded-xl bg-gray-100 p-1">
        {tabs.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
              tab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
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

// ── Icon kecil buat tombol aksi ─────────────────────────────
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M5 15V5a2 2 0 012-2h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path
        d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-5a2 2 0 012-2h14a2 2 0 012 2v5a1 1 0 01-1 1h-2M6 14h12v7H6v-7z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-gray-500">Jumlah (maks 500)</span>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
          </label>
          <button
            onClick={generate}
            disabled={busy}
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {busy ? 'Membuat…' : 'Generate'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {tokens.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <textarea
            readOnly
            value={tokens.join('\n')}
            rows={8}
            className="w-full rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-sm"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={copyAll}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <CopyIcon /> Copy All
            </button>
            <button
              onClick={downloadCsv}
              className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              <DownloadIcon /> Download CSV
            </button>
            <button
              onClick={openPrint}
              className="flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
            >
              <PrintIcon /> Buka Halaman Print
            </button>
          </div>
          <p className="mt-3 text-sm text-gray-500">{tokens.length} token dibuat.</p>
        </div>
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

  const counts = results?.results.map((r) => r.count) ?? [];
  const leaderMax = counts.length ? Math.max(...counts) : 0;
  const barMax = Math.max(1, leaderMax);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button
          onClick={load}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
        >
          Refresh
        </button>
        <span className="text-sm text-gray-500">Auto-refresh tiap 30 detik</span>
      </div>

      <div className="flex gap-4">
        <Stat label="Total suara" value={results?.total ?? 0} tone="blue" />
        <Stat label="Token terpakai" value={stats?.used ?? 0} tone="indigo" />
      </div>

      <div className="space-y-4 rounded-xl bg-white p-5 shadow-sm">
        {results?.results.map((r) => {
          const pct = Math.round((r.count / barMax) * 100);
          const share = results.total ? Math.round((r.count / results.total) * 100) : 0;
          const isLeader = leaderMax > 0 && r.count === leaderMax;
          return (
            <div key={r.candidate_id}>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 font-medium">
                  {r.name}
                  {isLeader && (
                    <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      Unggul
                    </span>
                  )}
                </span>
                <span className="text-gray-500">
                  {r.count} suara ({share}%)
                </span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-blue-600 transition-all duration-500"
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
      <button
        onClick={load}
        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
      >
        Refresh
      </button>
      <div className="grid grid-cols-3 gap-4">
        <Stat label="Dicetak" value={stats?.total_generated ?? 0} tone="blue" />
        <Stat label="Terpakai" value={stats?.used ?? 0} tone="indigo" />
        <Stat label="Sisa" value={stats?.remaining ?? 0} tone="gray" />
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = 'blue',
}: {
  label: string;
  value: number;
  tone?: 'blue' | 'indigo' | 'gray';
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-50 text-blue-700',
    indigo: 'bg-indigo-50 text-indigo-700',
    gray: 'bg-gray-100 text-gray-700',
  };
  return (
    <div className={`flex-1 rounded-xl p-4 ${tones[tone]}`}>
      <div className="text-sm opacity-70">{label}</div>
      <div className="mt-1 text-3xl font-bold">{value}</div>
    </div>
  );
}
