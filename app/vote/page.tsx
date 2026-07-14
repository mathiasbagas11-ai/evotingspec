'use client';

import { useEffect, useRef, useState } from 'react';
import { BrandHeader } from '@/components/BrandHeader';
import { Avatar } from '@/components/Avatar';

type Candidate = { id: string; name: string; photo_url: string; vision: string };

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

export default function VotePage() {
  const [state, setState] = useState<VoteState>({ step: 'ENTER_TOKEN' });
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [tokenInput, setTokenInput] = useState('');
  const [verifying, setVerifying] = useState(false);

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

  async function handleCast() {
    if (state.step !== 'SHOW_BALLOT' || !state.selected) return;
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
      setState({ step: 'SHOW_BALLOT', token, selected, error: msg(res.code) });
    } else {
      // USED / BAD_CANDIDATE / INVALID → balik ke input token.
      setTokenInput('');
      setState({ step: 'ENTER_TOKEN', error: msg(res.code) });
    }
  }

  // ── SUCCESS: terminal state. Tidak ada tombol back / vote lagi. ──
  if (state.step === 'SUCCESS') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-6">
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

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <BrandHeader subtitle="Surat Suara" />

        <h1 className="mt-6 text-2xl font-bold">Pilih Kandidat</h1>
        <p className="mt-1 text-sm text-gray-500">
          Pilih satu kandidat, lalu tekan Kirim Suara.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {candidates.map((c) => {
            const isSel = selected === c.id;
            return (
              <button
                key={c.id}
                type="button"
                disabled={submitting}
                onClick={() =>
                  state.step === 'SHOW_BALLOT' &&
                  setState({ step: 'SHOW_BALLOT', token: state.token, selected: c.id })
                }
                className={`flex gap-4 rounded-2xl border-2 bg-white p-4 text-left shadow-sm transition disabled:opacity-60 ${
                  isSel
                    ? 'border-blue-600 ring-2 ring-blue-100'
                    : 'border-transparent hover:border-gray-200'
                }`}
              >
                <Avatar name={c.name} photoUrl={c.photo_url || undefined} size={72} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="truncate font-semibold">{c.name}</h2>
                    <span
                      className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 text-xs ${
                        isSel ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {isSel && (
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
                    <p className="mt-1 line-clamp-3 text-sm text-gray-600">{c.vision}</p>
                  )}
                </div>
              </button>
            );
          })}
          {candidates.length === 0 && (
            <p className="text-sm text-gray-400">Memuat kandidat…</p>
          )}
        </div>

        {ballotError && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {ballotError}
          </p>
        )}

        <div className="sticky bottom-4 mt-6">
          <button
            type="button"
            onClick={handleCast}
            disabled={submitting || !selected}
            className="w-full rounded-xl bg-blue-600 py-4 text-lg font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Mengirim…' : 'Kirim Suara'}
          </button>
        </div>
      </div>
    </main>
  );
}
