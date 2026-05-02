'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import type { Permission } from '@/types';
import { hasPermission } from '@/lib/utils/permissions';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const checked = useRef(false);

  useEffect(() => {
    if (checked.current) return;
    checked.current = true;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
      router.replace('/not-authorized');
    }
  }, [isAuthenticated, user, requiredPermission, router]);

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <span className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (requiredPermission && !hasPermission(user.role, requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
