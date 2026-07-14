'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandHeader } from '@/components/BrandHeader';
import { GreenBackdrop } from '@/components/GreenBackdrop';
import { Avatar } from '@/components/Avatar';

type Candidate = {
  id: string;
  name: string;
  photo_url: string;
  vision: string;
  age?: string;
  experience?: string;
};

// State machine eksplisit — JANGAN boolean flag berserakan.
type VoteState =
  | { step: 'ENTER_TOKEN'; error?: string }
  | { step: 'SHOW_BALLOT'; token: string; selected?: string; error?: string }
  | { step: 'SUBMITTING'; token: string; selected: string }
  | { step: 'SUCCESS' };

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

// ── Input token 6-kotak gaya OTP ──
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
          className="h-14 w-11 rounded-xl border-2 border-forest/15 bg-white text-center font-mono text-2xl font-bold uppercase text-forest transition focus:border-forest-accent focus:outline-none focus:ring-2 focus:ring-forest-accent/30 disabled:opacity-60 sm:h-16 sm:w-12"
        />
      ))}
    </div>
  );
}

// ── Confetti CSS-only, meriah ──
const CONFETTI_COLORS = ['#5cbb3f', '#f4b740', '#e2603b', '#3b82f6', '#a855f7', '#8ad06a', '#ffffff'];

function Confetti({ count = 80 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.4,
        duration: 2.6 + Math.random() * 2,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        size: 6 + Math.random() * 9,
        round: Math.random() > 0.6,
      })),
    [count]
  );
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={`absolute top-0 ${p.round ? 'rounded-full' : 'rounded-sm'}`}
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.round ? p.size : p.size * 0.45,
            backgroundColor: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animation: `confetti-fall ${p.duration}s ease-in ${p.delay}s infinite both`,
          }}
        />
      ))}
    </div>
  );
}

// ── Kartu kandidat: panah kiri = expand detail (foto besar + CV),
//    bulatan kanan = pilih. Dua aksi terpisah, nggak nyampur. ──
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
  const hasDetails = Boolean(c.age || c.experience || c.vision);

  return (
    <div
      className={`overflow-hidden rounded-2xl border-2 bg-white transition ${
        isSelected ? 'border-forest-accent ring-2 ring-forest-accent/30' : 'border-transparent'
      }`}
    >
      <div className="flex items-center gap-3 p-4">
        {hasDetails ? (
          <button
            type="button"
            onClick={onToggleExpand}
            aria-label={isExpanded ? 'Tutup detail' : 'Lihat detail lengkap'}
            className="flex-shrink-0 rounded-lg p-1.5 text-forest/50 transition hover:bg-forest/5"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            >
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <span className="w-8 flex-shrink-0" />
        )}

        <Avatar name={c.name} photoUrl={c.photo_url || undefined} size={56} />

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-forest">{c.name}</h2>
          {c.experience && <p className="truncate text-xs text-forest/55">{c.experience}</p>}
        </div>

        <button
          type="button"
          onClick={onSelect}
          disabled={disabled}
          aria-label={`Pilih ${c.name}`}
          className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full border-2 transition disabled:opacity-50 ${
            isSelected ? 'border-forest-accent bg-forest-accent text-white' : 'border-forest/25 hover:border-forest-accent'
          }`}
        >
          {isSelected && (
            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
              <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      </div>

      {isExpanded && hasDetails && (
        <div className="px-4 pb-4">
          <Avatar name={c.name} photoUrl={c.photo_url || undefined} className="mb-3 h-56 w-full" />
          <dl className="space-y-2 text-sm">
            {c.age && (
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 font-medium text-forest/50">Umur</dt>
                <dd className="text-forest/85">{c.age} tahun</dd>
              </div>
            )}
            {c.experience && (
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 font-medium text-forest/50">Pengalaman</dt>
                <dd className="text-forest/85">{c.experience}</dd>
              </div>
            )}
            {c.vision && (
              <div className="flex gap-2">
                <dt className="w-28 flex-shrink-0 font-medium text-forest/50">Harapan</dt>
                <dd className="text-forest/85">{c.vision}</dd>
              </div>
            )}
          </dl>
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
  const [confirmed, setConfirmed] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

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

    if (res.ok) setState({ step: 'SHOW_BALLOT', token });
    else setState({ step: 'ENTER_TOKEN', error: msg(res.code) });
  }

  function handleSelect(candidateId: string) {
    if (state.step !== 'SHOW_BALLOT') return;
    setConfirmed(false);
    setState({ step: 'SHOW_BALLOT', token: state.token, selected: candidateId });
  }

  async function handleCast() {
    if (state.step !== 'SHOW_BALLOT' || !state.selected || !confirmed) return;
    const { token, selected } = state;
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
      setConfirmed(false);
      setState({ step: 'SHOW_BALLOT', token, selected, error: msg(res.code) });
    } else {
      setTokenInput('');
      setConfirmed(false);
      setState({ step: 'ENTER_TOKEN', error: msg(res.code) });
    }
  }

  // ── SUCCESS ──
  if (state.step === 'SUCCESS') {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
        <GreenBackdrop />
        <Confetti count={90} />
        <BrandHeader onDark />
        <div className="relative w-full max-w-md rounded-3xl bg-forest-panel p-8 text-center shadow-2xl shadow-black/30">
          <div className="relative mx-auto mb-4 h-20 w-20">
            <span className="absolute inset-0 animate-ping rounded-full bg-forest-accent/40" />
            <div className="animate-pop-in relative flex h-20 w-20 items-center justify-center rounded-full bg-forest-accent text-white">
              <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10">
                <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="mb-1 text-3xl">🎉</div>
          <h1 className="font-display text-3xl font-bold text-forest">Suara Terkirim!</h1>
          <p className="mt-2 text-forest/70">
            Terima kasih sudah memilih. Suara kamu sudah tercatat secara anonim.
          </p>
        </div>
      </main>
    );
  }

  // ── ENTER_TOKEN ──
  if (state.step === 'ENTER_TOKEN') {
    return (
      <main className="relative flex min-h-screen flex-col items-center justify-center gap-8 overflow-hidden p-6">
        <GreenBackdrop />
        <BrandHeader onDark />
        <form onSubmit={handleVerify} className="w-full max-w-md rounded-3xl bg-forest-panel p-8 shadow-2xl shadow-black/30">
          <h1 className="text-center font-display text-3xl font-bold text-forest">Masukkan Token</h1>
          <p className="mt-1 text-center text-sm text-forest/60">
            Ketik 6 karakter token yang kamu terima.
          </p>

          <div className="mt-6">
            <TokenInput value={tokenInput} onChange={setTokenInput} disabled={verifying} />
          </div>

          {state.error && (
            <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-center text-sm text-red-700">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={verifying || tokenInput.trim().length !== 6}
            className="mt-6 w-full rounded-xl bg-forest-accent py-3 font-semibold text-forest-deep transition hover:bg-forest-accentDark disabled:cursor-not-allowed disabled:opacity-50"
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
    <main className="relative min-h-screen overflow-hidden p-6">
      <GreenBackdrop />
      <div className="mx-auto max-w-2xl">
        <BrandHeader subtitle="Surat Suara" onDark />

        <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-forest-accent">
          Panel Pemilihan
        </p>
        <h1 className="mt-1 font-display text-4xl font-bold text-white">Pilih Kandidat</h1>
        <p className="mt-1 text-sm text-white/60">Pilih satu kandidat, lalu tekan Kirim Suara.</p>

        <div className="mt-6 space-y-4">
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
          {candidates.length === 0 && <p className="text-sm text-white/50">Memuat kandidat…</p>}
        </div>

        {ballotError && (
          <p className="mt-4 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700">{ballotError}</p>
        )}

        {selectedCandidate && (
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl bg-white/10 p-4 ring-1 ring-white/15">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              disabled={submitting}
              className="mt-0.5 h-5 w-5 flex-shrink-0 rounded border-white/30 bg-transparent text-forest-accent focus:ring-forest-accent/40"
            />
            <span className="text-sm text-white/85">
              Saya memilih <span className="font-semibold text-white">{selectedCandidate.name}</span> sebagai
              pilihan saya. Suara tidak dapat diubah setelah dikirim.
            </span>
          </label>
        )}

        <div className="sticky bottom-4 mt-6">
          <button
            type="button"
            onClick={handleCast}
            disabled={submitting || !selected || !confirmed}
            className="w-full rounded-xl bg-forest-accent py-4 text-lg font-semibold text-forest-deep shadow-lg shadow-black/25 transition hover:bg-forest-accentDark disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Mengirim…' : 'Kirim Suara'}
          </button>
        </div>
      </div>
    </main>
  );
}
