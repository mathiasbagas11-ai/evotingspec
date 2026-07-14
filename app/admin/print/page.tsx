'use client';

import { useEffect, useMemo, useState } from 'react';

// Fisher-Yates shuffle. WAJIB: urutan cetak ≠ urutan generate, biar
// urutan potongan tidak bisa dipetakan ke urutan daftar hadir.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 10mm; }
  .no-print { display: none !important; }
  .token-cell {
    break-inside: avoid;
    page-break-inside: avoid;
  }
}
`;

export default function PrintPage() {
  const [text, setText] = useState('');
  const [cols, setCols] = useState(3);

  // Terima token dari sessionStorage (di-set halaman generate).
  useEffect(() => {
    try {
      const s = sessionStorage.getItem('print_tokens');
      if (s) {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) setText(arr.join('\n'));
      }
    } catch {
      // abaikan
    }
  }, []);

  // Parse + shuffle. Di-memo pada `text` → shuffle sekali tiap ganti isi.
  const tokens = useMemo(() => {
    const list = text
      .split(/\s+/)
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);
    return shuffle(list);
  }, [text]);

  return (
    <main className="min-h-screen p-6">
      {/* eslint-disable-next-line react/no-danger */}
      <style dangerouslySetInnerHTML={{ __html: PRINT_CSS }} />

      {/* Kontrol layar — hilang saat print */}
      <div className="no-print mx-auto mb-6 max-w-3xl space-y-4">
        <h1 className="text-2xl font-bold">Cetak Token</h1>
        <p className="text-sm text-gray-500">
          Token diacak otomatis sebelum dicetak. Gunting per kotak sesuai garis
          putus-putus. Tidak ada nomor urut / QR — tiap potongan anonim.
        </p>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          placeholder="Tempel token di sini (1 per baris) — atau datang dari halaman Generate"
          className="w-full rounded-lg border border-gray-300 p-3 font-mono text-sm"
        />

        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            Kolom:
            <input
              type="number"
              min={1}
              max={5}
              value={cols}
              onChange={(e) =>
                setCols(Math.min(5, Math.max(1, Number(e.target.value) || 3)))
              }
              className="w-16 rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <span className="text-sm text-gray-500">{tokens.length} token</span>
          <button
            onClick={() => window.print()}
            className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
          >
            Print
          </button>
        </div>
      </div>

      {/* Grid potongan */}
      <div
        className="mx-auto grid max-w-3xl gap-0"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        {tokens.map((t, i) => (
          <div
            key={`${t}-${i}`}
            className="token-cell flex flex-col items-center justify-center border border-dashed border-gray-400 px-2 py-6 text-center"
          >
            <div className="text-[8pt] uppercase tracking-wide text-gray-400">
              Token Pemilihan
            </div>
            <div className="my-2 font-mono text-[28pt] font-bold leading-none tracking-widest">
              {t}
            </div>
            <div className="w-full select-none text-[8pt] text-gray-300">
              ✂ — — — — — — — — — —
            </div>
          </div>
        ))}
      </div>

      {tokens.length === 0 && (
        <p className="no-print mt-10 text-center text-gray-400">
          Belum ada token. Tempel token di kotak atas.
        </p>
      )}
    </main>
  );
}
