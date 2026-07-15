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

// `size` = avatar kotak ukuran tetap (px), buat baris/list.
// `className` (tanpa `size`) = biarkan lebar/tinggi diatur via class
// (mis. "h-52 w-full") buat foto banner besar di panel expand.
export function Avatar({
  name,
  photoUrl,
  size,
  className = '',
}: {
  name: string;
  photoUrl?: string;
  size?: number;
  className?: string;
}) {
  const dims = size ? { width: size, height: size } : undefined;
  const shrink = size ? 'flex-shrink-0' : '';

  if (photoUrl) {
    // size (kotak tetap) -> object-cover, boleh crop biar pas kotak.
    // Tanpa size (banner) -> TIDAK di-crop, tinggi ngikutin lebar penuh
    // sesuai rasio asli foto (object-cover disini malah bikin kepotong).
    const fit = size ? 'object-cover' : '';
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt={name}
        style={dims}
        className={`rounded-xl ${fit} ${shrink} ${className}`}
      />
    );
  }
  return (
    <div
      style={dims}
      className={`flex items-center justify-center rounded-xl bg-gradient-to-br font-bold text-white ${paletteFor(
        name || '?'
      )} ${shrink} ${className}`}
    >
      <span style={size ? { fontSize: size * 0.4 } : undefined} className={size ? '' : 'text-7xl'}>
        {(name || '?').charAt(0).toUpperCase()}
      </span>
    </div>
  );
}
