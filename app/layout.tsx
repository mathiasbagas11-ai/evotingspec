import type { Metadata } from 'next';
import './globals.css';
import { ORG_NAME, ORG_PERIOD } from '@/lib/brand';

export const metadata: Metadata = {
  title: `${ORG_NAME} ${ORG_PERIOD}`,
  description: `Sistem e-voting token cetak — ${ORG_NAME} ${ORG_PERIOD}`,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-gray-50 text-gray-900 antialiased">{children}</body>
    </html>
  );
}
