import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';
import { BrandHeader } from '@/components/BrandHeader';
import { GreenBackdrop } from '@/components/GreenBackdrop';

const PADDLES = [
  { n: '1', color: '#e8f0e0', text: '#0c3318', h: 'h-28', r: '-8deg' },
  { n: '2', color: '#5cbb3f', text: '#0c3318', h: 'h-36', r: '6deg' },
  { n: '3', color: '#f4b740', text: '#0c3318', h: 'h-32', r: '-5deg' },
  { n: '4', color: '#e2603b', text: '#ffffff', h: 'h-24', r: '9deg' },
];

const FEATURES = [
  { title: 'Anonim & Rahasia', desc: 'Tanpa identitas pemilih', icon: 'shield' },
  { title: 'Satu Token Satu Suara', desc: 'Tidak bisa dipakai ulang', icon: 'ticket' },
  { title: 'Anti Suara Ganda', desc: 'Terkunci di server', icon: 'lock' },
];

function FeatureIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'shield')
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  if (name === 'ticket')
    return (
      <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
        <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4z" />
        <path d="M15 7v10" strokeDasharray="2 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" {...common}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-6">
      <GreenBackdrop />

      {/* Nav */}
      <nav className="mx-auto flex max-w-6xl items-center justify-between">
        <BrandHeader onDark />
        <div className="flex items-center gap-2">
          <a
            href="/admin"
            className="rounded-full px-4 py-2 text-sm font-medium text-white/80 transition hover:text-white"
          >
            Admin
          </a>
          <a
            href="/vote"
            className="rounded-full bg-forest-accent px-5 py-2 text-sm font-semibold text-forest-deep transition hover:bg-forest-accentDark"
          >
            Masuk
          </a>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto mt-10 grid max-w-6xl items-center gap-10 md:mt-16 md:grid-cols-2">
        {/* Paddles */}
        <div className="flex items-end justify-center gap-3 md:justify-start">
          {PADDLES.map((p, i) => (
            <div key={p.n} className="flex flex-col items-center" style={{ transform: `rotate(${p.r})` }}>
              <div
                className={`animate-float flex w-16 items-center justify-center rounded-2xl font-display text-4xl font-bold shadow-xl shadow-black/30 sm:w-20 ${p.h}`}
                style={{ backgroundColor: p.color, color: p.text, animationDelay: `${i * 0.3}s` }}
              >
                {p.n}
              </div>
              <div className="h-16 w-2.5 rounded-full bg-white/15" />
            </div>
          ))}
        </div>

        {/* Copy */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-forest-accent">
            Jadilah bagian dari keputusan
          </p>
          <h1 className="mt-3 font-display text-5xl font-bold leading-[1.05] text-white sm:text-6xl">
            Saatnya
            <br />
            Memilih.
          </h1>
          <p className="mt-5 max-w-md text-white/70">
            {ORG_NAME} {ORG_PERIOD}. Pemilihan dengan token cetak — tanpa email, tanpa
            registrasi. Cukup masukkan token yang kamu terima.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a
              href="/vote"
              className="rounded-xl bg-forest-accent px-7 py-3 font-semibold text-forest-deep shadow-lg shadow-black/20 transition hover:bg-forest-accentDark"
            >
              Mulai Memilih
            </a>
            <a
              href="/admin"
              className="rounded-xl border border-white/25 px-7 py-3 font-semibold text-white transition hover:bg-white/10"
            >
              Panel Admin
            </a>
          </div>
        </div>
      </section>

      {/* Feature bar */}
      <section className="mx-auto mt-16 max-w-6xl rounded-3xl bg-forest-deep/80 p-6 ring-1 ring-white/10 md:mt-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-forest-accent/15 text-forest-accent">
                <FeatureIcon name={f.icon} />
              </div>
              <div>
                <div className="text-sm font-semibold text-white">{f.title}</div>
                <div className="text-xs text-white/55">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
