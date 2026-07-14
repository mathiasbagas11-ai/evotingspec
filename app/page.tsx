import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';
import { BallotIcon } from '@/components/BallotIcon';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
        <BallotIcon className="h-8 w-8" />
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">{ORG_NAME}</h1>
        <p className="mt-1 text-gray-500">{ORG_PERIOD}</p>
      </div>

      <p className="max-w-sm text-center text-sm text-gray-500">
        Pemilihan menggunakan token cetak — tanpa email, tanpa registrasi. Masukkan
        token yang kamu terima untuk memilih.
      </p>

      <div className="flex gap-3">
        <a
          href="/vote"
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white shadow-lg shadow-blue-600/20 transition hover:bg-blue-700"
        >
          Masuk Bilik Suara
        </a>
        <a
          href="/admin"
          className="rounded-xl border border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-100"
        >
          Admin
        </a>
      </div>
    </main>
  );
}
