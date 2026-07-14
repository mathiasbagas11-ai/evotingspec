'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandHeader } from '@/components/BrandHeader';
import { Avatar } from '@/components/Avatar';

type Candidate = {
  id: string;
  name: string;
  photo_url: string;
  vision: string;
  age?: string;
  education?: string;
};

// State machine eksplisit — JANGAN boolean flag berserakan.
type VoteState =
  | { step: 'ENTER_TOKEN'; error?: string }
  | { step: 'SHOW_BALLOT'; token: string; selected?: string; error?: string }
  | { step: 'SUBMITTING'; token: string; selected: string }
  | { step: 'SUCCESS' };

// Mapping code → copy (frontend switch by code, bukan message string).
const COPY: Record<string, string> = {
  INVALID: 'Token tidak valid. Cek lagi kodenya.',
  USED: 'Token ini sudah digunakan untuk memilih.',
  LOCK_TIMEOUT: 'Server sibuk. Coba lagi sebentar.',
  RATE_LIMITED: 'Terlalu banyak percobaan. Tunggu 10 menit.',
  BAD_CANDIDATE: 'Pilihan tidak valid. Muat ulang halaman.',
};

function msg(code?: string): string {
  return (code && COPY[code]) || 'Terjadi kesalahan. Coba lagi sebentar.';
}

// ── Input token 6-kotak, gaya OTP: auto-pindah fokus, backspace mundur,
//    paste sekaligus. Tetap 1 sumber kebenaran: string `value` di parent. ──
function TokenInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([]);
  const chars = Array.from({ length: 6 }, (_, i) => value[i] ?? '');

  useEffect(() => {
    refs.current[0]?.focus();
  }, []);

  function setChar(i: number, raw: string) {
    const clean = raw.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(-1);
    const next = chars.slice();
    next[i] = clean;
    onChange(next.join('').replace(/\s+$/, ''));
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !chars[i] && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) refs.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) refs.current[i + 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 6);
    onChange(text);
    refs.current[Math.min(text.length, 5)]?.focus();
  }

  return (
    <div className="flex justify-center gap-2" onPaste={handlePaste}>
      {chars.map((ch, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={ch}
          onChange={(e) => setChar(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          inputMode="text"
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          maxLength={1}
          aria-label={`Karakter token ${i + 1}`}
          className="h-14 w-11 rounded-lg border border-gray-300 text-center font-mono text-2xl font-bold uppercase transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-50 sm:h-16 sm:w-12"
        />
      ))}
    </div>
  );
}

// ── Confetti ringan, CSS-only, buat layar sukses. ──
const CONFETTI_COLORS = ['#2563eb', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 2.4 + Math.random() * 1.4,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 6,
      })),
    []
  );

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.4,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s 1 both`,
          }}
        />
      ))}
    </div>
  );
}

// ── Kartu kandidat: expandable buat nampilin CV (umur, pendidikan). ──
function CandidateCard({
  candidate,
  isSelected,
  isExpanded,
  disabled,
  onSelect,
  onToggleExpand,
}: {
  candidate: Candidate;
  isSelected: boolean;
  isExpanded: boolean;
  disabled: boolean;
  onSelect: () => void;
  onToggleExpand: () => void;
}) {
  const c = candidate;
  const hasCv = Boolean(c.age || c.education);

  return (
    <div
      className={`rounded-2xl border-2 bg-white shadow-sm transition ${
        isSelected ? 'border-blue-600 ring-2 ring-blue-100' : 'border-transparent'
      }`}
    >
      <button
        type="button"
        disabled={disabled}
        onClick={onSelect}
        className="flex w-full gap-4 p-4 text-left disabled:opacity-60"
      >
        <Avatar name={c.name} photoUrl={c.photo_url || undefined} size={72} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="truncate font-semibold">{c.name}</h2>
            <span
              className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
              }`}
            >
              {isSelected && (
                <svg viewBox="0 0 24 24" fill="none" className="h-3 w-3">
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
          </div>
          {c.vision && (
            <p className={`mt-1 text-sm text-gray-600 ${isExpanded ? '' : 'line-clamp-2'}`}>
              {c.vision}
            </p>
          )}
        </div>
      </button>

      {hasCv && (
        <div className="border-t border-gray-100 px-4">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="flex w-full items-center justify-between py-2.5 text-sm font-medium text-blue-600"
          >
            {isExpanded ? 'Sembunyikan CV' : 'Lihat CV'}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
            >
              <path
                d="M6 9l6 6 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          {isExpanded && (
            <dl className="grid grid-cols-2 gap-3 pb-4 text-sm">
              {c.age && (
                <div>
                  <dt className="text-gray-400">Umur</dt>
                  <dd className="font-medium">{c.age} tahun</dd>
                </div>
              )}
              {c.education && (
                <div>
                  <dt className="text-gray-400">Pendidikan</dt>
                  <dd className="font-medium">{c.education}</dd>
                </div>
              )}
            </dl>
          )}
        </div>
      )}
    </div>
  );
}

export default function VotePage() {
  const [state, setState] = useState<VoteState>({ step: 'ENTER_TOKEN' });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  // Kandidat read-only publik. Fetch sekali di awal.
  useEffect(() => {
    fetch('/api/candidates')
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setCandidates(d.data ?? []);
      })
      .catch(() => {});
  }, []);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const token = tokenInput.trim().toUpperCase();
    if (token.length !== 6 || verifying) return;

    setVerifying(true);
    const res = await fetch('/api/vote/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, code: 'INVALID' }));
    setVerifying(false);

    if (res.ok) {
      setState({ step: 'SHOW_BALLOT', token });
    } else {
      setState({ step: 'ENTER_TOKEN', error: msg(res.code) });
    }
  }

  function handleSelect(candidateId: string) {
    if (state.step !== 'SHOW_BALLOT') return;
    setConfirmed(false); // ganti pilihan → wajib konfirmasi ulang
    setState({ step: 'SHOW_BALLOT', token: state.token, selected: candidateId });
  }

  async function handleCast() {
    if (state.step !== 'SHOW_BALLOT' || !state.selected || !confirmed) return;
    const { token, selected } = state;

    // Pindah ke SUBMITTING → tombol ke-disable. Guard utama anti double-vote.
    setState({ step: 'SUBMITTING', token, selected });

    const res = await fetch('/api/vote/cast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, candidateId: selected }),
    })
      .then((r) => r.json())
      .catch(() => ({ ok: false, code: 'LOCK_TIMEOUT' }));

    if (res.ok) {
      setState({ step: 'SUCCESS' });
    } else if (res.code === 'LOCK_TIMEOUT') {
      // Server sibuk → balik ke ballot, boleh coba lagi (token belum hangus).
      setConfirmed(false);
      setState({ step: 'SHOW_BALLOT', token, selected, error: msg(res.code) });
    } else {
      // USED / BAD_CANDIDATE / INVALID → balik ke input token.
      setTokenInput('');
      setConfirmed(false);
      setState({ step: 'ENTER_TOKEN', error: msg(res.code) });
    }
  }

  // ── SUCCESS: terminal state. Tidak ada tombol back / vote lagi. ──
  if (state.step === 'SUCCESS') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        <Confetti />
        <BrandHeader />
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="animate-pop-in mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-green-600">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8">
              <path
                d="M5 13l4 4L19 7"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-green-700">Suara Terkirim</h1>
          <p className="mt-2 text-gray-600">
            Terima kasih sudah memilih. Suara kamu sudah tercatat secara anonim.
          </p>
        </div>
      </main>
    );
  }

  // ── ENTER_TOKEN ──
  if (state.step === 'ENTER_TOKEN') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
        <BrandHeader />
        <form
          onSubmit={handleVerify}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm"
        >
          <h1 className="text-center text-2xl font-bold">Masukkan Token</h1>
          <p className="mt-1 text-center text-sm text-gray-500">
            Ketik 6 karakter token yang kamu terima.
          </p>

          <div className="mt-6">
            <TokenInput value={tokenInput} onChange={setTokenInput} disabled={verifying} />
          </div>

          {state.error && (
            <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-center text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || tokenInput.trim().length !== 6}
            className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? 'Memeriksa…' : 'Lanjut'}
          </button>
        </form>
      </main>
    );
  }

  // ── SHOW_BALLOT / SUBMITTING ──
  const selected = state.selected;
  const submitting = state.step === 'SUBMITTING';
  const ballotError = state.step === 'SHOW_BALLOT' ? state.error : undefined;
  const selectedCandidate = candidates.find((c) => c.id === selected);

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <BrandHeader subtitle="Surat Suara" />

        <h1 className="mt-6 text-2xl font-bold">Pilih Kandidat</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pilih satu kandidat, lalu tekan Kirim Suara.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {candidates.map((c) => (
            <CandidateCard
              key={c.id}
              candidate={c}
              isSelected={selected === c.id}
              isExpanded={expanded === c.id}
              disabled={submitting}
              onSelect={() => handleSelect(c.id)}
              onToggleExpand={() => setExpanded(expanded === c.id ? null : c.id)}
            />
          ))}
          {candidates.length === 0 && (
            <p className="text-sm text-gray-400">Memuat kandidat…</p>
          )}
        </div>

        {ballotError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ballotError}
          </p>
        )}

        {selectedCandidate && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-white p-4 shadow-sm">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-blue-200"
            />
            <span className="text-sm text-gray-700">
              Saya memilih <span className="font-semibold">{selectedCandidate.name}</span> sebagai
              pilihan saya. Suara tidak dapat diubah setelah dikirim.
            </span>
          </label>
        )}

        <div className="sticky bottom-4 mt-6">
          <button
            type="button"
            onClick={handleCast}
            disabled={submitting || !selected || !confirmed}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Mengirim…' : 'Kirim Suara'}
          </button>
        </div>
      </div>
    </main>
  );
}
