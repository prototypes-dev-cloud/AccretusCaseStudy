import type { Metadata } from 'next';
import './globals.css';
import { ensureDbReady } from '@/lib/startup';

export const metadata: Metadata = {
  title: 'ADE Partner Hub — Atlanta Deferred Exchange',
  description:
    'B2B portal for 1031 exchange referral partners to monitor client exchanges, track statutory deadlines, and generate co-branded client artifacts.',
};

// Run once at server startup — idempotent, safe to call on every cold start
ensureDbReady();

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
