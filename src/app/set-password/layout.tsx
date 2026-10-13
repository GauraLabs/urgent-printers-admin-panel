import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Set Password',
  robots: { index: false, follow: false, nocache: true },
  referrer: 'no-referrer',
};

export default function SetPasswordLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
