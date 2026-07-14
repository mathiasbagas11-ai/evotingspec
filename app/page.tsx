// Placeholder home. Halaman /vote & /admin dibangun di TAHAP 3.
export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-3xl font-bold">E-Voting</h1>
      <p className="text-gray-600">Sistem pemilihan dengan token cetak.</p>
      <div className="flex gap-4">
        <a href="/vote" className="rounded bg-blue-600 px-5 py-2 text-white">
          Masuk bilik suara
        </a>
        <a href="/admin" className="rounded border border-gray-300 px-5 py-2">
          Admin
        </a>
      </div>
    </main>
  );
}
