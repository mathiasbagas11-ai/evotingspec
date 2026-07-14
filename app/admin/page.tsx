'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandHeader } from '@/components/BrandHeader';
import { GreenBackdrop } from '@/components/GreenBackdrop';

type ResultRow = { candidate_id: string; name: string; count: number };
type Results = { total: number; results: ResultRow[] };
type Stats = { total_generated: number; used: number; remaining: number };

const CHART_COLORS = ['#5cbb3f', '#f4b740', '#e2603b', '#3b82f6', '#a855f7', '#14b8a6'];

function todayStr(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false));
  }, []);

  if (authed === null) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/50">Memuat…</main>
    );
  }

  return authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <LoginForm onSuccess={() => setAuthed(true)} />;
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
    <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
      <GreenBackdrop />
      <BrandHeader subtitle="Panel Admin" onDark />
      <form onSubmit={submit} className="w-full max-w-sm rounded-3xl bg-forest-panel p-8 shadow-2xl shadow-black/30">
        <h1 className="font-display text-3xl font-bold text-forest">Masuk</h1>
        <p className="mt-1 text-sm text-forest/60">Masuk untuk mengelola pemilihan.</p>

        <div className="relative mt-5">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoFocus
            className="w-full rounded-xl border-2 border-forest/15 bg-white px-4 py-3 pr-11 text-forest focus:border-forest-accent focus:outline-none focus:ring-2 focus:ring-forest-accent/30"
          />
          <button
            type="button"
            onClick={() => setShowPw((v) => !v)}
            aria-label={showPw ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-forest/40 hover:text-forest/70"
          >
            {showPw ? (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4 10 7-.4 1.2-1.2 2.6-2.3 3.8M6.6 6.6C4.5 8 3 10 2 12c1 3 5 7 10 7 1.4 0 2.7-.3 3.9-.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5">
                <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            )}
          </button>
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-xl bg-forest-accent py-3 font-semibold text-forest-deep transition hover:bg-forest-accentDark disabled:opacity-50"
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
    <main className="relative min-h-screen overflow-hidden p-6">
      <GreenBackdrop />
      <div className="mx-auto max-w-3xl">
        <div className="flex items-center justify-between">
          <BrandHeader subtitle="Panel Admin" compact onDark />
          <button
            onClick={logout}
            className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10"
          >
            Keluar
          </button>
        </div>

        <h1 className="mt-8 font-display text-4xl font-bold text-white">Dashboard Admin</h1>

        <div className="mt-5 inline-flex rounded-2xl bg-white/10 p-1 ring-1 ring-white/10">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                tab === id ? 'bg-forest-accent text-forest-deep' : 'text-white/70 hover:text-white'
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
      </div>
    </main>
  );
}

// ── Icons ──
function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <rect x="9" y="9" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.8" />
      <path d="M5 15V5a2 2 0 012-2h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function PrintIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
      <path d="M6 9V3h12v6M6 18H4a1 1 0 01-1-1v-5a2 2 0 012-2h14a2 2 0 012 2v5a1 1 0 01-1 1h-2M6 14h12v7H6v-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Donut chart (SVG murni) ──
function Donut({ rows, total }: { rows: ResultRow[]; total: number }) {
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  const segments = total
    ? rows.map((r, i) => {
        const frac = r.count / total;
        const seg = { color: CHART_COLORS[i % CHART_COLORS.length], dash: frac * C, offset };
        offset += frac * C;
        return seg;
      })
    : [];

  return (
    <div className="relative h-40 w-40 flex-shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={R} fill="none" stroke="#0a2a14" strokeWidth="14" />
        {segments.map((s, i) => (
          <circle
            key={i}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${s.dash} ${C - s.dash}`}
            strokeDashoffset={-s.offset}
          />
        ))}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold text-white">{total}</span>
        <span className="text-xs text-white/50">suara</span>
      </div>
    </div>
  );
}

// ── Tab 1: Generate ──
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
      /* abaikan */
    }
    router.push('/admin/print');
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-forest-panel p-5 shadow-lg shadow-black/10">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="block text-forest/55">Jumlah (maks 500)</span>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="mt-1 w-32 rounded-lg border-2 border-forest/15 bg-white px-3 py-2 text-forest focus:border-forest-accent focus:outline-none"
            />
          </label>
          <button
            onClick={generate}
            disabled={busy}
            className="rounded-lg bg-forest-accent px-5 py-2 font-semibold text-forest-deep transition hover:bg-forest-accentDark disabled:opacity-50"
          >
            {busy ? 'Membuat…' : 'Generate'}
          </button>
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {tokens.length > 0 && (
        <div className="rounded-2xl bg-forest-panel p-5 shadow-lg shadow-black/10">
          <textarea
            readOnly
            value={tokens.join('\n')}
            rows={8}
            className="w-full rounded-lg border-2 border-forest/10 bg-white p-3 font-mono text-sm text-forest"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={copyAll} className="flex items-center gap-2 rounded-lg border-2 border-forest/15 px-4 py-2 text-sm font-medium text-forest transition hover:bg-forest/5">
              <CopyIcon /> Copy All
            </button>
            <button onClick={downloadCsv} className="flex items-center gap-2 rounded-lg border-2 border-forest/15 px-4 py-2 text-sm font-medium text-forest transition hover:bg-forest/5">
              <DownloadIcon /> Download CSV
            </button>
            <button onClick={openPrint} className="flex items-center gap-2 rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-white transition hover:bg-forest-deep">
              <PrintIcon /> Buka Halaman Print
            </button>
          </div>
          <p className="mt-3 text-sm text-forest/55">{tokens.length} token dibuat.</p>
        </div>
      )}
    </div>
  );
}

// ── Tab 2: Hasil ──
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
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  const counts = results?.results.map((r) => r.count) ?? [];
  const leaderMax = counts.length ? Math.max(...counts) : 0;
  const barMax = Math.max(1, leaderMax);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-4">
        <button onClick={load} className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10">
          Refresh
        </button>
        <span className="text-sm text-white/55">Auto-refresh tiap 30 detik</span>
      </div>

      <div className="rounded-2xl bg-forest-deep/70 p-6 ring-1 ring-white/10">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center">
          <Donut rows={results?.results ?? []} total={results?.total ?? 0} />
          <div className="w-full flex-1 space-y-3">
            {results?.results.map((r, i) => {
              const pct = Math.round((r.count / barMax) * 100);
              const share = results.total ? Math.round((r.count / results.total) * 100) : 0;
              const isLeader = leaderMax > 0 && r.count === leaderMax;
              return (
                <div key={r.candidate_id}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 font-medium text-white">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {r.name}
                      {isLeader && (
                        <span className="rounded-full bg-forest-accent/20 px-2 py-0.5 text-xs font-semibold text-forest-accent">Unggul</span>
                      )}
                    </span>
                    <span className="text-white/60">{r.count} ({share}%)</span>
                  </div>
                  <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                  </div>
                </div>
              );
            })}
            {!results && <p className="text-sm text-white/50">Memuat…</p>}
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Stat label="Total suara" value={results?.total ?? 0} />
        <Stat label="Token terpakai" value={stats?.used ?? 0} />
      </div>
    </div>
  );
}

// ── Tab 3: Statistik ──
function StatsTab() {
  const [stats, setStats] = useState<Stats | null>(null);

  const load = useCallback(async () => {
    const s = await fetch('/api/admin/stats').then((x) => x.json()).catch(() => null);
    if (s?.ok) setStats(s.data);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30_000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-4">
      <button onClick={load} className="rounded-full border border-white/25 px-4 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10">
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
    <div className="flex-1 rounded-2xl bg-forest-panel p-4 shadow-lg shadow-black/10">
      <div className="text-sm text-forest/55">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold text-forest">{value}</div>
    </div>
  );
}
