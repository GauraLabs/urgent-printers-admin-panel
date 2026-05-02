'use client';

import { useRouter } from 'next/navigation';
import { ShieldOff } from 'lucide-react';

export default function NotAuthorizedPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-full bg-[var(--danger-bg)] flex items-center justify-center mx-auto mb-5">
          <ShieldOff className="h-7 w-7 text-[var(--danger)]" />
        </div>
        <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Access Denied</h1>
        <p className="text-sm text-[var(--text-secondary)] mb-6">
          You don&apos;t have permission to view this page. Contact your administrator if you believe this is an error.
        </p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 text-sm bg-[var(--surface)] border border-[var(--border)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-secondary)] transition-colors"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
