// Palet gradient buat avatar kandidat yang belum punya foto.
// Warna dipilih deterministik dari nama, biar tiap kandidat konsisten
// dapet warna yang sama tiap render (bukan acak tiap refresh).
const PALETTE = [
  'from-blue-500 to-indigo-600',
  'from-violet-500 to-purple-600',
  'from-rose-500 to-pink-600',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-cyan-500 to-sky-600',
];

function paletteFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export function Avatar({
  name,
  photoUrl,
  size = 80,
}: {
  name: string;
  photoUrl?: string;
  size?: number;
}) {
  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={{ width: size, height: size }}
        className="flex-shrink-0 rounded-xl object-cover"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size }}
      className={`flex flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white ${paletteFor(
        name || '?'
      )}`}
    >
      <span style={{ fontSize: size * 0.4 }}>{(name || '?').charAt(0).toUpperCase()}</span>
    </div>
  );
}
