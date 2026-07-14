'use client';

import { useEffect, useState } from 'react';

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
    if (!token || verifying) return;

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
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
            ✓
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
      <main className="min-h-screen flex items-center justify-center p-6">
        <form
          onSubmit={handleVerify}
          className="w-full max-w-md rounded-2xl bg-white p-8 shadow"
        >
          <h1 className="text-2xl font-bold">Masukkan Token</h1>
          <p className="mt-1 text-sm text-gray-500">
            Ketik 6 karakter token yang kamu terima.
          </p>

          <input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value.toUpperCase())}
            maxLength={6}
            inputMode="text"
            autoCapitalize="characters"
            autoComplete="off"
            spellCheck={false}
            placeholder="ABC123"
            className="mt-5 w-full rounded-lg border border-gray-300 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] uppercase focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />

          {state.error && (
            <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={verifying || tokenInput.trim().length === 0}
            className="mt-5 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {verifying ? 'Memeriksa…' : 'Lanjut'}
          </button>
        </form>
      </main>
    );
  }

  // ── SHOW_BALLOT / SUBMITTING ──
  const selected = state.step === 'SHOW_BALLOT' ? state.selected : state.selected;
  const submitting = state.step === 'SUBMITTING';
  const ballotError = state.step === 'SHOW_BALLOT' ? state.error : undefined;

  return (
    <main className="min-h-screen p-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">Surat Suara</h1>
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
                className={`flex gap-4 rounded-2xl border-2 bg-white p-4 text-left transition disabled:opacity-60 ${
                  isSel ? 'border-blue-600 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {c.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.photo_url}
                    alt={c.name}
                    className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-2xl text-gray-400">
                    {c.name?.charAt(0) || '?'}
                  </div>
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full border-2 text-xs ${
                        isSel ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300'
                      }`}
                    >
                      {isSel ? '✓' : ''}
                    </span>
                    <h2 className="truncate font-semibold">{c.name}</h2>
                  </div>
                  {c.vision && (
                    <p className="mt-1 text-sm text-gray-600">{c.vision}</p>
                  )}
                </div>
              </button>
            );
          })}
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
            className="w-full rounded-lg bg-blue-600 py-4 text-lg font-semibold text-white shadow-lg transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? 'Mengirim…' : 'Kirim Suara'}
          </button>
        </div>
      </div>
    </main>
  );
}
