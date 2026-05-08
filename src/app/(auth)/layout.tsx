'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const _hasHydrated = useAuthStore((s) => s._hasHydrated);

  useEffect(() => {
    // Only redirect once the store has rehydrated — before that, isAuthenticated
    // is always false (default) and we'd never redirect a legitimate logged-in user.
    if (_hasHydrated && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {children}
    </div>
  );
}
