import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';
import { BrandHeader } from '@/components/BrandHeader';
import { GreenBackdrop } from '@/components/GreenBackdrop';

const PADDLES = [
  { n: '1', color: '#5cbb3f', text: '#0c3318', r: '-8deg' },
  { n: '2', color: '#f4b740', text: '#0c3318', r: '5deg' },
  { n: '3', color: '#e2603b', text: '#ffffff', r: '-4deg' },
  { n: '4', color: '#3b82f6', text: '#ffffff', r: '8deg' },
];

const FEATURES = [
  { title: 'Anonim', icon: 'shield' },
  { title: 'Satu Token Satu Suara', icon: 'ticket' },
  { title: 'Anti Suara Ganda', icon: 'lock' },
];

function FeatureIcon({ name }: { name: string }) {
  const common = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  if (name === 'shield')
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...common}>
        <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    );
  if (name === 'ticket')
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" {...common}>
        <path d="M3 9a2 2 0 012-2h14a2 2 0 012 2 2 2 0 000 4 2 2 0 01-2 2H5a2 2 0 01-2-2 2 2 0 000-4z" />
        <path d="M15 7v10" strokeDasharray="2 2" />
      </svg>
    );
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...common}>
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 018 0v3" />
    </svg>
  );
}

export default function Home() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden p-6">
      <GreenBackdrop />

      <div className="w-full max-w-lg rounded-3xl bg-forest-panel p-8 text-center shadow-2xl shadow-black/40 sm:p-10">
        <div className="flex justify-center">
          <BrandHeader />
        </div>

        {/* Paddles bernomor */}
        <div className="mt-8 flex items-end justify-center gap-2.5">
          {PADDLES.map((p, i) => (
            <div key={p.n} className="flex flex-col items-center" style={{ transform: `rotate(${p.r})` }}>
              <div
                className="animate-float flex h-16 w-12 items-center justify-center rounded-xl font-display text-2xl font-bold shadow-lg shadow-black/20 sm:h-20 sm:w-14 sm:text-3xl"
                style={{ backgroundColor: p.color, color: p.text, animationDelay: `${i * 0.3}s` }}
              >
                {p.n}
              </div>
              <div className="h-8 w-2 rounded-full bg-forest/15" />
            </div>
          ))}
        </div>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-forest-accentDark">
          Jadilah bagian dari keputusan
        </p>
        <h1 className="mt-2 font-display text-5xl font-bold leading-[1.05] text-forest">
          Saatnya Memilih.
        </h1>
        <p className="mx-auto mt-4 max-w-sm text-sm text-forest/70">
          {ORG_NAME} {ORG_PERIOD}. Pemilihan dengan token cetak — tanpa email, tanpa
          registrasi. Cukup masukkan token yang kamu terima.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href="/vote"
            className="rounded-xl bg-forest-accent px-7 py-3 font-semibold text-forest-deep shadow-lg shadow-forest-accent/20 transition hover:bg-forest-accentDark"
          >
            Mulai Memilih
          </a>
          <a
            href="/admin"
            className="rounded-xl border-2 border-forest/20 px-7 py-3 font-semibold text-forest transition hover:bg-forest/5"
          >
            Panel Admin
          </a>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 border-t border-forest/10 pt-6">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex items-center gap-2 text-forest/75">
              <span className="text-forest-accentDark">
                <FeatureIcon name={f.icon} />
              </span>
              <span className="text-xs font-medium">{f.title}</span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
