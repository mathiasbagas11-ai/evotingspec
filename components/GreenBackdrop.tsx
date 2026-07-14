// Lingkaran dekoratif ala referensi VoteChain — blob hijau lembut di
// belakang konten. Fixed + pointer-events-none biar nggak ganggu.
export function GreenBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div className="absolute -left-24 -top-24 h-[28rem] w-[28rem] rounded-full bg-white/[0.035]" />
      <div className="absolute -right-20 top-16 h-96 w-96 rounded-full bg-white/[0.04]" />
      <div className="absolute -bottom-28 left-1/3 h-[26rem] w-[26rem] rounded-full bg-white/[0.03]" />
      <div className="absolute right-1/4 top-1/3 h-2.5 w-2.5 rounded-full bg-white/25" />
      <div className="absolute left-1/4 top-1/2 h-2 w-2 rounded-full bg-white/20" />
      <div className="absolute bottom-24 right-1/3 h-3 w-3 rounded-full bg-forest-accent/40" />
    </div>
  );
}
