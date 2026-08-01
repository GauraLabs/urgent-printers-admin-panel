'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { refreshSession } from '@/lib/api/auth';
import { hasPermission } from '@/lib/utils/permissions';
import { Spinner } from '@/components/common/Spinner';
import type { Permission } from '@/types';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function AuthGuard({ children, requiredPermission }: AuthGuardProps) {
  const router = useRouter();
  const { user, isAuthenticated, token, setAuth, logout, _hasHydrated } = useAuthStore();
  const attempted = useRef(false);

  useEffect(() => {
    // Do nothing until Zustand has finished reading from localStorage.
    // On page reload this fires twice: once before hydration (noop) and
    // once after (_hasHydrated becomes true), which is when we act.
    if (!_hasHydrated) return;
    if (attempted.current) return;
    attempted.current = true;

    if (!isAuthenticated || !user) {
      router.replace('/login');
      return;
    }

    // Already have an in-memory token — nothing to do (normal navigation).
    if (token) return;

    // Authenticated but no token = page reload.
    // Refresh before children are allowed to render.
    refreshSession()
      .then(({ access_token, user: freshUser }) => {
        setAuth(freshUser, access_token);
      })
      .catch(() => {
        logout();
        router.replace('/login');
      });
  }, [_hasHydrated]); // eslint-disable-line react-hooks/exhaustive-deps

  // Render a spinner (blocking all children) until every condition is met:
  //   _hasHydrated — store values are final, not default zeros
  //   isAuthenticated + user — confirmed logged-in user
  //   token — valid access token ready for API calls
  if (!_hasHydrated || !isAuthenticated || !user || !token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Spinner size="lg" />
      </div>
    );
  }

  if (requiredPermission && !hasPermission(user, requiredPermission)) {
    return null;
  }

  return <>{children}</>;
}
